import { z } from "zod";

export const NGUON_KHACH_HANG = ["Điện thoại/Hotline", "Zalo/Facebook", "App/Website", "Khách quen giới thiệu"] as const;

export const khachHangSchema = z.object({
  ho_ten: z.string().trim().min(2, "Vui lòng nhập họ tên"),
  sdt: z.string().trim().min(9, "Số điện thoại không hợp lệ").max(15),
  dia_chi: z.string().trim().min(5, "Vui lòng nhập địa chỉ"),
  nguon: z.enum(NGUON_KHACH_HANG).optional(),
});

export type KhachHangFormValues = z.infer<typeof khachHangSchema>;
