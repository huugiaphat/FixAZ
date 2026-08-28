import { z } from "zod";

export const bangGiaDichVuSchema = z.object({
  ten_dich_vu: z.string().trim().min(2, "Vui lòng nhập tên dịch vụ"),
  nhom_dich_vu: z.enum(["Điện", "Nước"]),
  don_vi_tinh: z.string().trim().min(1, "Vui lòng nhập đơn vị tính"),
  gia_tham_khao: z.string().trim().optional(),
});
export type BangGiaDichVuFormValues = z.infer<typeof bangGiaDichVuSchema>;

export const danhMucSchema = z.object({
  loai_danh_muc: z.string().trim().min(1, "Vui lòng nhập loại danh mục"),
  gia_tri: z.string().trim().min(1, "Vui lòng nhập giá trị"),
  mo_ta: z.string().trim().optional(),
});
export type DanhMucFormValues = z.infer<typeof danhMucSchema>;
