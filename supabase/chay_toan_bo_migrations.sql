-- FILE GỘP TỰ ĐỘNG từ supabase/migrations/0001..0017 theo đúng thứ tự — dán 1 lần vào SQL Editor rồi Run.

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
-- =====================================================================
-- 0003: Vòng đời đơn hàng — Đơn hàng (bảng trung tâm), Chi tiết đơn,
-- Báo giá, Phát sinh, Điều phối, Nghiệm thu, Thu tiền
-- Lưu ý: TongTien/DaThu/CongNo/ThanhTien KHÔNG có ở đây — sẽ là VIEW
-- tính toán động trong migration 0008.
-- =====================================================================

-- A3. Đơn hàng (02_DON_HANG) — BẢNG TRUNG TÂM
create table don_hang (
  ma_don text primary key,                          -- SC-YYMMDD-XXX, số thứ tự reset theo ngày
  ma_kh text not null references khach_hang (ma_kh),
  ngay_tiep_nhan timestamptz not null default now(),
  nguoi_tiep_nhan text not null references nhan_vien (ma_nv),
  dich_vu dich_vu_enum not null,
  mo_ta_su_co text not null,
  uu_tien uu_tien_enum not null,
  khung_gio_mong_muon text,
  anh_hien_trang text[] not null default '{}',       -- đường dẫn Supabase Storage
  hien_trang_khao_sat text,
  nguyen_nhan_khao_sat text,
  hang_muc_de_xuat text,
  trang_thai trang_thai_don_enum not null default 'Mới tiếp nhận',
  tho_phu_trach text references nhan_vien (ma_nv),
  ly_do_tu_choi_huy text,
  ngay_dong_don date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_ly_do_huy check (trang_thai <> 'Đã hủy' or ly_do_tu_choi_huy is not null)
);

comment on table don_hang is 'A3_DON_HANG — thực thể trung tâm, hầu hết các bảng khác tham chiếu tới.';
comment on column don_hang.anh_hien_trang is 'Ảnh chụp hiện trạng sự cố lúc tiếp nhận, có thể nhiều ảnh.';

create index idx_don_hang_ma_kh on don_hang (ma_kh);
create index idx_don_hang_tho on don_hang (tho_phu_trach);
create index idx_don_hang_trang_thai on don_hang (trang_thai);
create index idx_don_hang_ngay on don_hang (ngay_tiep_nhan);

-- A4. Chi tiết đơn (03_CHI_TIET_DON) — các dòng dịch vụ/vật tư chốt
-- trong báo giá cuối cùng
create table chi_tiet_don (
  ma_dong text primary key,
  ma_don text not null references don_hang (ma_don) on delete cascade,
  loai loai_hang_muc_enum not null,
  ma_dv_vt text,                                     -- tham chiếu mềm tới Bảng giá dịch vụ hoặc Vật tư
  ten_hang_muc text not null,
  so_luong numeric not null check (so_luong > 0),
  don_vi_tinh text,
  gia_von numeric,                                   -- nội bộ — ẩn với vai trò Thợ ở tầng API/view, không trả field này cho Thợ
  gia_ban numeric not null check (gia_ban >= 0),
  created_at timestamptz not null default now()
  -- ThanhTien = SoLuong * GiaBan -> xem view v_chi_tiet_don
);

comment on table chi_tiet_don is 'A4_CHI_TIET_DON.';
create index idx_chi_tiet_don_ma_don on chi_tiet_don (ma_don);

-- A5. Báo giá (04_BAO_GIA) — nhiều phiên bản cho 1 đơn
create table bao_gia (
  ma_bg text primary key,                            -- BG-YYMMDD-XXX
  ma_don text not null references don_hang (ma_don) on delete cascade,
  phien_ban integer not null default 1,
  tong_truoc_giam numeric not null check (tong_truoc_giam >= 0),
  giam_gia numeric not null default 0 check (giam_gia >= 0),
  tong_sau_giam numeric not null check (tong_sau_giam >= 0),
  nguoi_lap text not null references nhan_vien (ma_nv),
  nguoi_duyet text references nhan_vien (ma_nv),      -- bắt buộc nếu GiamGia vượt hạn mức — enforce ở 0009 (trigger)
  khach_xac_nhan boolean not null default false,      -- bắt buộc = true trước khi đơn chuyển "Đang thi công"
  ngay_xac_nhan timestamptz,
  pham_vi_bao_gom text,
  pham_vi_khong_bao_gom text,
  created_at timestamptz not null default now(),
  unique (ma_don, phien_ban)
);

comment on table bao_gia is 'A5_BAO_GIA.';
create index idx_bao_gia_ma_don on bao_gia (ma_don);

-- A6. Phát sinh (05_PHAT_SINH)
create table phat_sinh (
  ma_ps text primary key,                            -- PS-YYMMDD-XXX
  ma_don text not null references don_hang (ma_don) on delete cascade,
  nguyen_nhan text not null,
  anh_phat_sinh text[] not null default '{}',
  hang_muc text not null,
  gia numeric not null check (gia >= 0),
  khach_xac_nhan boolean not null default false,      -- bắt buộc trước khi làm, trừ khẩn cấp
  truong_hop_khan_cap boolean not null default false, -- ngoại lệ an toàn cấp thiết (nguyên tắc 2/3)
  ngay_xac_nhan timestamptz,
  created_at timestamptz not null default now()
);

comment on table phat_sinh is 'A6_PHAT_SINH.';
create index idx_phat_sinh_ma_don on phat_sinh (ma_don);
create index idx_phat_sinh_cho_xac_nhan on phat_sinh (khach_xac_nhan) where khach_xac_nhan = false;

-- A7. Điều phối (06_DIEU_PHOI)
create table dieu_phoi (
  ma_dp text primary key,
  ma_don text not null references don_hang (ma_don) on delete cascade,
  tho text not null references nhan_vien (ma_nv),
  gio_nhan timestamptz,
  gio_xuat_phat timestamptz,
  eta timestamptz,                                    -- có thể cập nhật lại nếu trễ
  check_in timestamptz,
  check_out timestamptz,
  trang_thai trang_thai_dieu_phoi_enum not null default 'Đã nhận',
  created_at timestamptz not null default now()
);

comment on table dieu_phoi is 'A7_DIEU_PHOI.';
create index idx_dieu_phoi_ma_don on dieu_phoi (ma_don);
create index idx_dieu_phoi_tho on dieu_phoi (tho);

-- A8. Nghiệm thu (07_NGHIEM_THU)
create table nghiem_thu (
  ma_nt text primary key,
  ma_don text not null references don_hang (ma_don) on delete cascade,
  cl_dung_pham_vi boolean not null default false,
  cl_dung_vat_tu boolean not null default false,
  cl_thiet_bi_van_hanh boolean not null default false,
  cl_khong_ro_ri boolean not null default false,
  cl_ve_sinh boolean not null default false,
  cl_huong_dan_khach boolean not null default false,
  anh_sau_sua text[] not null default '{}',
  y_kien_khach text,
  khach_xac_nhan boolean not null default false,       -- bắt buộc trước khi cho phép Thu tiền
  diem_danh_gia smallint check (diem_danh_gia between 1 and 5),
  ngay_nghiem_thu timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint chk_anh_sau_sua check (array_length(anh_sau_sua, 1) is not null and array_length(anh_sau_sua, 1) > 0)
);

comment on table nghiem_thu is 'A8_NGHIEM_THU — checklist 6 mục bắt buộc, ảnh sau sửa bắt buộc.';
create index idx_nghiem_thu_ma_don on nghiem_thu (ma_don);

-- A9. Thu tiền (08_THU_TIEN)
create table thu_tien (
  ma_thu text primary key,
  ma_don text not null references don_hang (ma_don) on delete cascade,
  so_tien numeric not null check (so_tien > 0),
  phuong_thuc phuong_thuc_thu_enum not null,
  ma_giao_dich text,                                   -- bắt buộc nếu Chuyển khoản/QR
  nguoi_thu text not null references nhan_vien (ma_nv),
  ngay_thu timestamptz not null default now(),
  da_nop_ve_cong_ty boolean not null default false,     -- áp dụng khi Tiền mặt
  created_at timestamptz not null default now(),
  constraint chk_ma_giao_dich check (
    phuong_thuc = 'Tiền mặt' or (ma_giao_dich is not null and length(trim(ma_giao_dich)) > 0)
  )
);

