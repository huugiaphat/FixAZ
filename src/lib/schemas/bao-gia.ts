import { z } from "zod";

export const baoGiaSchema = z.object({
  tong_truoc_giam: z.coerce.number().min(0, "Không được âm"),
  giam_gia: z.coerce.number().min(0, "Không được âm").default(0),
  nguoi_duyet: z.string().optional(),
  pham_vi_bao_gom: z.string().trim().optional(),
  pham_vi_khong_bao_gom: z.string().trim().optional(),
});

export type BaoGiaFormValues = z.output<typeof baoGiaSchema>;
export type BaoGiaFormInput = z.input<typeof baoGiaSchema>;
