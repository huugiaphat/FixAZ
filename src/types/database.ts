// Kiểu dữ liệu TypeScript khớp với schema Supabase ở supabase/migrations/.
// Viết tay bám sát Phụ lục A của tài liệu yêu cầu — khi schema đổi, nên
// tạo lại bằng: npx supabase gen types typescript --project-id <id> > src/types/database.ts
// và merge lại phần enum/tiện ích ở cuối file.

export type VaiTro = "Quản lý" | "CSKH-Điều phối" | "Thợ" | "Kế toán" | "Kho";
export type TrangThaiNhanVien = "Đang làm" | "Nghỉ phép" | "Đã nghỉ việc";
export type NguonKhachHang = "Điện thoại/Hotline" | "Zalo/Facebook" | "App/Website" | "Khách quen giới thiệu";
export type DichVu = "Nhà cửa" | "Điện" | "Nước" | "Tổng hợp" | "Thiết bị" | "Khác";
export type KyNangNhanVien = "Tổng hợp" | "Điện nước" | "Hàn" | "Xây" | "Sơn" | "Học việc";
export type NhomDichVu = "Điện" | "Nước";
export type UuTien = "P1-Khẩn cấp" | "P2-Trong ngày" | "P3-Đặt lịch";
export type TrangThaiDon =
  | "Mới tiếp nhận"
  | "Đã điều phối"
  | "Đang khảo sát"
  | "Chờ duyệt báo giá"
  | "Đang thi công"
  | "Chờ nghiệm thu"
  | "Đã nghiệm thu - chờ thu tiền"
  | "Đã đóng"
  | "Đã hủy";
export type LoaiHangMuc = "Dịch vụ" | "Vật tư";
export type TrangThaiDieuPhoi = "Đã nhận" | "Đang di chuyển" | "Đã đến" | "Đang khảo sát" | "Đang thi công" | "Hoàn thành";
export type PhuongThucThu = "Tiền mặt" | "Chuyển khoản" | "QR-Ví điện tử";
export type LoaiXuatNhap = "Nhập" | "Xuất";
export type NguyenNhanBaoHanh = "Lỗi cũ tái phát" | "Lỗi mới phát sinh";
export type TrangThaiBaoHanh = "Mới tạo" | "Đang xử lý" | "Đã đóng";
export type XepLoaiKpi = "A" | "B" | "C" | "D" | "E";
export type MucDoKhieuNai = "Thấp" | "Trung bình" | "Cao-Khẩn cấp";
export type TrangThaiKhieuNai = "Mới" | "Đang xử lý" | "Đã xử lý";
export type TrangThaiYeuCau = "Mới" | "Đã liên hệ" | "Đã tạo đơn" | "Đã hủy";
export type LoaiThongBao =
  | "Nhắc xác nhận phát sinh"
  | "Nhắc nộp tiền mặt"
  | "Cảnh báo đơn trễ hẹn"
  | "Nhắc chăm sóc sau sửa"
  | "Cảnh báo tồn kho thấp"
  | "Yêu cầu dịch vụ mới";
export type LoaiThuChi = "Thu" | "Chi";
export type NoiDungThu = "Tạm ứng" | "Thanh toán" | "Thu khác" | "Sửa nhanh";
export type NoiDungChi =
  | "Vật tư"
  | "Công cụ"
  | "Lương"
  | "Ứng lương"
  | "Ăn uống"
  | "Ca máy"
  | "Xe chở"
  | "Chi phí quản lý"
  | "Chi khác";

export interface NhanVien {
  ma_nv: string;
  auth_user_id: string | null;
  ho_ten: string;
  chuc_vu: string;
  vai_tro_app: VaiTro;
  email: string;
  sdt: string | null;
  ky_nang: KyNangNhanVien[];
  khu_vuc_phu_trach: string | null;
  trang_thai: TrangThaiNhanVien;
  ngay_vao_lam: string | null;
  created_at: string;
  updated_at: string;
}

