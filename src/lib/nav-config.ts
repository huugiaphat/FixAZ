import type { VaiTro } from "@/types/database";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Route,
  ClipboardCheck,
  Wallet,
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
  { href: "/", nhan: "Trang chủ", icon: LayoutDashboard, vaiTro: ["Quản lý", "CSKH-Điều phối", "Thợ", "Kế toán", "Kho"], uuTienMobile: true },
  { href: "/dashboard", nhan: "Dashboard", icon: LayoutDashboard, vaiTro: ["Quản lý"] },
  { href: "/khach-hang", nhan: "Khách hàng", icon: Users, vaiTro: ["Quản lý", "CSKH-Điều phối", "Kế toán"] },
  { href: "/don-hang", nhan: "Đơn hàng", icon: ClipboardList, vaiTro: ["Quản lý", "CSKH-Điều phối", "Thợ", "Kế toán"], uuTienMobile: true },
  { href: "/dieu-phoi", nhan: "Điều phối", icon: Route, vaiTro: ["Quản lý", "CSKH-Điều phối"] },
  { href: "/yeu-cau-dich-vu", nhan: "Yêu cầu dịch vụ", icon: Inbox, vaiTro: ["Quản lý", "CSKH-Điều phối"] },
  { href: "/nghiem-thu", nhan: "Nghiệm thu", icon: ClipboardCheck, vaiTro: ["Thợ"], uuTienMobile: true },
  { href: "/thu-tien", nhan: "Thu tiền", icon: Wallet, vaiTro: ["Quản lý", "Kế toán", "Thợ"], uuTienMobile: true },
  { href: "/thu-chi", nhan: "Sổ thu chi", icon: Receipt, vaiTro: ["Quản lý", "Kế toán"] },
  { href: "/kho-vat-tu", nhan: "Kho vật tư", icon: Warehouse, vaiTro: ["Quản lý", "Kho"] },
  { href: "/bao-hanh", nhan: "Bảo hành", icon: ShieldCheck, vaiTro: ["Quản lý", "CSKH-Điều phối"] },
  { href: "/kpi", nhan: "KPI nhân viên", icon: Award, vaiTro: ["Quản lý", "CSKH-Điều phối", "Thợ", "Kế toán", "Kho"] },
  { href: "/khieu-nai", nhan: "Khiếu nại", icon: MessageCircleWarning, vaiTro: ["Quản lý", "CSKH-Điều phối"] },
  { href: "/quan-tri", nhan: "Quản trị", icon: Settings, vaiTro: ["Quản lý"] },
];

export function dieuHuongTheoVaiTro(vaiTro: VaiTro): MucDieuHuong[] {
  return DANH_SACH_DIEU_HUONG.filter((m) => m.vaiTro.includes(vaiTro));
}