comment on table thu_tien is 'A9_THU_TIEN.';
create index idx_thu_tien_ma_don on thu_tien (ma_don);
create index idx_thu_tien_chua_nop on thu_tien (da_nop_ve_cong_ty) where phuong_thuc = 'Tiền mặt' and da_nop_ve_cong_ty = false;
-- =====================================================================
-- 0004: Kho vật tư — Vật tư (danh mục), Xuất nhập kho
-- TonKho KHÔNG lưu cứng — xem view v_vat_tu ở 0008.
-- =====================================================================

-- A10. Vật tư - danh mục kho (09_VAT_TU)
create table vat_tu (
  ma_vt text primary key,
  ten text not null,
  quy_cach text,
  don_vi_tinh text not null,
  gia_von numeric not null check (gia_von >= 0),
  gia_ban numeric not null check (gia_ban >= 0),
  nguong_canh_bao_ton numeric,                        -- cảnh báo khi tồn thấp hơn mức này
  dang_hoat_dong boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table vat_tu is 'A10_VAT_TU. TonKho = tổng Nhập - tổng Xuất, xem view v_vat_tu.';

-- A11. Xuất nhập kho (10_XUAT_NHAP)
create table xuat_nhap_kho (
  ma_xn text primary key,
  ma_vt text not null references vat_tu (ma_vt),
  loai loai_xuat_nhap_enum not null,
  so_luong numeric not null check (so_luong > 0),
  ma_don text references don_hang (ma_don),           -- chỉ điền khi xuất cho 1 đơn cụ thể
  nguoi_thuc_hien text not null references nhan_vien (ma_nv),
  nguoi_duyet text references nhan_vien (ma_nv),
  ngay_giao_dich timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table xuat_nhap_kho is 'A11_XUAT_NHAP_KHO.';
create index idx_xuat_nhap_ma_vt on xuat_nhap_kho (ma_vt);
create index idx_xuat_nhap_ma_don on xuat_nhap_kho (ma_don);
-- =====================================================================
-- 0005: Bảo hành, KPI nhân viên, Khiếu nại, Bảng giá dịch vụ
-- XepLoai KHÔNG lưu cứng — xem view v_kpi_nhan_vien ở 0008.
-- =====================================================================

-- A12. Bảo hành (11_BAO_HANH)
create table bao_hanh (
  ma_bh text primary key,
  ma_don_cu text not null references don_hang (ma_don),
  noi_dung text not null,
  pham_vi text,
  ngay_yeu_cau date not null default current_date,
  thoi_han_bao_hanh date,                              -- ngày hết hạn bảo hành của đơn cũ
  nguyen_nhan nguyen_nhan_bh_enum,
  ket_qua text,
  chi_phi numeric default 0,                           -- 0 nếu bảo hành miễn phí
  trang_thai trang_thai_bh_enum not null default 'Mới tạo',
  created_at timestamptz not null default now()
);

comment on table bao_hanh is 'A12_BAO_HANH.';
create index idx_bao_hanh_don_cu on bao_hanh (ma_don_cu);

-- A13. KPI nhân viên (12_KPI)
create table kpi_nhan_vien (
  ma_kpi text primary key,
  ma_nv text not null references nhan_vien (ma_nv),
  thang text not null,                                 -- yyyy-mm
  diem_tong numeric not null check (diem_tong >= 0 and diem_tong <= 100),
  chi_tiet_diem text,
  created_at timestamptz not null default now(),
  unique (ma_nv, thang)
  -- XepLoai = A (90-100) .. E (<60) -> xem view v_kpi_nhan_vien
);

comment on table kpi_nhan_vien is 'A13_KPI_NHAN_VIEN.';

-- A14. Khiếu nại (13_KHIEU_NAI)
create table khieu_nai (
  ma_kn text primary key,
  ma_don text not null references don_hang (ma_don),
  noi_dung text not null,
  muc_do muc_do_kn_enum not null,
  nguoi_xu_ly text references nhan_vien (ma_nv),
  han_xu_ly date,
  ket_qua text,
  trang_thai trang_thai_kn_enum not null default 'Mới',
  created_at timestamptz not null default now()
);

comment on table khieu_nai is 'A14_KHIEU_NAI.';
create index idx_khieu_nai_ma_don on khieu_nai (ma_don);
create index idx_khieu_nai_trang_thai on khieu_nai (trang_thai);

-- A15. Bảng giá dịch vụ (15_BANG_GIA_DICH_VU)
create table bang_gia_dich_vu (
  ma_dv text primary key,
  ten_dich_vu text not null,
  nhom_dich_vu nhom_dv_enum not null,
  don_vi_tinh text not null,
  gia_tham_khao text,                                  -- lưu dạng text vì có thể là khoảng giá (VD "200.000 - 500.000 đ")
  dang_hoat_dong boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table bang_gia_dich_vu is 'A15_BANG_GIA_DICH_VU — giá hiện là khung minh họa, công ty sẽ cập nhật số thật trước khi vận hành.';
-- =====================================================================
-- 0006: Bổ sung kỹ thuật ngoài 17 bảng gốc — cần thiết để đáp ứng
-- Mục 7 (Tự động hóa & thông báo) và nguyên tắc 4 (mọi đơn phải có
-- dấu vết / audit trail).
-- =====================================================================

-- Thông báo trong app (chuông thông báo + nguồn cho Web Push)
create table thong_bao (
  id uuid primary key default gen_random_uuid(),
  loai loai_thong_bao_enum not null,
  tieu_de text not null,
  noi_dung text,
  ma_don text references don_hang (ma_don),
  ma_vt text references vat_tu (ma_vt),
  nguoi_nhan text not null references nhan_vien (ma_nv),
  da_doc boolean not null default false,
  da_gui_push boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table thong_bao is 'Log thông báo tự động (Mục 7) — nguồn cho chuông thông báo trong app và trigger gửi Web Push.';
create index idx_thong_bao_nguoi_nhan on thong_bao (nguoi_nhan, da_doc);

-- Đăng ký nhận Web Push theo từng nhân viên/thiết bị
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  ma_nv text not null references nhan_vien (ma_nv) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

comment on table push_subscriptions is 'VAPID Web Push subscription — 1 nhân viên có thể có nhiều thiết bị (đăng nhập nhiều thiết bị theo Mục 10).';
create index idx_push_subscriptions_nv on push_subscriptions (ma_nv);

-- Nhật ký thao tác (nguyên tắc 4) — không cho phép UPDATE/DELETE, chỉ INSERT
-- (thực thi bằng RLS ở 0012, không cấp quyền update/delete cho bất kỳ role nào).
create table audit_log (
  id bigint generated always as identity primary key,
  bang text not null,
  khoa_chinh text not null,
  hanh_dong text not null,                              -- INSERT / UPDATE / DELETE
  du_lieu_truoc jsonb,
  du_lieu_sau jsonb,
  thuc_hien_boi text references nhan_vien (ma_nv),
  thoi_gian timestamptz not null default now()
);

comment on table audit_log is 'Audit trail phục vụ nguyên tắc 4 — ghi tự động qua trigger generic ở 0010, không cho sửa/xóa.';
create index idx_audit_log_bang_khoa on audit_log (bang, khoa_chinh);
-- =====================================================================
-- 0007: Hàm tiện ích dùng chung + sinh mã tự động cho các khóa chính
-- Các định dạng có nêu rõ trong tài liệu được tuân thủ đúng:
--   NV-001, KH-000001, SC-YYMMDD-XXX (reset theo ngày),
--   BG-YYMMDD-XXX, PS-YYMMDD-XXX (reset theo ngày).
-- Các khóa không nêu định dạng cụ thể dùng PREFIX-000001 tăng dần.
-- =====================================================================

-- Bộ đếm nguyên tử theo khóa (tránh trùng/khoảng trống khi nhiều
-- người tạo đơn cùng lúc — an toàn concurrency nhờ UPSERT nguyên tử).
create table bo_dem_ma (
  khoa text primary key,
  gia_tri bigint not null default 0
);

create function f_sinh_so(p_khoa text) returns bigint
language sql security definer set search_path = public as $$
  insert into bo_dem_ma (khoa, gia_tri) values (p_khoa, 1)
  on conflict (khoa) do update set gia_tri = bo_dem_ma.gia_tri + 1
  returning gia_tri;
$$;

-- Nhân viên hiện tại (theo tài khoản Supabase Auth đang đăng nhập)
create function f_ma_nv_hien_tai() returns text
language sql stable security definer set search_path = public as $$
  select ma_nv from nhan_vien where auth_user_id = auth.uid();
$$;

create function f_vai_tro_hien_tai() returns vai_tro_enum
language sql stable security definer set search_path = public as $$
  select vai_tro_app from nhan_vien where auth_user_id = auth.uid();
$$;

-- ---- Sinh mã cho từng bảng ----

create function f_ma_nv_moi() returns text language plpgsql as $$
begin
  return 'NV-' || lpad(f_sinh_so('NV')::text, 3, '0');
end; $$;

create function f_ma_kh_moi() returns text language plpgsql as $$
begin
  return 'KH-' || lpad(f_sinh_so('KH')::text, 6, '0');
end; $$;

create function f_ma_don_moi() returns text language plpgsql as $$
declare v_ngay text := to_char(now(), 'YYMMDD'); v_so bigint;
begin
  v_so := f_sinh_so('SC-' || v_ngay);
  return 'SC-' || v_ngay || '-' || lpad(v_so::text, 3, '0');
end; $$;

create function f_ma_bg_moi() returns text language plpgsql as $$
declare v_ngay text := to_char(now(), 'YYMMDD'); v_so bigint;
begin
  v_so := f_sinh_so('BG-' || v_ngay);
  return 'BG-' || v_ngay || '-' || lpad(v_so::text, 3, '0');
end; $$;

create function f_ma_ps_moi() returns text language plpgsql as $$
declare v_ngay text := to_char(now(), 'YYMMDD'); v_so bigint;
begin
  v_so := f_sinh_so('PS-' || v_ngay);
  return 'PS-' || v_ngay || '-' || lpad(v_so::text, 3, '0');
end; $$;

create function f_ma_generic_moi(p_prefix text) returns text language plpgsql as $$
begin
  return p_prefix || '-' || lpad(f_sinh_so(p_prefix)::text, 6, '0');
end; $$;

-- ---- Trigger tự sinh khóa chính + trường tự động khi INSERT ----

create function f_bi_nhan_vien() returns trigger language plpgsql as $$
begin
  if new.ma_nv is null then new.ma_nv := f_ma_nv_moi(); end if;
  return new;
end; $$;
create trigger trg_bi_nhan_vien before insert on nhan_vien
  for each row execute function f_bi_nhan_vien();

create function f_bi_khach_hang() returns trigger language plpgsql as $$
begin
  if new.ma_kh is null then new.ma_kh := f_ma_kh_moi(); end if;
  if new.nguoi_tao is null then new.nguoi_tao := f_ma_nv_hien_tai(); end if;
  return new;
end; $$;
create trigger trg_bi_khach_hang before insert on khach_hang
  for each row execute function f_bi_khach_hang();

create function f_bi_don_hang() returns trigger language plpgsql as $$
begin
  if new.ma_don is null then new.ma_don := f_ma_don_moi(); end if;
  if new.nguoi_tiep_nhan is null then new.nguoi_tiep_nhan := f_ma_nv_hien_tai(); end if;
  return new;
end; $$;
create trigger trg_bi_don_hang before insert on don_hang
  for each row execute function f_bi_don_hang();

create function f_bi_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;
create trigger trg_don_hang_updated_at before update on don_hang
  for each row execute function f_bi_updated_at();
create trigger trg_nhan_vien_updated_at before update on nhan_vien
  for each row execute function f_bi_updated_at();

create function f_bi_chi_tiet_don() returns trigger language plpgsql as $$
begin
  if new.ma_dong is null then new.ma_dong := f_ma_generic_moi('CTD'); end if;
  return new;
end; $$;
create trigger trg_bi_chi_tiet_don before insert on chi_tiet_don
  for each row execute function f_bi_chi_tiet_don();

create function f_bi_bao_gia() returns trigger language plpgsql as $$
begin
  if new.ma_bg is null then new.ma_bg := f_ma_bg_moi(); end if;
  if new.nguoi_lap is null then new.nguoi_lap := f_ma_nv_hien_tai(); end if;
  if new.phien_ban is null or new.phien_ban = 1 then
    select coalesce(max(phien_ban), 0) + 1 into new.phien_ban from bao_gia where ma_don = new.ma_don;
  end if;
  return new;
end; $$;
create trigger trg_bi_bao_gia before insert on bao_gia
  for each row execute function f_bi_bao_gia();

create function f_bi_phat_sinh() returns trigger language plpgsql as $$
begin
  if new.ma_ps is null then new.ma_ps := f_ma_ps_moi(); end if;
  return new;
end; $$;
create trigger trg_bi_phat_sinh before insert on phat_sinh
  for each row execute function f_bi_phat_sinh();

create function f_bi_dieu_phoi() returns trigger language plpgsql as $$
begin
  if new.ma_dp is null then new.ma_dp := f_ma_generic_moi('DP'); end if;
  return new;
end; $$;
create trigger trg_bi_dieu_phoi before insert on dieu_phoi
  for each row execute function f_bi_dieu_phoi();

create function f_bi_nghiem_thu() returns trigger language plpgsql as $$
begin
  if new.ma_nt is null then new.ma_nt := f_ma_generic_moi('NT'); end if;
  return new;
end; $$;
create trigger trg_bi_nghiem_thu before insert on nghiem_thu
  for each row execute function f_bi_nghiem_thu();

create function f_bi_thu_tien() returns trigger language plpgsql as $$
begin
  if new.ma_thu is null then new.ma_thu := f_ma_generic_moi('THU'); end if;
  if new.nguoi_thu is null then new.nguoi_thu := f_ma_nv_hien_tai(); end if;
  return new;
end; $$;
create trigger trg_bi_thu_tien before insert on thu_tien
  for each row execute function f_bi_thu_tien();

create function f_bi_vat_tu() returns trigger language plpgsql as $$
begin
  if new.ma_vt is null then new.ma_vt := f_ma_generic_moi('VT'); end if;
  return new;
end; $$;
create trigger trg_bi_vat_tu before insert on vat_tu
  for each row execute function f_bi_vat_tu();

create function f_bi_xuat_nhap_kho() returns trigger language plpgsql as $$
begin
  if new.ma_xn is null then new.ma_xn := f_ma_generic_moi('XN'); end if;
  if new.nguoi_thuc_hien is null then new.nguoi_thuc_hien := f_ma_nv_hien_tai(); end if;
  return new;
end; $$;
create trigger trg_bi_xuat_nhap_kho before insert on xuat_nhap_kho
  for each row execute function f_bi_xuat_nhap_kho();

create function f_bi_bao_hanh() returns trigger language plpgsql as $$
begin
  if new.ma_bh is null then new.ma_bh := f_ma_generic_moi('BH'); end if;
  return new;
end; $$;
create trigger trg_bi_bao_hanh before insert on bao_hanh
  for each row execute function f_bi_bao_hanh();

create function f_bi_kpi_nhan_vien() returns trigger language plpgsql as $$
begin
  if new.ma_kpi is null then new.ma_kpi := f_ma_generic_moi('KPI'); end if;
  return new;
end; $$;
create trigger trg_bi_kpi_nhan_vien before insert on kpi_nhan_vien
  for each row execute function f_bi_kpi_nhan_vien();

create function f_bi_khieu_nai() returns trigger language plpgsql as $$
begin
  if new.ma_kn is null then new.ma_kn := f_ma_generic_moi('KN'); end if;
  return new;
end; $$;
create trigger trg_bi_khieu_nai before insert on khieu_nai
  for each row execute function f_bi_khieu_nai();

create function f_bi_bang_gia_dich_vu() returns trigger language plpgsql as $$
begin
  if new.ma_dv is null then new.ma_dv := f_ma_generic_moi('DV'); end if;
  return new;
end; $$;
create trigger trg_bi_bang_gia_dich_vu before insert on bang_gia_dich_vu
  for each row execute function f_bi_bang_gia_dich_vu();
-- =====================================================================
-- 0008: View tính toán động — thay cho các cột "derived" không được
-- phép lưu cứng theo yêu cầu kỹ thuật ở Mục 3 và ghi chú tại Phụ lục A.
-- =====================================================================

-- A4 (ThanhTien = SoLuong x GiaBan). GiaVon là dữ liệu nội bộ — ẩn với
-- vai trò Thợ (Mục Phụ lục A4). Vì Supabase ánh xạ mọi vai trò vào
-- cùng 1 Postgres role "authenticated" nên không thể ẩn cột bằng
-- column-level GRANT; phải ẩn bằng CASE theo vai trò hiện tại ở view.
create view v_chi_tiet_don as
select
  c.ma_dong, c.ma_don, c.loai, c.ma_dv_vt, c.ten_hang_muc, c.so_luong, c.don_vi_tinh,
  case when f_vai_tro_hien_tai() = 'Thợ' then null else c.gia_von end as gia_von,
  c.gia_ban,
  c.created_at,
  (c.so_luong * c.gia_ban) as thanh_tien
from chi_tiet_don c;

-- A3 (TongTien/DaThu/CongNo)
create view v_don_hang as
select
  d.*,
  coalesce(ct.tong_chi_tiet, 0) + coalesce(ps.tong_phat_sinh, 0) as tong_tien,
  coalesce(t.tong_da_thu, 0) as da_thu,
  (coalesce(ct.tong_chi_tiet, 0) + coalesce(ps.tong_phat_sinh, 0)) - coalesce(t.tong_da_thu, 0) as cong_no
from don_hang d
left join (
  select ma_don, sum(so_luong * gia_ban) as tong_chi_tiet
  from chi_tiet_don group by ma_don
) ct on ct.ma_don = d.ma_don
left join (
  select ma_don, sum(gia) as tong_phat_sinh
  from phat_sinh where khach_xac_nhan = true group by ma_don
) ps on ps.ma_don = d.ma_don
left join (
  select ma_don, sum(so_tien) as tong_da_thu
  from thu_tien group by ma_don
) t on t.ma_don = d.ma_don;

comment on view v_don_hang is 'Đơn hàng kèm TongTien/DaThu/CongNo tính động — dùng thay bảng don_hang ở tầng đọc dữ liệu.';

-- A10 (TonKho = Nhập - Xuất)
create view v_vat_tu as
select
  v.*,
  coalesce(nx.ton_kho, 0) as ton_kho
from vat_tu v
left join (
  select
    ma_vt,
    sum(case when loai = 'Nhập' then so_luong else -so_luong end) as ton_kho
  from xuat_nhap_kho
  group by ma_vt
) nx on nx.ma_vt = v.ma_vt;

comment on view v_vat_tu is 'Vật tư kèm TonKho tính động (Nhập - Xuất) — dùng cho cảnh báo tồn kho thấp.';

-- A13 (XepLoai A-E)
create view v_kpi_nhan_vien as
select
  k.*,
  case
    when k.diem_tong >= 90 then 'A'
    when k.diem_tong >= 75 then 'B'
    when k.diem_tong >= 60 then 'C'
    when k.diem_tong >= 45 then 'D'
    else 'E'
  end::xep_loai_kpi_enum as xep_loai
from kpi_nhan_vien k;

comment on view v_kpi_nhan_vien is 'A (90-100) đến E (<60) theo Mục 6.10 — ngưỡng B/C/D nội suy đều vì tài liệu chỉ nêu rõ mốc A và E, công ty có thể yêu cầu điều chỉnh khi có bộ tiêu chí chính thức.';

-- A17. Tổng hợp KPI Dashboard (view thay bảng vật lý — "1 dòng duy
-- nhất", toàn bộ trường tính toán động, phục vụ Mục 8).
create view v_tong_hop_dashboard as
with thang_hien_tai as (
  select date_trunc('month', now()) as dau_thang
),
don_thang as (
  select d.* from don_hang d, thang_hien_tai t
  where d.ngay_tiep_nhan >= t.dau_thang
),
don_hoan_thanh_thang as (
  select d.* from v_don_hang d, thang_hien_tai t
  where d.trang_thai = 'Đã đóng' and d.ngay_dong_don >= t.dau_thang::date
),
bao_gia_xac_nhan_thang as (
  select distinct bg.ma_don from bao_gia bg, thang_hien_tai t
  where bg.khach_xac_nhan = true and bg.ngay_xac_nhan >= t.dau_thang
),
don_tre as (
  select dp.ma_don from dieu_phoi dp
  where dp.check_in is null and dp.eta is not null and dp.eta < now()
),
gia_von_thang as (
  select coalesce(sum(ct.so_luong * ct.gia_von), 0) as tong_gia_von
  from chi_tiet_don ct
  join don_hoan_thanh_thang d on d.ma_don = ct.ma_don
),
chi_phi_bao_hanh_thang as (
  select coalesce(sum(bh.chi_phi), 0) as tong_chi_phi from bao_hanh bh, thang_hien_tai t
  where bh.created_at >= t.dau_thang
),
khieu_nai_hoan_thanh_thang as (
  select count(distinct kn.ma_don) as so_don_khieu_nai
  from khieu_nai kn
  join don_hoan_thanh_thang d on d.ma_don = kn.ma_don
)
select
  1 as id,
  (select count(*) from don_thang) as don_moi_thang,
  (select count(*) from don_hoan_thanh_thang) as don_hoan_thanh_thang,
  (select coalesce(sum(tong_tien), 0) from don_hoan_thanh_thang) as doanh_thu_thang,
  (select coalesce(sum(da_thu), 0) from don_hoan_thanh_thang) as da_thu_thang,
  (select coalesce(sum(cong_no), 0) from v_don_hang where trang_thai <> 'Đã hủy') as cong_no_hien_tai,
  (select count(*) from don_tre) as don_tre,
  (select count(*) from bao_hanh where trang_thai <> 'Đã đóng') as bao_hanh_dang_xu_ly,
  (select count(*) from khieu_nai where trang_thai <> 'Đã xử lý') as khieu_nai_dang_xu_ly,
  case when (select count(*) from don_thang) = 0 then 0
    else round((select count(*) from bao_gia_xac_nhan_thang)::numeric / (select count(*) from don_thang) * 100, 1)
  end as ty_le_chuyen_doi,
  case when (select count(*) from don_hoan_thanh_thang) = 0 then 0
    else round((select so_don_khieu_nai from khieu_nai_hoan_thanh_thang)::numeric / (select count(*) from don_hoan_thanh_thang) * 100, 1)
  end as ty_le_sua_lai,
  case when (select coalesce(sum(tong_tien), 0) from don_hoan_thanh_thang) = 0 then 0
    else round(
      ((select coalesce(sum(tong_tien), 0) from don_hoan_thanh_thang)
        - (select tong_gia_von from gia_von_thang)
        - (select tong_chi_phi from chi_phi_bao_hanh_thang))
      / (select sum(tong_tien) from don_hoan_thanh_thang) * 100, 1)
  end as bien_loi_nhuan;

comment on view v_tong_hop_dashboard is 'A17_TONGHOP — phục vụ Mục 8 Dashboard Quản lý, tất cả tính động cho tháng hiện tại. Biên lợi nhuận là giá trị xấp xỉ (chưa mô hình hóa chi phí nhân công/vận hành ngoài giá vốn vật tư + chi phí bảo hành, vì tài liệu chưa có thực thể chi phí riêng).';
-- =====================================================================
-- 0009: 8 nguyên tắc nghiệp vụ bắt buộc (Mục 5) — ràng buộc cứng ở
-- tầng CSDL/backend, không chỉ cảnh báo giao diện.
--
-- Nguyên tắc 1 (mọi bản ghi phải gắn Mã đơn hợp lệ)  -> NOT NULL FK, đã có ở 0003-0005.
-- Nguyên tắc 3 (phát sinh cần xác nhận trước khi làm) -> nhắc tự động (Mục 7 / phase thông báo), không chặn cứng vì bản thân tài liệu mô tả đây là cơ chế "cảnh báo/nhắc nhở", trừ khẩn cấp.
-- Nguyên tắc 4 (mọi đơn phải có dấu vết)              -> audit_log generic trigger, xem 0010.
-- Nguyên tắc 5 (tiền thu phải ghi nhận & đối soát)    -> bảng thu_tien + cờ da_nop_ve_cong_ty, đã có ở 0003.
-- Nguyên tắc 6 (chỉ Quản lý/CSKH-Điều phối tạo KH/Đơn) -> RLS INSERT policy, xem 0012.
-- Nguyên tắc 2, 7, 8                                   -> enforce ở migration này.
-- =====================================================================

-- Nguyên tắc 7: giảm giá vượt hạn mức % (cau_hinh_he_thong) bắt buộc
-- có NguoiDuyet; đồng thời luôn tính lại TongSauGiam từ 2 số nhập vào
-- để tránh sai lệch dữ liệu client gửi lên.
create function f_bi_bao_gia_kiem_tra() returns trigger language plpgsql as $$
declare
  v_han_muc numeric;
  v_phan_tram numeric;
begin
  select gia_tri::numeric into v_han_muc from cau_hinh_he_thong where khoa = 'HAN_MUC_GIAM_GIA_PHAN_TRAM';
  if new.tong_truoc_giam > 0 then
    v_phan_tram := (new.giam_gia / new.tong_truoc_giam) * 100;
  else
    v_phan_tram := 0;
  end if;

  if v_phan_tram > coalesce(v_han_muc, 0) and new.nguoi_duyet is null then
    raise exception 'Giảm giá %% (%.1f%%) vượt hạn mức %.1f%% — bắt buộc phải có người phê duyệt (nguyên tắc 7).', v_phan_tram, v_han_muc;
  end if;

  new.tong_sau_giam := new.tong_truoc_giam - new.giam_gia;
  return new;
end; $$;

create trigger trg_bao_gia_kiem_tra before insert or update on bao_gia
  for each row execute function f_bi_bao_gia_kiem_tra();

-- Chuyển trạng thái Đơn hàng qua RPC duy nhất — client KHÔNG được
-- UPDATE trực tiếp cột trang_thai (chặn ở RLS UPDATE policy, xem 0012),
-- bắt buộc gọi hàm này để đảm bảo đi qua toàn bộ kiểm tra nguyên tắc.
create function f_chuyen_trang_thai_don(
  p_ma_don text,
  p_trang_thai_moi trang_thai_don_enum,
  p_ly_do_huy text default null,
  p_xac_nhan_khan_cap boolean default false
) returns don_hang language plpgsql security definer set search_path = public as $$
declare
  v_don don_hang;
  v_co_bao_gia_xac_nhan boolean;
  v_co_nghiem_thu_xac_nhan boolean;
  v_cong_no numeric;
  v_vai_tro vai_tro_enum;
begin
  -- Cho phép UPDATE cột trang_thai đi qua trong transaction này — xem
  -- trigger chặn f_bi_don_hang_chan_doi_thang bên dưới. Đây là CÁCH
  -- DUY NHẤT hợp lệ để đổi trạng thái, kể cả với vai trò Quản lý.
  perform set_config('app.bypass_state_guard', 'true', true);

  select * into v_don from don_hang where ma_don = p_ma_don for update;
  if not found then
    raise exception 'Không tìm thấy đơn hàng %', p_ma_don;
  end if;

  v_vai_tro := f_vai_tro_hien_tai();

  -- Đồ thị chuyển trạng thái hợp lệ (rút gọn từ quy trình 17 bước, Mục 4)
  if p_trang_thai_moi <> 'Đã hủy' then
    if not (
      (v_don.trang_thai = 'Mới tiếp nhận' and p_trang_thai_moi = 'Đã điều phối') or
      (v_don.trang_thai = 'Đã điều phối' and p_trang_thai_moi = 'Đang khảo sát') or
      (v_don.trang_thai = 'Đang khảo sát' and p_trang_thai_moi = 'Chờ duyệt báo giá') or
      (v_don.trang_thai = 'Chờ duyệt báo giá' and p_trang_thai_moi = 'Đang thi công') or
      (v_don.trang_thai = 'Đang thi công' and p_trang_thai_moi = 'Chờ nghiệm thu') or
      (v_don.trang_thai = 'Chờ nghiệm thu' and p_trang_thai_moi = 'Đã nghiệm thu - chờ thu tiền') or
      (v_don.trang_thai = 'Đã nghiệm thu - chờ thu tiền' and p_trang_thai_moi = 'Đã đóng')
    ) then
      raise exception 'Không được chuyển trạng thái từ "%" sang "%"', v_don.trang_thai, p_trang_thai_moi;
    end if;
  else
    if v_don.trang_thai in ('Đã đóng', 'Đã hủy') then
      raise exception 'Đơn đã "%" không thể hủy', v_don.trang_thai;
    end if;
    if p_ly_do_huy is null or length(trim(p_ly_do_huy)) = 0 then
      raise exception 'Bắt buộc nhập lý do khi hủy đơn (nguyên tắc bắt buộc tại Mục 6.2)';
    end if;
  end if;

  -- Nguyên tắc 2: không thi công nếu chưa có báo giá được khách xác
  -- nhận, trừ khi Quản lý xác nhận xử lý an toàn khẩn cấp.
  if p_trang_thai_moi = 'Đang thi công' then
    select exists (select 1 from bao_gia where ma_don = p_ma_don and khach_xac_nhan = true)
      into v_co_bao_gia_xac_nhan;
    if not v_co_bao_gia_xac_nhan and not (p_xac_nhan_khan_cap and v_vai_tro = 'Quản lý') then
      raise exception 'Chưa có báo giá được khách xác nhận — không thể chuyển "Đang thi công" (nguyên tắc 2), trừ khi Quản lý xác nhận xử lý an toàn khẩn cấp.';
    end if;
  end if;

  -- Nguyên tắc 8: đóng đơn cần đủ báo giá xác nhận + nghiệm thu xác
  -- nhận + công nợ = 0.
  if p_trang_thai_moi = 'Đã đóng' then
    select exists (select 1 from bao_gia where ma_don = p_ma_don and khach_xac_nhan = true)
      into v_co_bao_gia_xac_nhan;
    select exists (select 1 from nghiem_thu where ma_don = p_ma_don and khach_xac_nhan = true)
      into v_co_nghiem_thu_xac_nhan;
    select cong_no into v_cong_no from v_don_hang where ma_don = p_ma_don;

    if not v_co_bao_gia_xac_nhan then
      raise exception 'Chưa có báo giá được khách xác nhận — không thể đóng đơn (nguyên tắc 8).';
    end if;
    if not v_co_nghiem_thu_xac_nhan then
      raise exception 'Chưa có nghiệm thu được khách xác nhận — không thể đóng đơn (nguyên tắc 8).';
    end if;
    if coalesce(v_cong_no, 0) <> 0 then
      raise exception 'Công nợ còn %, chưa thu đủ tiền — không thể đóng đơn (nguyên tắc 8).', v_cong_no;
    end if;
  end if;

  update don_hang
    set trang_thai = p_trang_thai_moi,
        ly_do_tu_choi_huy = case when p_trang_thai_moi = 'Đã hủy' then p_ly_do_huy else ly_do_tu_choi_huy end,
        ngay_dong_don = case when p_trang_thai_moi = 'Đã đóng' then current_date else ngay_dong_don end
    where ma_don = p_ma_don
    returning * into v_don;

  return v_don;
end; $$;

comment on function f_chuyen_trang_thai_don is 'Cổng chuyển trạng thái Đơn hàng duy nhất — enforce nguyên tắc 2 và 8 (Mục 5). Nghiệm thu chỉ được phép ghi Thu tiền khi nghiem_thu.khach_xac_nhan = true, xem check ở f_bi_thu_tien_kiem_tra bên dưới.';

-- Nghiệm thu: bắt buộc khách xác nhận trước khi được phép Thu tiền
-- (Mục 6.6 "Cờ xác nhận của khách - bắt buộc trước khi được phép thu tiền").
create function f_bi_thu_tien_kiem_tra() returns trigger language plpgsql as $$
declare
  v_co_nghiem_thu_xac_nhan boolean;
begin
  select exists (select 1 from nghiem_thu where ma_don = new.ma_don and khach_xac_nhan = true)
    into v_co_nghiem_thu_xac_nhan;
  if not v_co_nghiem_thu_xac_nhan then
    raise exception 'Đơn % chưa có nghiệm thu được khách xác nhận — chưa được phép thu tiền (Mục 6.6).', new.ma_don;
  end if;
  return new;
end; $$;

create trigger trg_thu_tien_kiem_tra before insert on thu_tien
  for each row execute function f_bi_thu_tien_kiem_tra();

-- Chặn UPDATE trực tiếp vào trang_thai/ly_do_tu_choi_huy/ngay_dong_don
-- của don_hang từ bất kỳ ai — bắt buộc phải qua f_chuyen_trang_thai_don
-- (đảm bảo state machine + nguyên tắc 2/8 luôn được kiểm tra đầy đủ,
-- không có đường tắt nào khác kể cả từ vai trò Quản lý).
create function f_bi_don_hang_chan_doi_thang() returns trigger language plpgsql as $$
begin
  if (new.trang_thai is distinct from old.trang_thai
      or new.ly_do_tu_choi_huy is distinct from old.ly_do_tu_choi_huy
      or new.ngay_dong_don is distinct from old.ngay_dong_don)
     and coalesce(current_setting('app.bypass_state_guard', true), 'false') <> 'true'
  then
    raise exception 'Phải dùng hàm f_chuyen_trang_thai_don() để đổi trạng thái đơn hàng, không được UPDATE trực tiếp cột trang_thai.';
  end if;
  return new;
end; $$;

create trigger trg_don_hang_chan_doi_thang before update on don_hang
  for each row execute function f_bi_don_hang_chan_doi_thang();
-- =====================================================================
-- 0010: Audit trail chung (nguyên tắc 4 — mọi đơn phải có dấu vết,
-- không cho phép xóa lịch sử thao tác).
-- Hàm chạy SECURITY DEFINER nên vẫn ghi được audit_log dù client
-- (authenticated) không có quyền INSERT trực tiếp vào bảng này —
-- xem REVOKE ở 0012 để đảm bảo audit_log chỉ có thể ghi qua trigger.
-- =====================================================================

create function f_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_khoa_col text := TG_ARGV[0];
  v_khoa text;
begin
  if TG_OP = 'DELETE' then
    v_khoa := (to_jsonb(old) ->> v_khoa_col);
  else
    v_khoa := (to_jsonb(new) ->> v_khoa_col);
  end if;

  insert into audit_log (bang, khoa_chinh, hanh_dong, du_lieu_truoc, du_lieu_sau, thuc_hien_boi)
  values (
    TG_TABLE_NAME,
    v_khoa,
    TG_OP,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    f_ma_nv_hien_tai()
  );

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end; $$;

create trigger trg_audit_nhan_vien after insert or update or delete on nhan_vien
  for each row execute function f_audit('ma_nv');
create trigger trg_audit_khach_hang after insert or update or delete on khach_hang
  for each row execute function f_audit('ma_kh');
create trigger trg_audit_don_hang after insert or update or delete on don_hang
  for each row execute function f_audit('ma_don');
create trigger trg_audit_chi_tiet_don after insert or update or delete on chi_tiet_don
  for each row execute function f_audit('ma_dong');
create trigger trg_audit_bao_gia after insert or update or delete on bao_gia
  for each row execute function f_audit('ma_bg');
create trigger trg_audit_phat_sinh after insert or update or delete on phat_sinh
  for each row execute function f_audit('ma_ps');
create trigger trg_audit_dieu_phoi after insert or update or delete on dieu_phoi
  for each row execute function f_audit('ma_dp');
create trigger trg_audit_nghiem_thu after insert or update or delete on nghiem_thu
  for each row execute function f_audit('ma_nt');
create trigger trg_audit_thu_tien after insert or update or delete on thu_tien
  for each row execute function f_audit('ma_thu');
create trigger trg_audit_vat_tu after insert or update or delete on vat_tu
  for each row execute function f_audit('ma_vt');
create trigger trg_audit_xuat_nhap_kho after insert or update or delete on xuat_nhap_kho
  for each row execute function f_audit('ma_xn');
create trigger trg_audit_bao_hanh after insert or update or delete on bao_hanh
  for each row execute function f_audit('ma_bh');
create trigger trg_audit_kpi_nhan_vien after insert or update or delete on kpi_nhan_vien
  for each row execute function f_audit('ma_kpi');
create trigger trg_audit_khieu_nai after insert or update or delete on khieu_nai
  for each row execute function f_audit('ma_kn');
create trigger trg_audit_bang_gia_dich_vu after insert or update or delete on bang_gia_dich_vu
  for each row execute function f_audit('ma_dv');
-- =====================================================================
-- 0011: Hàm hỗ trợ Row-Level Security
-- f_ma_nv_hien_tai() / f_vai_tro_hien_tai() đã có ở 0007.
-- =====================================================================

-- Thợ có đang được điều phối/phụ trách đơn p_ma_don hay không — đây
-- là ràng buộc bắt buộc ở tầng dữ liệu theo Mục 2 ("chống nhận khách
-- riêng", nguyên tắc 6 tại Mục 5).
create function f_la_tho_cua_don(p_ma_don text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from don_hang where ma_don = p_ma_don and tho_phu_trach = f_ma_nv_hien_tai()
  ) or exists (
    select 1 from dieu_phoi where ma_don = p_ma_don and tho = f_ma_nv_hien_tai()
  );
$$;

create function f_la_tho_cua_kh(p_ma_kh text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from don_hang d
    where d.ma_kh = p_ma_kh and f_la_tho_cua_don(d.ma_don)
  );
$$;
-- =====================================================================
-- 0012: Row-Level Security — ràng buộc phân quyền ở tầng dữ liệu
-- (Mục 2, Mục 10 "Bảo mật phân quyền ở tầng dữ liệu, không chỉ ẩn/hiện
-- trên giao diện"). Supabase ánh xạ MỌI vai trò vào cùng 1 Postgres
-- role "authenticated" — nên toàn bộ phân biệt Quản lý/CSKH-Điều
-- phối/Thợ/Kế toán/Kho phải nằm trong policy USING/WITH CHECK, gọi
-- f_vai_tro_hien_tai() / f_ma_nv_hien_tai() (SECURITY DEFINER, tra
-- cứu qua nhan_vien.auth_user_id = auth.uid()).
--
-- Nguyên tắc thiết kế: KHÔNG GRANT quyền SQL nào không cần dùng (VD
-- không GRANT DELETE cho bảng nghiệp vụ nào — không ai được xóa lịch
-- sử, đúng nguyên tắc 4). Không có policy cho thao tác nào ⇒ mặc định
-- từ chối hoàn toàn thao tác đó.
-- =====================================================================

grant usage on schema public to authenticated;

-- ---------------------------------------------------------------------
-- nhan_vien
-- ---------------------------------------------------------------------
alter table nhan_vien enable row level security;
grant select, insert, update on nhan_vien to authenticated;

create policy p_nv_select on nhan_vien for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối') or auth_user_id = auth.uid()
);
create policy p_nv_insert on nhan_vien for insert to authenticated with check (
  f_vai_tro_hien_tai() = 'Quản lý'
);
create policy p_nv_update on nhan_vien for update to authenticated using (
  f_vai_tro_hien_tai() = 'Quản lý'
) with check (
  f_vai_tro_hien_tai() = 'Quản lý'
);

-- ---------------------------------------------------------------------
-- khach_hang
-- ---------------------------------------------------------------------
alter table khach_hang enable row level security;
grant select, insert, update on khach_hang to authenticated;

create policy p_kh_select on khach_hang for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_kh(ma_kh))
);
create policy p_kh_insert on khach_hang for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')     -- nguyên tắc 6
);
create policy p_kh_update on khach_hang for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);

-- ---------------------------------------------------------------------
-- don_hang  (yêu cầu bắt buộc: Thợ chỉ thấy đơn được điều phối cho mình)
-- ---------------------------------------------------------------------
alter table don_hang enable row level security;
grant select, insert, update on don_hang to authenticated;

create policy p_don_select on don_hang for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kho')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_don_insert on don_hang for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')     -- nguyên tắc 6 — Thợ không có quyền tạo đơn
);
create policy p_don_update on don_hang for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
-- Lưu ý: đổi trang_thai qua UPDATE trực tiếp đã bị trigger
-- trg_don_hang_chan_doi_thang (0009) chặn tuyệt đối — mọi vai trò kể
-- cả Quản lý đều phải gọi RPC f_chuyen_trang_thai_don().