export interface KhachHang {
  ma_kh: string;
  ho_ten: string;
  sdt: string;
  dia_chi: string;
  nguon: NguonKhachHang | null;
  ngay_tao: string;
  nguoi_tao: string | null;
}

export interface DonHang {
  ma_don: string;
  ma_kh: string;
  ngay_tiep_nhan: string;
  nguoi_tiep_nhan: string;
  dich_vu: DichVu;
  mo_ta_su_co: string;
  uu_tien: UuTien;
  khung_gio_mong_muon: string | null;
  anh_hien_trang: string[];
  hien_trang_khao_sat: string | null;
  nguyen_nhan_khao_sat: string | null;
  hang_muc_de_xuat: string | null;
  trang_thai: TrangThaiDon;
  tho_phu_trach: string | null;
  ly_do_tu_choi_huy: string | null;
  ngay_dong_don: string | null;
  created_at: string;
  updated_at: string;
}

export interface DonHangTinhToan extends DonHang {
  tong_tien: number;
  da_thu: number;
  cong_no: number;
}

export interface ChiTietDon {
  ma_dong: string;
  ma_don: string;
  loai: LoaiHangMuc;
  ma_dv_vt: string | null;
  ten_hang_muc: string;
  so_luong: number;
  don_vi_tinh: string | null;
  gia_von: number | null; // null với vai trò Thợ (ẩn ở view v_chi_tiet_don)
  gia_ban: number;
  created_at: string;
}

export interface ChiTietDonTinhToan extends ChiTietDon {
  thanh_tien: number;
}

export interface BaoGia {
  ma_bg: string;
  ma_don: string;
  phien_ban: number;
  tong_truoc_giam: number;
  giam_gia: number;
  tong_sau_giam: number;
  nguoi_lap: string;
  nguoi_duyet: string | null;
  khach_xac_nhan: boolean;
  ngay_xac_nhan: string | null;
  pham_vi_bao_gom: string | null;
  pham_vi_khong_bao_gom: string | null;
  created_at: string;
}

export interface PhatSinh {
  ma_ps: string;
  ma_don: string;
  nguyen_nhan: string;
  anh_phat_sinh: string[];
  hang_muc: string;
  gia: number;
  khach_xac_nhan: boolean;
  truong_hop_khan_cap: boolean;
  ngay_xac_nhan: string | null;
  created_at: string;
}

export interface DieuPhoi {
  ma_dp: string;
  ma_don: string;
  tho: string;
  gio_nhan: string | null;
  gio_xuat_phat: string | null;
  eta: string | null;
  check_in: string | null;
  check_out: string | null;
  trang_thai: TrangThaiDieuPhoi;
  created_at: string;
}

export interface NghiemThu {
  ma_nt: string;
  ma_don: string;
  cl_dung_pham_vi: boolean;
  cl_dung_vat_tu: boolean;
  cl_thiet_bi_van_hanh: boolean;
  cl_khong_ro_ri: boolean;
  cl_ve_sinh: boolean;
  cl_huong_dan_khach: boolean;
  anh_sau_sua: string[];
  y_kien_khach: string | null;
  khach_xac_nhan: boolean;
  diem_danh_gia: number | null;
  ngay_nghiem_thu: string;
  created_at: string;
}

export interface ThuTien {
  ma_thu: string;
  ma_don: string;
  so_tien: number;
  phuong_thuc: PhuongThucThu;
  ma_giao_dich: string | null;
  nguoi_thu: string;
  ngay_thu: string;
  da_nop_ve_cong_ty: boolean;
  created_at: string;
}

export interface ThuChi {
  ma_tc: string;
  loai: LoaiThuChi;
  ma_don: string | null;
  ten_cong_trinh: string | null;
  noi_dung_thu: NoiDungThu | null;
  noi_dung_chi: NoiDungChi | null;
  so_tien: number;
  phuong_thuc: PhuongThucThu;
  ghi_chu: string | null;
  ngay: string;
  nguoi_tao: string;
  created_at: string;
  ma_thu: string | null;
}

