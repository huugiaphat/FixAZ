-- =====================================================================
-- 0026: Module "Mẫu báo giá" — báo giá SƠ BỘ gửi khách hàng tham khảo
-- TRƯỚC KHI có đơn hàng (khác với `bao_gia`, vốn bắt buộc `ma_don not
-- null` và gắn với quy trình duyệt/xác nhận trong vòng đời 1 đơn đã
-- tồn tại — xem 0003). Khách hàng ở đây có thể chưa từng là 1 dòng
-- trong `khach_hang` (mới hỏi giá, chưa chắc đặt), nên lưu tên/SĐT/địa
-- chỉ dạng tự do thay vì FK bắt buộc. Khi khách đồng ý và đơn hàng
-- được tạo (qua luồng tạo đơn bình thường), người dùng bấm "Liên kết
-- đơn hàng" để gán `ma_don` — chỉ là 1 UPDATE thường, không có business
-- rule nào khác ràng buộc.
-- =====================================================================

create table mau_bao_gia (
  ma_mbg text primary key,                           -- MBG-000001...
  ten_khach_hang text not null,
  sdt text,
  dia_chi text,
  dich_vu dich_vu_enum,
  ghi_chu text,
  ma_don text references don_hang (ma_don),          -- gán khi khách đồng ý — xem "Liên kết đơn hàng"
  nguoi_tao text not null references nhan_vien (ma_nv),
  created_at timestamptz not null default now()
);

comment on table mau_bao_gia is 'Báo giá sơ bộ gửi khách tham khảo trước khi có đơn hàng — liên kết mềm (ma_don, tùy chọn) khi khách đồng ý.';
create index idx_mau_bao_gia_ma_don on mau_bao_gia (ma_don) where ma_don is not null;

create table mau_bao_gia_dong (
  ma_dong text primary key,                          -- MBGD-000001...
  ma_mbg text not null references mau_bao_gia (ma_mbg) on delete cascade,
  ten_hang_muc text not null,
  don_vi_tinh text,
  so_luong numeric not null check (so_luong > 0),
  don_gia numeric not null check (don_gia >= 0),
  created_at timestamptz not null default now()
  -- ThanhTien = SoLuong * DonGia -> xem view v_mau_bao_gia_dong (giống chi_tiet_don)
);

comment on table mau_bao_gia_dong is 'Dòng hạng mục của 1 mẫu báo giá.';
create index idx_mau_bao_gia_dong_ma_mbg on mau_bao_gia_dong (ma_mbg);

-- ---- Mã tự sinh + người tạo tự điền ----
create function f_bi_mau_bao_gia() returns trigger language plpgsql as $$
begin
  if new.ma_mbg is null then new.ma_mbg := f_ma_generic_moi('MBG'); end if;
  if new.nguoi_tao is null then new.nguoi_tao := f_ma_nv_hien_tai(); end if;
  return new;
end; $$;
create trigger trg_bi_mau_bao_gia before insert on mau_bao_gia
  for each row execute function f_bi_mau_bao_gia();

create function f_bi_mau_bao_gia_dong() returns trigger language plpgsql as $$
begin
  if new.ma_dong is null then new.ma_dong := f_ma_generic_moi('MBGD'); end if;
  return new;
end; $$;
create trigger trg_bi_mau_bao_gia_dong before insert on mau_bao_gia_dong
  for each row execute function f_bi_mau_bao_gia_dong();

-- ---- RLS — Quản lý/CSKH-Điều phối/Kế toán đọc+ghi, Kiểm soát chỉ đọc ----
alter table mau_bao_gia enable row level security;
grant select, insert, update on mau_bao_gia to authenticated;

create policy p_mbg_select on mau_bao_gia for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kiểm soát')
);
create policy p_mbg_insert on mau_bao_gia for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
);
create policy p_mbg_update on mau_bao_gia for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
);

alter table mau_bao_gia_dong enable row level security;
grant select, insert, update, delete on mau_bao_gia_dong to authenticated;

create policy p_mbgd_select on mau_bao_gia_dong for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kiểm soát')
);
create policy p_mbgd_insert on mau_bao_gia_dong for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
);
create policy p_mbgd_update on mau_bao_gia_dong for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
);
create policy p_mbgd_delete on mau_bao_gia_dong for delete to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
);

-- ---- View tính ThanhTien / TongTien (giống cách chi_tiet_don/don_hang làm) ----
create view v_mau_bao_gia_dong as
select md.*, (md.so_luong * md.don_gia) as thanh_tien
from mau_bao_gia_dong md;

comment on view v_mau_bao_gia_dong is 'Dòng hạng mục mẫu báo giá kèm ThanhTien tính động.';
alter view v_mau_bao_gia_dong set (security_invoker = true);
grant select on v_mau_bao_gia_dong to authenticated;

create view v_mau_bao_gia as
select m.*, coalesce(d.tong_tien, 0) as tong_tien
from mau_bao_gia m
left join (
  select ma_mbg, sum(so_luong * don_gia) as tong_tien
  from mau_bao_gia_dong group by ma_mbg
) d on d.ma_mbg = m.ma_mbg;

comment on view v_mau_bao_gia is 'Mẫu báo giá kèm TongTien tính động từ các dòng hạng mục.';
alter view v_mau_bao_gia set (security_invoker = true);
grant select on v_mau_bao_gia to authenticated;

-- ---- Audit log (giống các bảng nghiệp vụ khác — xem 0010) ----
create trigger trg_audit_mau_bao_gia after insert or update or delete on mau_bao_gia
  for each row execute function f_audit('ma_mbg');
create trigger trg_audit_mau_bao_gia_dong after insert or update or delete on mau_bao_gia_dong
  for each row execute function f_audit('ma_dong');
