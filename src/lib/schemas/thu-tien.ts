import { z } from "zod";

export const PHUONG_THUC_THU = ["Tiền mặt", "Chuyển khoản", "QR-Ví điện tử"] as const;

export const thuTienSchema = z
  .object({
    so_tien: z.number().positive("Số tiền phải lớn hơn 0"),
    phuong_thuc: z.enum(PHUONG_THUC_THU),
    ma_giao_dich: z.string().trim().optional(),
  })
  .refine((v) => v.phuong_thuc === "Tiền mặt" || !!v.ma_giao_dich, {
    message: "Bắt buộc nhập mã giao dịch khi chuyển khoản/QR",
    path: ["ma_giao_dich"],
  });

export type ThuTienFormValues = z.output<typeof thuTienSchema>;
export type ThuTienFormInput = z.input<typeof thuTienSchema>;
