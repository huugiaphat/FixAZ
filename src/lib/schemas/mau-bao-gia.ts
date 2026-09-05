import { z } from "zod";
import { DICH_VU } from "./don-hang";

export const mauBaoGiaSchema = z.object({
  ten_khach_hang: z.string().trim().min(1, "Nhập tên khách hàng"),
  sdt: z.string().trim().optional(),
  dia_chi: z.string().trim().optional(),
  dich_vu: z.enum(DICH_VU).optional(),
  ghi_chu: z.string().trim().optional(),
});

export type MauBaoGiaFormValues = z.infer<typeof mauBaoGiaSchema>;

export const mauBaoGiaDongSchema = z.object({
  ten_hang_muc: z.string().trim().min(1, "Nhập tên hạng mục"),
  don_vi_tinh: z.string().trim().optional(),
  so_luong: z.number().positive("Số lượng phải lớn hơn 0"),
  don_gia: z.number().min(0, "Đơn giá không được âm"),
});

export type MauBaoGiaDongFormValues = z.infer<typeof mauBaoGiaDongSchema>;