-- ---------------------------------------------------------------------
-- chi_tiet_don
-- ---------------------------------------------------------------------
alter table chi_tiet_don enable row level security;
grant select, insert, update on chi_tiet_don to authenticated;

create policy p_ctd_select on chi_tiet_don for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kho')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_ctd_write on chi_tiet_don for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);
create policy p_ctd_update on chi_tiet_don for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);

-- ---------------------------------------------------------------------
-- bao_gia
-- ---------------------------------------------------------------------
alter table bao_gia enable row level security;
grant select, insert, update on bao_gia to authenticated;

create policy p_bg_select on bao_gia for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_bg_insert on bao_gia for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_bg_update on bao_gia for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);

-- ---------------------------------------------------------------------
-- phat_sinh
-- ---------------------------------------------------------------------
alter table phat_sinh enable row level security;
grant select, insert, update on phat_sinh to authenticated;

create policy p_ps_select on phat_sinh for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_ps_insert on phat_sinh for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_ps_update on phat_sinh for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);

-- ---------------------------------------------------------------------
-- dieu_phoi
-- ---------------------------------------------------------------------
alter table dieu_phoi enable row level security;
grant select, insert, update on dieu_phoi to authenticated;

create policy p_dp_select on dieu_phoi for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and tho = f_ma_nv_hien_tai())
);
create policy p_dp_insert on dieu_phoi for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);
create policy p_dp_update on dieu_phoi for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and tho = f_ma_nv_hien_tai())
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and tho = f_ma_nv_hien_tai())
);

