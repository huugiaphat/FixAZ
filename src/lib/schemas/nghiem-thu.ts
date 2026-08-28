import { z } from "zod";

export const nghiemThuSchema = z.object({
  cl_dung_pham_vi: z.boolean().default(false),
  cl_dung_vat_tu: z.boolean().default(false),
  cl_thiet_bi_van_hanh: z.boolean().default(false),
  cl_khong_ro_ri: z.boolean().default(false),
  cl_ve_sinh: z.boolean().default(false),
  cl_huong_dan_khach: z.boolean().default(false),
  y_kien_khach: z.string().trim().optional(),
  diem_danh_gia: z.number().min(1).max(5).optional(),
});

export type NghiemThuFormValues = z.output<typeof nghiemThuSchema>;
export type NghiemThuFormInput = z.input<typeof nghiemThuSchema>;

export const CHECKLIST_NGHIEM_THU: { key: keyof NghiemThuFormInput; nhan: string }[] = [
  { key: "cl_dung_pham_vi", nhan: "Đúng phạm vi công việc" },
  { key: "cl_dung_vat_tu", nhan: "Đúng vật tư" },
  { key: "cl_thiet_bi_van_hanh", nhan: "Thiết bị vận hành tốt" },
  { key: "cl_khong_ro_ri", nhan: "Không rò rỉ" },
  { key: "cl_ve_sinh", nhan: "Đã vệ sinh khu vực làm việc" },
  { key: "cl_huong_dan_khach", nhan: "Đã hướng dẫn khách sử dụng" },
];
