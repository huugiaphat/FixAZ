-- =====================================================================
-- 0019: Sổ thu chi chi tiết — ghi nhận MỌI khoản thu/chi của công ty,
-- khác với `thu_tien` (chỉ ghi tiền thu từ khách cho 1 đơn cụ thể, khóa
-- bởi rule "phải nghiệm thu xong mới thu tiền"). Sổ thu chi độc lập với
-- don_hang — "tên công trình" là FK tùy chọn (chọn đơn có sẵn) CỘNG
-- thêm 1 cột text tự do, vì lương/chi phí quản lý không gắn với đơn nào
-- (giống hệt cách `xuat_nhap_kho.ma_don` ở 0004 đã làm: "chỉ điền khi
-- xuất cho 1 đơn cụ thể").
-- =====================================================================

create type loai_thu_chi_enum as enum ('Thu', 'Chi');
create type noi_dung_thu_enum as enum ('Tạm ứng', 'Thanh toán', 'Thu khác', 'Sửa nhanh');
create type noi_dung_chi_enum as enum ('Vật tư', 'Công cụ', 'Lương', 'Ứng lương', 'Ăn uống', 'Ca máy', 'Xe chở', 'Chi phí quản lý', 'Chi khác');

create table thu_chi (
  ma_tc text primary key,
  loai loai_thu_chi_enum not null,
  ma_don text references don_hang (ma_don),         -- tên công trình = chọn đơn có sẵn (tùy chọn)
  ten_cong_trinh text,                              -- hoặc/thêm tên công trình tự nhập (tùy chọn)
  noi_dung_thu noi_dung_thu_enum,
  noi_dung_chi noi_dung_chi_enum,
  so_tien numeric not null check (so_tien > 0),
  phuong_thuc phuong_thuc_thu_enum not null,        -- tái dùng enum có sẵn (Tiền mặt/Chuyển khoản/QR-Ví điện tử)
  ghi_chu text,
  ngay timestamptz not null default now(),
  nguoi_tao text not null references nhan_vien (ma_nv),
  created_at timestamptz not null default now(),
  constraint chk_thu_chi_noi_dung check (
    (loai = 'Thu' and noi_dung_thu is not null and noi_dung_chi is null) or
    (loai = 'Chi' and noi_dung_chi is not null and noi_dung_thu is null)
  )
);

comment on table thu_chi is 'Sổ thu chi chi tiết công ty — thu/chi không nhất thiết gắn với đơn hàng cụ thể.';
create index idx_thu_chi_ngay on thu_chi (ngay);
create index idx_thu_chi_loai on thu_chi (loai);
create index idx_thu_chi_ma_don on thu_chi (ma_don) where ma_don is not null;

-- ---- Mã tự sinh + người tạo tự điền, giống hệt f_bi_thu_tien ở 0007 ----
create function f_bi_thu_chi() returns trigger language plpgsql as $$
begin
  if new.ma_tc is null then new.ma_tc := f_ma_generic_moi('TC'); end if;
  if new.nguoi_tao is null then new.nguoi_tao := f_ma_nv_hien_tai(); end if;
  return new;
end; $$;
create trigger trg_bi_thu_chi before insert on thu_chi
  for each row execute function f_bi_thu_chi();

-- ---- RLS — chỉ Quản lý/Kế toán, không grant delete (nguyên tắc 0012) ----
alter table thu_chi enable row level security;
grant select, insert, update on thu_chi to authenticated;

create policy p_thu_chi_select on thu_chi for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kế toán')
);
create policy p_thu_chi_insert on thu_chi for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kế toán')
);
create policy p_thu_chi_update on thu_chi for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kế toán')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kế toán')
);

-- ---- Báo cáo tổng theo ngày/tháng/năm cho Dashboard ----
create view v_thu_chi_tong_hop as
with hom_nay as (select current_date as ngay),
thang_nay as (select date_trunc('month', now()) as dau_thang),
nam_nay as (select date_trunc('year', now()) as dau_nam)
select
  1 as id,
  (select coalesce(sum(so_tien), 0) from thu_chi, hom_nay where loai = 'Thu' and thu_chi.ngay::date = hom_nay.ngay) as thu_hom_nay,
  (select coalesce(sum(so_tien), 0) from thu_chi, hom_nay where loai = 'Chi' and thu_chi.ngay::date = hom_nay.ngay) as chi_hom_nay,
  (select coalesce(sum(so_tien), 0) from thu_chi, thang_nay where loai = 'Thu' and ngay >= thang_nay.dau_thang) as thu_thang_nay,
  (select coalesce(sum(so_tien), 0) from thu_chi, thang_nay where loai = 'Chi' and ngay >= thang_nay.dau_thang) as chi_thang_nay,
  (select coalesce(sum(so_tien), 0) from thu_chi, nam_nay where loai = 'Thu' and ngay >= nam_nay.dau_nam) as thu_nam_nay,
  (select coalesce(sum(so_tien), 0) from thu_chi, nam_nay where loai = 'Chi' and ngay >= nam_nay.dau_nam) as chi_nam_nay;

comment on view v_thu_chi_tong_hop is 'Tổng thu/chi hôm nay, tháng này, năm nay — phục vụ section "Thu chi" trên Dashboard.';
alter view v_thu_chi_tong_hop set (security_invoker = true);
grant select on v_thu_chi_tong_hop to authenticated;