-- ---------------------------------------------------------------------
-- nghiem_thu
-- ---------------------------------------------------------------------
alter table nghiem_thu enable row level security;
grant select, insert, update on nghiem_thu to authenticated;

create policy p_nt_select on nghiem_thu for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_nt_insert on nghiem_thu for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_nt_update on nghiem_thu for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);

-- ---------------------------------------------------------------------
-- thu_tien
-- ---------------------------------------------------------------------
alter table thu_tien enable row level security;
grant select, insert, update on thu_tien to authenticated;

create policy p_thu_select on thu_tien for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_thu_insert on thu_tien for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kế toán')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))    -- thu tiền tại chỗ
);
create policy p_thu_update on thu_tien for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kế toán')                    -- đối soát / đánh dấu đã nộp
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kế toán')
);

-- ---------------------------------------------------------------------
-- vat_tu
-- ---------------------------------------------------------------------
alter table vat_tu enable row level security;
grant select, insert, update on vat_tu to authenticated;

create policy p_vt_select on vat_tu for select to authenticated using (true);
create policy p_vt_insert on vat_tu for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho')
);
create policy p_vt_update on vat_tu for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho')
);

-- ---------------------------------------------------------------------
-- xuat_nhap_kho
-- ---------------------------------------------------------------------
alter table xuat_nhap_kho enable row level security;
grant select, insert, update on xuat_nhap_kho to authenticated;

