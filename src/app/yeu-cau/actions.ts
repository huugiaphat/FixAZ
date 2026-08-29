"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { taoThongBaoChoVaiTro } from "@/lib/notifications";
import { yeuCauDichVuSchema, type YeuCauDichVuFormValues } from "@/lib/schemas/yeu-cau-dich-vu";

// Trang /yeu-cau không yêu cầu đăng nhập (khách quét mã QR) nên phải
// ghi dữ liệu bằng service role — RLS của yeu_cau_dich_vu không cấp
// INSERT cho bất kỳ role nào, kể cả authenticated (xem migration 0017).
export async function guiYeuCauDichVu(input: YeuCauDichVuFormValues): Promise<{ ok: boolean; maYc?: string; loi?: string }> {
  const parsed = yeuCauDichVuSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, loi: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  // Honeypot: bot điền vào field ẩn "website" — âm thầm coi như thành
  // công mà không ghi gì, không cho bot biết đã bị chặn.
  if (parsed.data.website) {
    return { ok: true, maYc: "YC-000000" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("yeu_cau_dich_vu")
    .insert({
      ho_ten: parsed.data.ho_ten,
      dia_chi: parsed.data.dia_chi,
      sdt: parsed.data.sdt,
      dich_vu: parsed.data.dich_vu,
      yeu_cau: parsed.data.yeu_cau,
    })
    .select("ma_yc")
    .single();

  if (error || !data) {
    return { ok: false, loi: "Không gửi được yêu cầu, vui lòng thử lại hoặc gọi trực tiếp hotline." };
  }

  await taoThongBaoChoVaiTro({
    loai: "Yêu cầu dịch vụ mới",
    tieu_de: `Yêu cầu dịch vụ mới — ${parsed.data.ho_ten}`,
    noi_dung: `${parsed.data.dich_vu} · ${parsed.data.sdt} · ${parsed.data.dia_chi} — "${parsed.data.yeu_cau}"`,
    vai_tro: ["Quản lý", "CSKH-Điều phối"],
    ma_yc: data.ma_yc,
  });

  return { ok: true, maYc: data.ma_yc };
}
