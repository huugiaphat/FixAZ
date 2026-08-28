import { z } from "zod";

export const VAI_TRO = ["Quản lý", "CSKH-Điều phối", "Thợ", "Kế toán", "Kho"] as const;
export const KY_NANG = ["Điện", "Nước", "Điện & Nước"] as const;

export const nhanVienSchema = z.object({
  ho_ten: z.string().trim().min(2, "Vui lòng nhập họ tên"),
  email: z.string().trim().email("Email không hợp lệ"),
  chuc_vu: z.string().trim().min(1, "Vui lòng nhập/chọn chức vụ"),
  vai_tro_app: z.enum(VAI_TRO),
  sdt: z.string().trim().min(9, "Số điện thoại không hợp lệ").max(15),
  ky_nang: z.enum(KY_NANG).optional(),
  khu_vuc_phu_trach: z.string().trim().optional(),
});

export type NhanVienFormValues = z.infer<typeof nhanVienSchema>;
