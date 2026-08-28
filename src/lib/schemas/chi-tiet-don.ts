import { z } from "zod";

export const chiTietDonSchema = z.object({
  loai: z.enum(["Dịch vụ", "Vật tư"]),
  ten_hang_muc: z.string().trim().min(1, "Vui lòng nhập tên hạng mục"),
  don_vi_tinh: z.string().trim().optional(),
  so_luong: z.number().positive("Số lượng phải lớn hơn 0"),
  gia_ban: z.number().min(0),
  gia_von: z.number().min(0).optional(),
  ma_dv_vt: z.string().trim().optional(),
});

export type ChiTietDonFormValues = z.output<typeof chiTietDonSchema>;
export type ChiTietDonFormInput = z.input<typeof chiTietDonSchema>;
