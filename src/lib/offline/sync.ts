import { createClient } from "@/lib/supabase/client";
import { offlineDb } from "./db";

let dangDongBo = false;

// Đồng bộ lại toàn bộ hàng đợi ngoại tuyến theo đúng thứ tự tạo, dừng
// lại nếu gặp lỗi (không phải lỗi mạng) để không mất thứ tự dữ liệu —
// người dùng sẽ thấy toast báo còn bao nhiêu bản ghi lỗi cần xử lý thủ công.
export async function flushOfflineQueue(): Promise<void> {
  if (dangDongBo || typeof navigator === "undefined" || !navigator.onLine) return;
  dangDongBo = true;

  try {
    const supabase = createClient();
    const items = await offlineDb.hang_doi.orderBy("tao_luc").toArray();
    if (items.length === 0) return;

    const { toast } = await import("sonner");
    let thanhCong = 0;

    for (const item of items) {
      try {
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
        await offlineDb.hang_doi.delete(item.id!);
        thanhCong++;
      } catch (err) {
        await offlineDb.hang_doi.update(item.id!, {
          loi_gan_nhat: (err as { message?: string })?.message ?? "Lỗi không xác định",
        });
        toast.error(`Đồng bộ "${item.mo_ta}" thất bại — sẽ thử lại sau.`);
        break; // giữ thứ tự — dừng, không bỏ qua bản ghi lỗi
      }
    }

    if (thanhCong > 0) {
      toast.success(`Đã đồng bộ ${thanhCong} thay đổi lưu khi mất mạng.`);
    }
  } finally {
    dangDongBo = false;
  }
}
