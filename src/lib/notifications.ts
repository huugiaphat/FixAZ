import { createAdminClient } from "@/lib/supabase/admin";
import { guiPushChoNhanVien } from "@/lib/push/server";
import type { LoaiThongBao } from "@/types/database";

// Tạo thong_bao + gửi Web Push cho mọi nhân viên đang làm thuộc 1 nhóm
// vai trò, tránh tạo trùng thông báo chưa đọc cùng loại/cùng đối
// tượng. Dùng chung cho cron kiểm tra định kỳ
// (api/notifications/check) và các nơi cần báo ngay lập tức (VD yêu
// cầu dịch vụ mới từ trang công khai /yeu-cau).
export async function taoThongBaoChoVaiTro(params: {
  loai: LoaiThongBao;
  tieu_de: string;
  noi_dung: string;
  vai_tro: string[];
  ma_don?: string | null;
  ma_vt?: string | null;
  ma_yc?: string | null;
}): Promise<number> {
  const admin = createAdminClient();
  let soLuongTao = 0;

  const { data: nguoiNhanList } = await admin
    .from("nhan_vien")
    .select("ma_nv")
    .in("vai_tro_app", params.vai_tro)
    .eq("trang_thai", "Đang làm");

  for (const nv of nguoiNhanList ?? []) {
    let query = admin
      .from("thong_bao")
      .select("id")
      .eq("loai", params.loai)
      .eq("nguoi_nhan", nv.ma_nv)
      .eq("da_doc", false);
    query = params.ma_don ? query.eq("ma_don", params.ma_don) : query.is("ma_don", null);
    query = params.ma_vt ? query.eq("ma_vt", params.ma_vt) : query.is("ma_vt", null);
    query = params.ma_yc ? query.eq("ma_yc", params.ma_yc) : query.is("ma_yc", null);
    const { data: existing } = await query.maybeSingle();
    if (existing) continue;

    const { data: inserted } = await admin
      .from("thong_bao")
      .insert({
        loai: params.loai,
        tieu_de: params.tieu_de,
        noi_dung: params.noi_dung,
        ma_don: params.ma_don ?? null,
        ma_vt: params.ma_vt ?? null,
        ma_yc: params.ma_yc ?? null,
        nguoi_nhan: nv.ma_nv,
      })
      .select("id")
      .single();

    if (inserted) {
      soLuongTao++;
      const url = params.ma_don ? `/don-hang/${params.ma_don}` : params.ma_yc ? "/yeu-cau-dich-vu" : "/kho-vat-tu";
      await guiPushChoNhanVien(nv.ma_nv, { tieu_de: params.tieu_de, noi_dung: params.noi_dung, url });
      await admin.from("thong_bao").update({ da_gui_push: true }).eq("id", inserted.id);
    }
  }

  return soLuongTao;
}
