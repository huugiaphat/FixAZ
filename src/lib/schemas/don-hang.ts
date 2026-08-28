import { z } from "zod";

export const DICH_VU = ["Điện", "Nước", "Điện & Nước"] as const;
export const UU_TIEN = ["P1-Khẩn cấp", "P2-Trong ngày", "P3-Đặt lịch"] as const;

export const donHangSchema = z.object({
  ma_kh: z.string().min(1, "Chọn khách hàng"),
  dich_vu: z.enum(DICH_VU),
  mo_ta_su_co: z.string().trim().min(5, "Vui lòng mô tả sự cố"),
  uu_tien: z.enum(UU_TIEN),
  khung_gio_mong_muon: z.string().trim().optional(),
});

export type DonHangFormValues = z.infer<typeof donHangSchema>;