create policy p_xn_select on xuat_nhap_kho for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho')
  or (f_vai_tro_hien_tai() = 'Thợ' and (nguoi_thuc_hien = f_ma_nv_hien_tai() or (ma_don is not null and f_la_tho_cua_don(ma_don))))
);
create policy p_xn_insert on xuat_nhap_kho for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho')
  or (f_vai_tro_hien_tai() = 'Thợ' and loai = 'Xuất' and ma_don is not null and f_la_tho_cua_don(ma_don))
);
create policy p_xn_update on xuat_nhap_kho for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho')
);

-- ---------------------------------------------------------------------
-- bao_hanh
-- ---------------------------------------------------------------------
alter table bao_hanh enable row level security;
grant select, insert, update on bao_hanh to authenticated;

create policy p_bh_select on bao_hanh for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don_cu))
);
create policy p_bh_insert on bao_hanh for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);
create policy p_bh_update on bao_hanh for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);

-- ---------------------------------------------------------------------
-- kpi_nhan_vien
-- ---------------------------------------------------------------------
alter table kpi_nhan_vien enable row level security;
grant select, insert, update on kpi_nhan_vien to authenticated;

create policy p_kpi_select on kpi_nhan_vien for select to authenticated using (
  f_vai_tro_hien_tai() = 'Quản lý' or ma_nv = f_ma_nv_hien_tai()
);
create policy p_kpi_insert on kpi_nhan_vien for insert to authenticated with check (
  f_vai_tro_hien_tai() = 'Quản lý'
);
create policy p_kpi_update on kpi_nhan_vien for update to authenticated using (
  f_vai_tro_hien_tai() = 'Quản lý'
) with check (
  f_vai_tro_hien_tai() = 'Quản lý'
);

