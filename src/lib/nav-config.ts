import type { VaiTro } from "@/types/database";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ClipboardCheck,
  Warehouse,
  ShieldCheck,
  Award,
  MessageCircleWarning,
  Settings,
  Inbox,
  Receipt,
  type LucideIcon,
} from "lucide-react";

export interface MucDieuHuong {
  href: string;
  nhan: string;
  icon: LucideIcon;
  vaiTro: VaiTro[]; // vai trò được thấy mục này — thực thi ở CẢ route (requireNhanVien) lẫn nav (Mục 9)
  uuTienMobile?: boolean; // hiện trong thanh điều hướng dưới cùng (mobile) cho Thợ/Điều phối
}

export const DANH_SACH_DIEU_HUONG: MucDieuHuong[] = [
  { href: "/", nhan: "Trang chủ", icon: LayoutDashboard, vaiTro: ["Quản lý", "CSKH-Điều phối", "Thợ", "Kế toán", "Kho", "Kiểm soát"], uuTienMobile: true },
  { href: "/dashboard", nhan: "Dashboard", icon: LayoutDashboard, vaiTro: ["Quản lý", "Kiểm soát"] },
  { href: "/thu-chi", nhan: "Sổ thu chi", icon: Receipt, vaiTro: ["Quản lý", "Kế toán", "Kiểm soát"] },
  { href: "/khach-hang", nhan: "Khách hàng", icon: Users, vaiTro: ["Quản lý", "CSKH-Điều phối", "Kế toán", "Kiểm soát"] },
  { href: "/don-hang", nhan: "Đơn hàng", icon: ClipboardList, vaiTro: ["Quản lý", "CSKH-Điều phối", "Thợ", "Kế toán", "Kiểm soát"], uuTienMobile: true },
  { href: "/yeu-cau-dich-vu", nhan: "Yêu cầu dịch vụ", icon: Inbox, vaiTro: ["Quản lý", "CSKH-Điều phối", "Kiểm soát"] },
  { href: "/nghiem-thu", nhan: "Nghiệm thu", icon: ClipboardCheck, vaiTro: ["Thợ", "Kiểm soát"], uuTienMobile: true },
  { href: "/kho-vat-tu", nhan: "Kho vật tư", icon: Warehouse, vaiTro: ["Quản lý", "Kho", "Kiểm soát"] },
  { href: "/bao-hanh", nhan: "Bảo hành", icon: ShieldCheck, vaiTro: ["Quản lý", "CSKH-Điều phối", "Kiểm soát"] },
  { href: "/kpi", nhan: "KPI nhân viên", icon: Award, vaiTro: ["Quản lý", "CSKH-Điều phối", "Thợ", "Kế toán", "Kho", "Kiểm soát"] },
  { href: "/khieu-nai", nhan: "Khiếu nại", icon: MessageCircleWarning, vaiTro: ["Quản lý", "CSKH-Điều phối", "Kiểm soát"] },
  { href: "/quan-tri", nhan: "Quản trị", icon: Settings, vaiTro: ["Quản lý", "Kiểm soát"] },
];

export function dieuHuongTheoVaiTro(vaiTro: VaiTro): MucDieuHuong[] {
  return DANH_SACH_DIEU_HUONG.filter((m) => m.vaiTro.includes(vaiTro));
}
