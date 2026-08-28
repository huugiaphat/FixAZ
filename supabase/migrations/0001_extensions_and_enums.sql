-- =====================================================================
-- 0001: Extensions & Enum types
-- Toàn bộ giá trị enum dùng tiếng Việt có dấu, đúng nguyên văn theo
-- Yeu_Cau_Xay_Dung_App_Huu_Gia_Phat.docx (Mục 6, Phụ lục A).
-- Postgres cho phép enum label là bất kỳ chuỗi UTF-8 nào, chỉ tên
-- type/column mới cần ASCII.
-- =====================================================================

create extension if not exists "pgcrypto";

-- Vai trò đăng nhập (Mục 2) — mỗi tài khoản gắn đúng 1 vai trò
create type vai_tro_enum as enum (
  'Quản lý',
  'CSKH-Điều phối',
  'Thợ',
  'Kế toán',
  'Kho'
);

-- A1. Nhân viên
create type trang_thai_nv_enum as enum ('Đang làm', 'Nghỉ phép', 'Đã nghỉ việc');

-- A2. Khách hàng — nguồn tiếp cận
create type nguon_kh_enum as enum (
  'Điện thoại/Hotline',
  'Zalo/Facebook',
  'App/Website',
  'Khách quen giới thiệu'
);

-- Dùng chung: loại dịch vụ (Đơn hàng, Kỹ năng thợ, Nhóm dịch vụ)
create type dich_vu_enum as enum ('Điện', 'Nước', 'Điện & Nước');
create type nhom_dv_enum as enum ('Điện', 'Nước');

-- A3. Đơn hàng
create type uu_tien_enum as enum ('P1-Khẩn cấp', 'P2-Trong ngày', 'P3-Đặt lịch');

-- Trạng thái đơn hàng: rút gọn từ quy trình 17 bước (Mục 4) thành
-- 9 trạng thái đúng theo ghi chú tại Phụ lục A3 ("9 trạng thái theo 17 bước").
create type trang_thai_don_enum as enum (
  'Mới tiếp nhận',
  'Đã điều phối',
  'Đang khảo sát',
  'Chờ duyệt báo giá',
  'Đang thi công',
  'Chờ nghiệm thu',
  'Đã nghiệm thu - chờ thu tiền',
  'Đã đóng',
  'Đã hủy'
);

-- A4. Chi tiết đơn
create type loai_hang_muc_enum as enum ('Dịch vụ', 'Vật tư');

-- A7. Điều phối
create type trang_thai_dieu_phoi_enum as enum (
  'Đã nhận',
  'Đang di chuyển',
  'Đã đến',
  'Đang khảo sát',
  'Đang thi công',
  'Hoàn thành'
);

-- A9. Thu tiền
create type phuong_thuc_thu_enum as enum ('Tiền mặt', 'Chuyển khoản', 'QR-Ví điện tử');

-- A11. Xuất nhập kho
create type loai_xuat_nhap_enum as enum ('Nhập', 'Xuất');

-- A12. Bảo hành
create type nguyen_nhan_bh_enum as enum ('Lỗi cũ tái phát', 'Lỗi mới phát sinh');
create type trang_thai_bh_enum as enum ('Mới tạo', 'Đang xử lý', 'Đã đóng');

-- A13. KPI nhân viên
create type xep_loai_kpi_enum as enum ('A', 'B', 'C', 'D', 'E');

-- A14. Khiếu nại
create type muc_do_kn_enum as enum ('Thấp', 'Trung bình', 'Cao-Khẩn cấp');
create type trang_thai_kn_enum as enum ('Mới', 'Đang xử lý', 'Đã xử lý');

-- Mục 7. Loại thông báo tự động
create type loai_thong_bao_enum as enum (
  'Nhắc xác nhận phát sinh',
  'Nhắc nộp tiền mặt',
  'Cảnh báo đơn trễ hẹn',
  'Nhắc chăm sóc sau sửa',
  'Cảnh báo tồn kho thấp'
);