export interface VatTu {
  ma_vt: string;
  ten: string;
  quy_cach: string | null;
  don_vi_tinh: string;
  gia_von: number;
  gia_ban: number;
  nguong_canh_bao_ton: number | null;
  dang_hoat_dong: boolean;
  created_at: string;
}

export interface VatTuTinhToan extends VatTu {
  ton_kho: number;
}

export interface XuatNhapKho {
  ma_xn: string;
  ma_vt: string;
  loai: LoaiXuatNhap;
  so_luong: number;
  ma_don: string | null;
  nguoi_thuc_hien: string;
  nguoi_duyet: string | null;
  ngay_giao_dich: string;
  created_at: string;
}

export interface BaoHanh {
  ma_bh: string;
  ma_don_cu: string;
  noi_dung: string;
  pham_vi: string | null;
  ngay_yeu_cau: string;
  thoi_han_bao_hanh: string | null;
  nguyen_nhan: NguyenNhanBaoHanh | null;
  ket_qua: string | null;
  chi_phi: number | null;
  trang_thai: TrangThaiBaoHanh;
  created_at: string;
}

export interface KpiNhanVien {
  ma_kpi: string;
  ma_nv: string;
  thang: string;
  diem_tong: number;
  chi_tiet_diem: string | null;
  created_at: string;
}

export interface KpiNhanVienTinhToan extends KpiNhanVien {
  xep_loai: XepLoaiKpi;
}

export interface KhieuNai {
  ma_kn: string;
  ma_don: string;
  noi_dung: string;
  muc_do: MucDoKhieuNai;
  nguoi_xu_ly: string | null;
  han_xu_ly: string | null;
  ket_qua: string | null;
  trang_thai: TrangThaiKhieuNai;
  created_at: string;
}

export interface BangGiaDichVu {
  ma_dv: string;
  ten_dich_vu: string;
  nhom_dich_vu: NhomDichVu;
  don_vi_tinh: string;
  gia_tham_khao: string | null;
  dang_hoat_dong: boolean;
  created_at: string;
}

export interface DanhMuc {
  id: string;
  loai_danh_muc: string;
  gia_tri: string;
  mo_ta: string | null;
  thu_tu: number;
  dang_hoat_dong: boolean;
  created_at: string;
}

export interface ThongBao {
  id: string;
  loai: LoaiThongBao;
  tieu_de: string;
  noi_dung: string | null;
  ma_don: string | null;
  ma_vt: string | null;
  ma_yc: string | null;
  nguoi_nhan: string;
  da_doc: boolean;
  da_gui_push: boolean;
  created_at: string;
}

export interface YeuCauDichVu {
  ma_yc: string;
  ho_ten: string;
  dia_chi: string;
  sdt: string;
  dich_vu: DichVu;
  yeu_cau: string;
  trang_thai: TrangThaiYeuCau;
  ma_don: string | null;
  created_at: string;
}

export interface TongHopDashboard {
  id: number;
  don_moi_thang: number;
  don_hoan_thanh_thang: number;
  doanh_thu_thang: number;
  da_thu_thang: number;
  cong_no_hien_tai: number;
  don_tre: number;
  bao_hanh_dang_xu_ly: number;
  khieu_nai_dang_xu_ly: number;
  ty_le_chuyen_doi: number;
  ty_le_sua_lai: number;
  bien_loi_nhuan: number;
}

export interface ThuChiTongHop {
  id: number;
  thu_hom_nay: number;
  chi_hom_nay: number;
  thu_thang_nay: number;
  chi_thang_nay: number;
  thu_nam_nay: number;
  chi_nam_nay: number;
}

export interface CauHinhHeThong {
  khoa: string;
  gia_tri: string;
  mo_ta: string | null;
  updated_at: string;
}