-- ---------------------------------------------------------------------
-- khieu_nai
-- ---------------------------------------------------------------------
alter table khieu_nai enable row level security;
grant select, insert, update on khieu_nai to authenticated;

create policy p_kn_select on khieu_nai for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or nguoi_xu_ly = f_ma_nv_hien_tai()
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_kn_insert on khieu_nai for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);
create policy p_kn_update on khieu_nai for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối') or nguoi_xu_ly = f_ma_nv_hien_tai()
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối') or nguoi_xu_ly = f_ma_nv_hien_tai()
);

-- ---------------------------------------------------------------------
-- bang_gia_dich_vu, danh_muc — danh mục tham chiếu, đọc chung
-- ---------------------------------------------------------------------
alter table bang_gia_dich_vu enable row level security;
grant select, insert, update on bang_gia_dich_vu to authenticated;
create policy p_dv_select on bang_gia_dich_vu for select to authenticated using (true);
create policy p_dv_write on bang_gia_dich_vu for insert to authenticated with check (f_vai_tro_hien_tai() = 'Quản lý');
create policy p_dv_update on bang_gia_dich_vu for update to authenticated using (f_vai_tro_hien_tai() = 'Quản lý') with check (f_vai_tro_hien_tai() = 'Quản lý');

alter table danh_muc enable row level security;
grant select, insert, update on danh_muc to authenticated;
create policy p_dm_select on danh_muc for select to authenticated using (true);
create policy p_dm_write on danh_muc for insert to authenticated with check (f_vai_tro_hien_tai() = 'Quản lý');
create policy p_dm_update on danh_muc for update to authenticated using (f_vai_tro_hien_tai() = 'Quản lý') with check (f_vai_tro_hien_tai() = 'Quản lý');

