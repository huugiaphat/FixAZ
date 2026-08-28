import { z } from "zod";

export const kpiSchema = z.object({
  ma_nv: z.string().min(1, "Chọn nhân viên"),
  thang: z.string().regex(/^\d{4}-\d{2}$/, "Định dạng yyyy-mm"),
  diem_tong: z.number().min(0).max(100),
  chi_tiet_diem: z.string().trim().optional(),
});

export type KpiFormValues = z.output<typeof kpiSchema>;
export type KpiFormInput = z.input<typeof kpiSchema>;
