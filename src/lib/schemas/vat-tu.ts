import { z } from "zod";

export const vatTuSchema = z.object({
  ten: z.string().trim().min(2, "Vui lòng nhập tên vật tư"),
  quy_cach: z.string().trim().optional(),
  don_vi_tinh: z.string().trim().min(1, "Vui lòng nhập đơn vị tính"),
  gia_von: z.number().min(0),
  gia_ban: z.number().min(0),
  nguong_canh_bao_ton: z.number().min(0).optional(),
});

export type VatTuFormValues = z.output<typeof vatTuSchema>;
export type VatTuFormInput = z.input<typeof vatTuSchema>;

export const xuatNhapKhoSchema = z.object({
  ma_vt: z.string().min(1, "Chọn vật tư"),
  loai: z.enum(["Nhập", "Xuất"]),
  so_luong: z.number().positive("Số lượng phải lớn hơn 0"),
  ma_don: z.string().trim().optional(),
});

export type XuatNhapKhoFormValues = z.output<typeof xuatNhapKhoSchema>;
export type XuatNhapKhoFormInput = z.input<typeof xuatNhapKhoSchema>;
