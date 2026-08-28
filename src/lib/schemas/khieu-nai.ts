import { z } from "zod";

export const MUC_DO_KHIEU_NAI = ["Thấp", "Trung bình", "Cao-Khẩn cấp"] as const;

export const khieuNaiSchema = z.object({
  ma_don: z.string().min(1, "Chọn đơn hàng liên quan"),
  noi_dung: z.string().trim().min(5, "Vui lòng nhập nội dung khiếu nại"),
  muc_do: z.enum(MUC_DO_KHIEU_NAI),
  han_xu_ly: z.string().optional(),
});

export type KhieuNaiFormValues = z.infer<typeof khieuNaiSchema>;
