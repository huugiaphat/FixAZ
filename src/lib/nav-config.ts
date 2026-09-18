import type { VaiTro } from "@/types/database";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Warehouse,
  ShieldCheck,
  Award,
  MessageCircleWarning,
  Settings,
  Inbox,
  Receipt,
  FileText,
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
  { href: "/", nhan: "Trang chủ", icon: LayoutDashboard, vaiTro: ["Quản lý", "Admin", "CSKH-Điều phối", "Thợ", "Kế toán", "Kho", "Kiểm soát"], uuTienMobile: true },
  { href: "/dashboard", nhan: "Dashboard", icon: LayoutDashboard, vaiTro: ["Quản lý", "Admin", "Kiểm soát"] },
  { href: "/thu-chi", nhan: "Sổ thu chi", icon: Receipt, vaiTro: ["Quản lý", "Admin", "Kế toán", "Kiểm soát"] },
  { href: "/khach-hang", nhan: "Khách hàng", icon: Users, vaiTro: ["Quản lý", "Admin", "CSKH-Điều phối", "Kế toán", "Kiểm soát"] },
  { href: "/don-hang", nhan: "Đơn hàng", icon: ClipboardList, vaiTro: ["Quản lý", "Admin", "CSKH-Điều phối", "Thợ", "Kế toán", "Kiểm soát"], uuTienMobile: true },
  { href: "/yeu-cau-dich-vu", nhan: "Yêu cầu dịch vụ", icon: Inbox, vaiTro: ["Quản lý", "Admin", "CSKH-Điều phối", "Kiểm soát"] },
  { href: "/mau-bao-gia", nhan: "Mẫu báo giá", icon: FileText, vaiTro: ["Quản lý", "Admin", "CSKH-Điều phối", "Kế toán", "Kiểm soát"] },
  { href: "/kho-vat-tu", nhan: "Kho vật tư", icon: Warehouse, vaiTro: ["Kho"] },
  { href: "/bao-hanh", nhan: "Bảo hành", icon: ShieldCheck, vaiTro: ["Quản lý", "Admin", "CSKH-Điều phối", "Kiểm soát"] },
  { href: "/kpi", nhan: "KPI nhân viên", icon: Award, vaiTro: ["Quản lý", "Admin", "CSKH-Điều phối", "Thợ", "Kế toán", "Kho", "Kiểm soát"] },
  { href: "/khieu-nai", nhan: "Khiếu nại", icon: MessageCircleWarning, vaiTro: ["Quản lý", "Admin", "CSKH-Điều phối", "Kiểm soát"] },
  { href: "/quan-tri", nhan: "Quản trị", icon: Settings, vaiTro: ["Quản lý", "Admin", "Kiểm soát"] },
];

export function dieuHuongTheoVaiTro(vaiTro: VaiTro): MucDieuHuong[] {
  return DANH_SACH_DIEU_HUONG.filter((m) => m.vaiTro.includes(vaiTro));
}

export const NHOM_DIEU_HUONG = [
  { nhan: "Tổng quan", duongDan: ["/", "/dashboard"] },
  { nhan: "Khách hàng & công việc", duongDan: ["/yeu-cau-dich-vu", "/khach-hang", "/mau-bao-gia", "/don-hang"] },
  { nhan: "Tài chính & vật tư", duongDan: ["/thu-chi", "/kho-vat-tu"] },
  { nhan: "Chất lượng & quản trị", duongDan: ["/bao-hanh", "/khieu-nai", "/kpi", "/quan-tri"] },
];

export const MO_TA_MODULE: Record<string, string> = {
  "/dashboard": "Theo dõi thu chi, công trình và hiệu suất đội thợ.",
  "/yeu-cau-dich-vu": "Tiếp nhận và xử lý yêu cầu khách gửi đến.",
  "/khach-hang": "Tra cứu thông tin và lịch sử của khách hàng.",
  "/mau-bao-gia": "Lập, in báo giá tham khảo và liên kết đơn hàng.",
  "/don-hang": "Theo dõi công việc từ tiếp nhận đến hoàn thành.",
  "/thu-chi": "Ghi nhận dòng tiền và theo dõi thu chi công trình.",
  "/kho-vat-tu": "Quản lý vật tư, nhập xuất và số lượng tồn kho.",
  "/bao-hanh": "Theo dõi và xử lý bảo hành sau sửa chữa.",
  "/khieu-nai": "Tiếp nhận phản hồi và theo dõi việc giải quyết.",
  "/kpi": "Xem điểm và xếp loại hiệu suất theo tháng.",
  "/quan-tri": "Quản lý nhân viên, bảng giá và danh mục chung.",
};

export function dieuHuongMobile(vaiTro: VaiTro) {
  const uuTien: Record<VaiTro, string[]> = {
    "Quản lý": ["/", "/dashboard", "/don-hang", "/thu-chi"],
    "Admin": ["/", "/dashboard", "/don-hang", "/thu-chi"],
    "Kiểm soát": ["/", "/dashboard", "/don-hang", "/thu-chi"],
    "CSKH-Điều phối": ["/", "/yeu-cau-dich-vu", "/don-hang", "/khach-hang"],
    "Thợ": ["/", "/don-hang", "/kpi"],
    "Kế toán": ["/", "/thu-chi", "/don-hang", "/mau-bao-gia"],
    "Kho": ["/", "/kho-vat-tu", "/kpi"],
  };
  const choPhep = dieuHuongTheoVaiTro(vaiTro);
  return uuTien[vaiTro].flatMap(href => choPhep.filter(m => m.href === href));
}
