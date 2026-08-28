-- =====================================================================
-- 0002: Bảng nền — Danh mục dùng chung, Nhân viên, Khách hàng
-- =====================================================================

-- A16. Danh mục dùng chung (16_DANH_MUC) — bảng tra cứu, không có khóa
-- chính nghiệp vụ riêng, chứa các danh sách lựa chọn dùng chung
-- (VD: 9 vị trí công việc "ChucVu" chưa được liệt kê cụ thể trong tài
-- liệu tóm tắt này nên để công ty tự nhập qua màn hình Quản trị).
create table danh_muc (
  id uuid primary key default gen_random_uuid(),
  loai_danh_muc text not null,        -- VD: 'ChucVu', 'KhuVuc'
  gia_tri text not null,
  mo_ta text,
  thu_tu integer not null default 0,
  dang_hoat_dong boolean not null default true,
  created_at timestamptz not null default now(),
  unique (loai_danh_muc, gia_tri)
);

comment on table danh_muc is 'A16_DANH_MUC — danh sách lựa chọn dùng chung toàn hệ thống, quản trị tại module Danh mục quản trị (Mục 6.12).';

-- A1. Nhân viên (00_NHAN_VIEN)
create table nhan_vien (
  ma_nv text primary key,                          -- NV-001, NV-002... tăng dần
  auth_user_id uuid unique references auth.users (id) on delete set null,
  ho_ten text not null,
  chuc_vu text not null,                            -- 9 vị trí theo sơ đồ tổ chức (Mục B quy chế) — quản trị qua danh_muc
  vai_tro_app vai_tro_enum not null,
  email text not null unique,                       -- dùng để đăng nhập, phải khớp tài khoản thật
  sdt text,
  ky_nang dich_vu_enum,                             -- Điện / Nước / Điện & Nước
  khu_vuc_phu_trach text,
  trang_thai trang_thai_nv_enum not null default 'Đang làm',
  ngay_vao_lam date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table nhan_vien is 'A1_NHAN_VIEN — 1 tài khoản đăng nhập gắn đúng 1 vai trò (Mục 2).';

-- A2. Khách hàng (01_KHACH_HANG)
create table khach_hang (
  ma_kh text primary key,                           -- KH-000001... tự sinh tăng dần, không sửa tay
  ho_ten text not null,
  sdt text not null,
  dia_chi text not null,
  nguon nguon_kh_enum,
  ngay_tao timestamptz not null default now(),
  nguoi_tao text references nhan_vien (ma_nv),
  created_at timestamptz not null default now()
);

comment on table khach_hang is 'A2_KHACH_HANG.';

create index idx_khach_hang_sdt on khach_hang (sdt);
create index idx_nhan_vien_vai_tro on nhan_vien (vai_tro_app);

-- Cấu hình hệ thống (bổ sung kỹ thuật): giá trị số/tham số công ty tự
-- ấn định và có thể thay đổi mà không cần sửa code — VD hạn mức giảm
-- giá bắt buộc duyệt (nguyên tắc 7), số ngày nhắc chăm sóc sau sửa.
create table cau_hinh_he_thong (
  khoa text primary key,
  gia_tri text not null,
  mo_ta text,
  updated_at timestamptz not null default now()
);

comment on table cau_hinh_he_thong is 'Tham số vận hành do Quản lý cấu hình — thay cho việc hard-code ngưỡng trong code.';

insert into cau_hinh_he_thong (khoa, gia_tri, mo_ta) values
  ('HAN_MUC_GIAM_GIA_PHAN_TRAM', '10', 'Giảm giá vượt % này trên tổng trước giảm bắt buộc phải có người duyệt (nguyên tắc 7) — số minh họa, công ty cập nhật số thật.'),
  ('SO_NGAY_NHAC_CHAM_SOC_SAU_SUA', '2', 'Số ngày sau khi đơn hoàn thành thì tự động nhắc CSKH chăm sóc khách (1-3 ngày theo Mục A16 quy chế).'),
  ('SO_GIO_NHAC_PHAT_SINH_CHUA_XAC_NHAN', '2', 'Số giờ kể từ khi tạo phát sinh mà khách chưa xác nhận thì nhắc Quản lý/CSKH-Điều phối.');