-- Cấu hình hệ thống: đọc chung (trigger kiểm tra hạn mức giảm giá cần
-- đọc được dù người gọi là CSKH-Điều phối/Thợ), chỉ Quản lý được sửa.
alter table cau_hinh_he_thong enable row level security;
grant select, update on cau_hinh_he_thong to authenticated;
create policy p_ch_select on cau_hinh_he_thong for select to authenticated using (true);
create policy p_ch_update on cau_hinh_he_thong for update to authenticated using (f_vai_tro_hien_tai() = 'Quản lý') with check (f_vai_tro_hien_tai() = 'Quản lý');

-- ---------------------------------------------------------------------
-- thong_bao / push_subscriptions — dữ liệu riêng của từng nhân viên
-- ---------------------------------------------------------------------
alter table thong_bao enable row level security;
grant select, update on thong_bao to authenticated;   -- INSERT chỉ qua service_role (server tự động hóa, Mục 7)
create policy p_tb_select on thong_bao for select to authenticated using (
  nguoi_nhan = f_ma_nv_hien_tai() or f_vai_tro_hien_tai() = 'Quản lý'
);
create policy p_tb_update on thong_bao for update to authenticated using (
  nguoi_nhan = f_ma_nv_hien_tai()
) with check (
  nguoi_nhan = f_ma_nv_hien_tai()
);

