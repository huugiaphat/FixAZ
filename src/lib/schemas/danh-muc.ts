import { z } from "zod";

export const NHOM_DICH_VU = [
  "Điện nước - Lắp mới",
  "Điện nước - Sửa chữa",
  "Sơn nhà",
  "Chống thấm",
  "Trần & vách thạch cao",
  "Sàn & gạch",
  "Mái nhà",
  "Phá dỡ",
  "Xây tô",
  "Cửa nhôm kính",
  "Xây mới / cải tạo nhà",
  "Sửa máy lạnh",
  "Sửa máy giặt",
  "Sửa tủ lạnh",
  "Sửa máy nước nóng",
  "Điện",
  "Nước",
] as const;

export const bangGiaDichVuSchema = z.object({
  ten_dich_vu: z.string().trim().min(2, "Vui lòng nhập tên dịch vụ"),
  nhom_dich_vu: z.enum(NHOM_DICH_VU),
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
