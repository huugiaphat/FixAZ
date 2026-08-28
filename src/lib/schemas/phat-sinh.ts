import { z } from "zod";

export const phatSinhSchema = z.object({
  nguyen_nhan: z.string().trim().min(3, "Vui lòng nhập nguyên nhân"),
  hang_muc: z.string().trim().min(3, "Vui lòng nhập hạng mục phát sinh"),
  gia: z.number().min(0, "Không được âm"),
  truong_hop_khan_cap: z.boolean().default(false),
});

export type PhatSinhFormValues = z.output<typeof phatSinhSchema>;
export type PhatSinhFormInput = z.input<typeof phatSinhSchema>;
