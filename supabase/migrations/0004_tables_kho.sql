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
