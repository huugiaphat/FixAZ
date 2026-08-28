import { createClient } from "@/lib/supabase/client";
import { offlineDb, type HangDoiItem } from "./db";

// Ghi dữ liệu (insert/update) trên các màn hình Thợ ngoài hiện trường.
// Nếu mất mạng (khu vực sóng yếu — Mục 10), tự động lưu tạm vào
// IndexedDB và đồng bộ lại khi có mạng (xem lib/offline/sync.ts),
// thay vì làm mất dữ liệu Thợ vừa nhập.
export async function saveOrQueue(item: Omit<HangDoiItem, "tao_luc" | "id">): Promise<{ queued: boolean; error?: string }> {
  const supabase = createClient();

  const thucThi = async () => {
    if (item.thao_tac === "insert") {
      const { error } = await supabase.from(item.bang).insert(item.gia_tri);
      if (error) throw error;
    } else {
      let query = supabase.from(item.bang).update(item.gia_tri);
      for (const [key, value] of Object.entries(item.dieu_kien ?? {})) {
        query = query.eq(key, value as never);
      }
      const { error } = await query;
      if (error) throw error;
    }
  };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await offlineDb.hang_doi.add({ ...item, tao_luc: new Date().toISOString() });
    return { queued: true };
  }

  try {
    await thucThi();
    return { queued: false };
  } catch (err) {
    // Lỗi có thể do mất mạng giữa chừng (fetch failed) — lưu tạm để
    // đồng bộ lại, thay vì báo lỗi mất dữ liệu cho Thợ.
    const isNetworkError = err instanceof TypeError || (err as { message?: string })?.message?.includes("fetch");
    if (isNetworkError) {
      await offlineDb.hang_doi.add({ ...item, tao_luc: new Date().toISOString() });
      return { queued: true };
    }
    return { queued: false, error: (err as { message?: string })?.message ?? "Lỗi không xác định" };
  }
}

export async function demSoLuongCho(): Promise<number> {
  return offlineDb.hang_doi.count();
}
