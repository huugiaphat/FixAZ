import { z } from "zod";

export const baoHanhSchema = z.object({
  ma_don_cu: z.string().min(1, "Chọn đơn hàng cũ"),
  noi_dung: z.string().trim().min(5, "Vui lòng mô tả nội dung yêu cầu bảo hành"),
  pham_vi: z.string().trim().optional(),
});

export type BaoHanhFormValues = z.infer<typeof baoHanhSchema>;