alter table push_subscriptions enable row level security;
grant select, insert, update, delete on push_subscriptions to authenticated;
create policy p_push_all on push_subscriptions for all to authenticated using (
  ma_nv = f_ma_nv_hien_tai()
) with check (
  ma_nv = f_ma_nv_hien_tai()
);

-- ---------------------------------------------------------------------
-- audit_log — chỉ đọc (Quản lý), không cấp write cho bất kỳ ai; ghi
-- log chỉ diễn ra qua trigger f_audit() chạy SECURITY DEFINER.
-- ---------------------------------------------------------------------
alter table audit_log enable row level security;
grant select on audit_log to authenticated;
create policy p_audit_select on audit_log for select to authenticated using (
  f_vai_tro_hien_tai() = 'Quản lý'
);

-- bo_dem_ma: không cấp quyền trực tiếp cho client — chỉ được đụng tới
-- qua hàm f_sinh_so() (SECURITY DEFINER).
alter table bo_dem_ma enable row level security;
revoke all on bo_dem_ma from authenticated, anon;

grant execute on function f_chuyen_trang_thai_don(text, trang_thai_don_enum, text, boolean) to authenticated;
-- =====================================================================
-- 0013: Supabase Storage — bucket lưu ảnh (hiện trạng, phát sinh,
-- nghiệm thu) theo Mục 10 "Lưu trữ và hiển thị ảnh... có nén ảnh hợp
-- lý". Việc nén ảnh trước khi upload thực hiện ở client (xem
-- src/lib/upload-anh.ts) để tiết kiệm băng thông trên mạng yếu.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('anh-don-hang', 'anh-don-hang', true)
on conflict (id) do nothing;

-- Đọc công khai (ảnh không phải dữ liệu nhạy cảm, cần load nhanh trên
-- di động qua CDN) — chỉ nhân viên đăng nhập mới có URL vì đường dẫn
-- nằm trong dữ liệu đơn hàng vốn đã được RLS bảo vệ.
create policy p_storage_anh_don_hang_select on storage.objects for select to public using (
  bucket_id = 'anh-don-hang'
);

create policy p_storage_anh_don_hang_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'anh-don-hang'
);

create policy p_storage_anh_don_hang_delete on storage.objects for delete to authenticated using (
  bucket_id = 'anh-don-hang' and owner = auth.uid()
);
-- =====================================================================
-- 0014: VÁ LỖI BẢO MẬT NGHIÊM TRỌNG — các VIEW tạo ở 0008 mặc định
-- chạy với quyền của NGƯỜI TẠO VIEW (thường là superuser postgres khi
-- chạy qua SQL Editor), khiến RLS của bảng gốc bị BỎ QUA hoàn toàn
-- khi truy vấn qua view — vi phạm trực tiếp yêu cầu bắt buộc "Thợ chỉ
-- được thấy đơn được điều phối cho mình" (Mục 2) vì mọi trang đọc dữ
-- liệu qua v_don_hang/v_chi_tiet_don/v_vat_tu/v_kpi_nhan_vien đều lộ
-- toàn bộ dữ liệu cho mọi vai trò.
--
-- Khắc phục: bật security_invoker (Postgres 15+) để view thực thi
-- với quyền của NGƯỜI ĐANG TRUY VẤN — RLS của bảng gốc áp dụng đúng
-- như khi query trực tiếp vào bảng.
-- =====================================================================

alter view v_chi_tiet_don set (security_invoker = true);
alter view v_don_hang set (security_invoker = true);
alter view v_vat_tu set (security_invoker = true);
alter view v_kpi_nhan_vien set (security_invoker = true);
alter view v_tong_hop_dashboard set (security_invoker = true);

-- =====================================================================
-- 0015: Số điện thoại nhân viên phải duy nhất — dùng để đăng nhập
-- thay cho email (Postgres UNIQUE cho phép nhiều dòng NULL, không cần
-- backfill dữ liệu cũ).
-- =====================================================================

alter table nhan_vien add constraint nhan_vien_sdt_unique unique (sdt);

-- =====================================================================
-- 0016: Kỹ năng nhân viên đổi sang danh sách riêng (Tổng hợp/Điện
-- nước/Hàn/Xây/Sơn/Học việc) và cho chọn nhiều — tách khỏi
-- dich_vu_enum (cột này dùng chung với don_hang.dich_vu, không thể
-- đổi giá trị enum đó mà không ảnh hưởng ý nghĩa của đơn hàng).
-- Chuyển sang text[] thay vì tạo enum mới để dễ sửa danh sách sau này
-- mà không cần thêm migration (ràng buộc giá trị hợp lệ ở tầng ứng
-- dụng qua Zod, giống các mảng khác trong schema như anh_hien_trang).
-- =====================================================================

alter table nhan_vien
  alter column ky_nang type text[]
  using case when ky_nang is null then '{}'::text[] else array[ky_nang::text] end,
  alter column ky_nang set default '{}'::text[],
  alter column ky_nang set not null;

-- =====================================================================
-- 0017: Yêu cầu dịch vụ công khai (quét mã QR, không cần đăng nhập) —
-- khách điền form -> ghi vào bảng này qua Server Action dùng service
-- role (không cấp INSERT cho anon, đúng nguyên tắc "không grant quyền
-- không cần dùng" ở đầu 0012) -> CSKH nhận thông báo + xử lý qua màn
-- hình quản trị nội bộ.
-- =====================================================================

alter type loai_thong_bao_enum add value 'Yêu cầu dịch vụ mới';

create type trang_thai_yeu_cau_enum as enum ('Mới', 'Đã liên hệ', 'Đã tạo đơn', 'Đã hủy');

create table yeu_cau_dich_vu (
  ma_yc text primary key,
  ho_ten text not null,
  dia_chi text not null,
  sdt text not null,
  dich_vu dich_vu_enum not null,
  yeu_cau text not null,
  trang_thai trang_thai_yeu_cau_enum not null default 'Mới',
  ma_don text references don_hang (ma_don),
  created_at timestamptz not null default now()
);

comment on table yeu_cau_dich_vu is 'Yêu cầu dịch vụ gửi từ trang công khai /yeu-cau (khách quét QR, không cần tài khoản).';
create index idx_yeu_cau_dich_vu_trang_thai on yeu_cau_dich_vu (trang_thai);

create function f_bi_yeu_cau_dich_vu() returns trigger language plpgsql as $$
begin
  if new.ma_yc is null then new.ma_yc := f_ma_generic_moi('YC'); end if;
  return new;
end; $$;
create trigger trg_bi_yeu_cau_dich_vu before insert on yeu_cau_dich_vu
  for each row execute function f_bi_yeu_cau_dich_vu();

alter table thong_bao add column ma_yc text references yeu_cau_dich_vu (ma_yc);

-- Chỉ select/update cho authenticated (CSKH/Quản lý xử lý) — KHÔNG
-- grant insert cho ai, kể cả authenticated: việc tạo luôn đi qua
-- Server Action bằng service role (khách chưa đăng nhập lúc gửi).
alter table yeu_cau_dich_vu enable row level security;
grant select, update on yeu_cau_dich_vu to authenticated;

create policy p_ycdv_select on yeu_cau_dich_vu for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);
create policy p_ycdv_update on yeu_cau_dich_vu for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);
