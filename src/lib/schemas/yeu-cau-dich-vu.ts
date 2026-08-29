import { z } from "zod";
import { Home, Zap, Droplets, Wrench, Cog, CircleEllipsis, type LucideIcon } from "lucide-react";

export const DICH_VU_YEU_CAU = ["Nhà cửa", "Điện", "Nước", "Tổng hợp", "Thiết bị", "Khác"] as const;

export const ICON_DICH_VU: Record<(typeof DICH_VU_YEU_CAU)[number], LucideIcon> = {
  "Nhà cửa": Home,
  "Điện": Zap,
  "Nước": Droplets,
  "Tổng hợp": Wrench,
  "Thiết bị": Cog,
  "Khác": CircleEllipsis,
};

export const yeuCauDichVuSchema = z.object({
  ho_ten: z.string().trim().min(2, "Vui lòng nhập họ tên"),
  dia_chi: z.string().trim().min(5, "Vui lòng nhập địa chỉ đầy đủ"),
  sdt: z.string().trim().min(9, "Số điện thoại không hợp lệ").max(15),
  dich_vu: z.enum(DICH_VU_YEU_CAU),
  yeu_cau: z.string().trim().min(5, "Vui lòng mô tả yêu cầu"),
  // honeypot chống spam — bot thường tự điền field ẩn này, người dùng
  // thật không thấy nên luôn để trống. Không validate chặt ở đây, xử
  // lý im lặng ở tầng Server Action để không lộ cơ chế cho bot.
  website: z.string().optional(),
});

export type YeuCauDichVuFormValues = z.infer<typeof yeuCauDichVuSchema>;
