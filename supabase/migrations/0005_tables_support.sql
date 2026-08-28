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
