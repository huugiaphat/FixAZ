import { z } from "zod";
import { PHUONG_THUC_THU } from "./thu-tien";

export const NOI_DUNG_THU = ["Tạm ứng", "Thanh toán", "Thu khác", "Sửa nhanh"] as const;

// "Thanh toán" bị loại khỏi danh sách nhập tay — kể từ migration 0020,
// mọi khoản thu ở tab "Thu tiền" của đơn hàng tự động đổ vào đây qua
// trigger, nhập tay thêm sẽ bị đếm trùng.
export const NOI_DUNG_THU_NHAP_TAY = NOI_DUNG_THU.filter((n) => n !== "Thanh toán");
export const NOI_DUNG_CHI = [
  "Vật tư",
  "Công cụ",
  "Lương",
  "Ứng lương",
  "Ăn uống",
  "Ca máy",
  "Xe chở",
  "Chi phí quản lý",
  "Chi khác",
] as const;

export const thuChiSchema = z
  .object({
    loai: z.enum(["Thu", "Chi"]),
    ma_don: z.string().optional(),
    ten_cong_trinh: z.string().trim().optional(),
    noi_dung_thu: z.enum(NOI_DUNG_THU).optional(),
    noi_dung_chi: z.enum(NOI_DUNG_CHI).optional(),
    so_tien: z.number().positive("Số tiền phải lớn hơn 0"),
    phuong_thuc: z.enum(PHUONG_THUC_THU),
    ghi_chu: z.string().trim().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.loai === "Thu" && !v.noi_dung_thu) {
      ctx.addIssue({ code: "custom", message: "Vui lòng chọn nội dung thu", path: ["noi_dung_thu"] });
    }
    if (v.loai === "Chi" && !v.noi_dung_chi) {
      ctx.addIssue({ code: "custom", message: "Vui lòng chọn nội dung chi", path: ["noi_dung_chi"] });
    }
  });

export type ThuChiFormValues = z.infer<typeof thuChiSchema>;
