-- Chạy riêng sau 0037. 0038_thu_chi_nhieu_dong.sql trước đây chưa triển khai.
-- Đề xuất thanh toán chỉ dành cho CHI; THU tiếp tục theo luồng hiện có.
begin;

create table de_xuat_thanh_toan (
  ma_dx text primary key default f_ma_generic_moi('DXTT'),
  ma_don text references don_hang (ma_don),
  ten_cong_trinh text,
  noi_dung_chi noi_dung_chi_enum not null,
  phuong_thuc phuong_thuc_thu_enum not null check (phuong_thuc in ('Tiền mặt', 'Chuyển khoản')),
  ghi_chu text,
  tong_tien numeric not null check (tong_tien > 0),
  trang_thai text not null default 'Chờ duyệt'
    check (trang_thai in ('Chờ duyệt', 'Đã duyệt', 'Từ chối', 'Đã rút')),
  nguoi_de_xuat text not null references nhan_vien (ma_nv),
  nguoi_duyet text references nhan_vien (ma_nv),
  duyet_luc timestamptz,
  ma_tc text unique references thu_chi (ma_tc) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_dx_duyet check (
    (trang_thai = 'Đã duyệt' and ma_tc is not null and nguoi_duyet is not null and duyet_luc is not null)
    or (trang_thai <> 'Đã duyệt' and ma_tc is null and nguoi_duyet is null and duyet_luc is null)
  )
);

create table de_xuat_thanh_toan_dong (
  id bigint generated always as identity primary key,
  ma_dx text not null references de_xuat_thanh_toan (ma_dx) on delete restrict,
  thu_tu integer not null check (thu_tu between 1 and 50),
  ten_hh_dv text not null check (length(btrim(ten_hh_dv)) > 0),
  don_gia numeric not null check (don_gia > 0),
  so_luong numeric not null check (so_luong > 0),
  thanh_tien numeric generated always as (round(don_gia * so_luong, 0)) stored,
  unique (ma_dx, thu_tu)
);

create index idx_dx_nguoi_ngay on de_xuat_thanh_toan (nguoi_de_xuat, created_at desc);
create index idx_dx_trang_thai_ngay on de_xuat_thanh_toan (trang_thai, created_at desc);

alter table de_xuat_thanh_toan enable row level security;
alter table de_xuat_thanh_toan_dong enable row level security;
grant select on de_xuat_thanh_toan, de_xuat_thanh_toan_dong to authenticated;
create policy p_dx_select on de_xuat_thanh_toan for select to authenticated using (
  nguoi_de_xuat = f_ma_nv_hien_tai()
  or f_vai_tro_hien_tai() in ('Admin', 'Quản lý', 'Kế toán', 'Kiểm soát')
);
create policy p_dx_dong_select on de_xuat_thanh_toan_dong for select to authenticated using (
  exists (select 1 from de_xuat_thanh_toan dx where dx.ma_dx = de_xuat_thanh_toan_dong.ma_dx)
);

-- Kể từ đây phiếu CHI mới phải đi qua đề xuất; phiếu CHI cũ vẫn giữ nguyên.
create policy p_thu_chi_moi_chi_thu on thu_chi as restrictive
  for insert to authenticated with check (loai = 'Thu');

create trigger trg_audit_dx after insert or update or delete on de_xuat_thanh_toan
  for each row execute function f_audit('ma_dx');
create trigger trg_audit_dx_dong after insert or update or delete on de_xuat_thanh_toan_dong
  for each row execute function f_audit('id');

create function f_tong_dong_dx(p_dong jsonb) returns numeric
language plpgsql immutable set search_path = public, pg_temp as $$
declare
  v_item jsonb;
  v_tong numeric := 0;
  v_gia numeric;
  v_luong numeric;
begin
  if p_dong is null or jsonb_typeof(p_dong) <> 'array'
     or jsonb_array_length(p_dong) not between 1 and 50 then
    raise exception 'Phiếu cần từ 1 đến 50 dòng HH/DV.';
  end if;
  for v_item in select value from jsonb_array_elements(p_dong) loop
    if jsonb_typeof(v_item) <> 'object' or btrim(coalesce(v_item->>'ten_hh_dv', '')) = ''
       or jsonb_typeof(v_item->'don_gia') <> 'number'
       or jsonb_typeof(v_item->'so_luong') <> 'number' then
      raise exception 'Dòng HH/DV không hợp lệ.';
    end if;
    v_gia := (v_item->>'don_gia')::numeric;
    v_luong := (v_item->>'so_luong')::numeric;
    if v_gia <= 0 or v_luong <= 0 or round(v_gia * v_luong, 0) <= 0 then
      raise exception 'Đơn giá, số lượng và thành tiền phải lớn hơn 0.';
    end if;
    v_tong := v_tong + round(v_gia * v_luong, 0);
  end loop;
  return v_tong;
end; $$;
revoke all on function f_tong_dong_dx(jsonb) from public;

-- RPC chạy một transaction, kiểm tra tài khoản và trạng thái trên DB.
create function f_luu_de_xuat_thanh_toan(
  p_ma_don text, p_ten_cong_trinh text, p_noi_dung_chi noi_dung_chi_enum,
  p_phuong_thuc phuong_thuc_thu_enum, p_ghi_chu text, p_dong jsonb,
  p_ma_dx text default null
) returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_nv text := f_ma_nv_hien_tai();
  v_admin boolean := coalesce(f_vai_tro_hien_tai() = 'Admin', false);
  v_dx de_xuat_thanh_toan%rowtype;
  v_tong numeric;
  v_ma text;
  v_item jsonb;
  v_stt integer := 0;
begin
  if auth.uid() is null or v_nv is null then raise exception 'Cần đăng nhập để lập đề xuất.'; end if;
  if p_noi_dung_chi is null or p_phuong_thuc not in ('Tiền mặt', 'Chuyển khoản') then
    raise exception 'Thiếu danh mục chi hoặc phương thức.';
  end if;
  v_tong := f_tong_dong_dx(p_dong);
  if p_ma_dx is null then
    insert into de_xuat_thanh_toan
      (ma_don, ten_cong_trinh, noi_dung_chi, phuong_thuc, ghi_chu, tong_tien, nguoi_de_xuat)
    values (nullif(p_ma_don, ''), nullif(btrim(p_ten_cong_trinh), ''),
      p_noi_dung_chi, p_phuong_thuc, nullif(btrim(p_ghi_chu), ''), v_tong, v_nv)
    returning ma_dx into v_ma;
  else
    select * into v_dx from de_xuat_thanh_toan where ma_dx = p_ma_dx for update;
    if not found then raise exception 'Không tìm thấy đề xuất.'; end if;
    if not (v_admin or (v_dx.trang_thai = 'Chờ duyệt' and v_dx.nguoi_de_xuat = v_nv))
       or v_dx.trang_thai not in ('Chờ duyệt', 'Đã duyệt') then
      raise exception 'Không còn quyền sửa đề xuất này.';
    end if;
    if v_dx.trang_thai = 'Đã duyệt' and not v_admin then
      raise exception 'Chỉ Admin được sửa đề xuất đã duyệt.';
    end if;
    update de_xuat_thanh_toan set
      ma_don = nullif(p_ma_don, ''), ten_cong_trinh = nullif(btrim(p_ten_cong_trinh), ''),
      noi_dung_chi = p_noi_dung_chi, phuong_thuc = p_phuong_thuc,
      ghi_chu = nullif(btrim(p_ghi_chu), ''), tong_tien = v_tong, updated_at = now()
    where ma_dx = p_ma_dx;
    delete from de_xuat_thanh_toan_dong where ma_dx = p_ma_dx;
    v_ma := p_ma_dx;
  end if;

  for v_item in select value from jsonb_array_elements(p_dong) loop
    v_stt := v_stt + 1;
    insert into de_xuat_thanh_toan_dong (ma_dx, thu_tu, ten_hh_dv, don_gia, so_luong)
    values (v_ma, v_stt, btrim(v_item->>'ten_hh_dv'),
      (v_item->>'don_gia')::numeric, (v_item->>'so_luong')::numeric);
  end loop;

  if p_ma_dx is not null and v_dx.trang_thai = 'Đã duyệt' then
    update thu_chi set ma_don = nullif(p_ma_don, ''),
      ten_cong_trinh = nullif(btrim(p_ten_cong_trinh), ''),
      noi_dung_chi = p_noi_dung_chi, phuong_thuc = p_phuong_thuc,
      ghi_chu = nullif(btrim(p_ghi_chu), ''), so_tien = v_tong
    where ma_tc = v_dx.ma_tc;
    if not found then raise exception 'Khoản chi đã duyệt không còn tồn tại.'; end if;
  end if;
  return v_ma;
end; $$;
revoke all on function f_luu_de_xuat_thanh_toan(text, text, noi_dung_chi_enum, phuong_thuc_thu_enum, text, jsonb, text) from public;
grant execute on function f_luu_de_xuat_thanh_toan(text, text, noi_dung_chi_enum, phuong_thuc_thu_enum, text, jsonb, text) to authenticated;

create function f_duyet_de_xuat_thanh_toan(p_ma_dx text, p_duyet boolean)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_dx de_xuat_thanh_toan%rowtype;
  v_ma_tc text;
begin
  if auth.uid() is null or f_vai_tro_hien_tai() is distinct from 'Admin' then
    raise exception 'Chỉ Admin được duyệt đề xuất.';
  end if;
  select * into v_dx from de_xuat_thanh_toan where ma_dx = p_ma_dx for update;
  if not found or v_dx.trang_thai <> 'Chờ duyệt' then
    raise exception 'Đề xuất không còn ở trạng thái chờ duyệt.';
  end if;
  if p_duyet then
    insert into thu_chi
      (loai, ma_don, ten_cong_trinh, noi_dung_chi, so_tien, phuong_thuc,
       nguoi_tao, ghi_chu, ngay)
    values ('Chi', v_dx.ma_don, v_dx.ten_cong_trinh, v_dx.noi_dung_chi,
      v_dx.tong_tien, v_dx.phuong_thuc, v_dx.nguoi_de_xuat, v_dx.ghi_chu, now())
    returning ma_tc into v_ma_tc;
    update thu_chi set da_duyet = true where ma_tc = v_ma_tc;
    update de_xuat_thanh_toan set trang_thai = 'Đã duyệt',
      ma_tc = v_ma_tc, nguoi_duyet = f_ma_nv_hien_tai(),
      duyet_luc = now(), updated_at = now()
    where ma_dx = p_ma_dx;
  else
    update de_xuat_thanh_toan set trang_thai = 'Từ chối', updated_at = now()
    where ma_dx = p_ma_dx;
  end if;
  return v_ma_tc;
end; $$;
revoke all on function f_duyet_de_xuat_thanh_toan(text, boolean) from public;
grant execute on function f_duyet_de_xuat_thanh_toan(text, boolean) to authenticated;

create function f_rut_de_xuat_thanh_toan(p_ma_dx text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or f_ma_nv_hien_tai() is null then
    raise exception 'Cần đăng nhập.';
  end if;
  update de_xuat_thanh_toan set trang_thai = 'Đã rút', updated_at = now()
  where ma_dx = p_ma_dx and trang_thai = 'Chờ duyệt'
    and nguoi_de_xuat = f_ma_nv_hien_tai();
  if not found then raise exception 'Đề xuất không còn có thể rút.'; end if;
end; $$;
revoke all on function f_rut_de_xuat_thanh_toan(text) from public;
grant execute on function f_rut_de_xuat_thanh_toan(text) to authenticated;

-- Không thể sửa số tiền trên Sổ thu chi nếu khác tổng chi tiết đề xuất.
-- Admin sửa qua RPC ở trên để thay đổi cả hai trong một transaction.
create function f_kiem_tra_dx_khop_so() returns trigger language plpgsql
set search_path = public, pg_temp as $$
declare
  v_ma text;
  v_dx de_xuat_thanh_toan%rowtype;
  v_tong numeric;
  v_tc thu_chi%rowtype;
begin
  v_ma := case when tg_table_name = 'de_xuat_thanh_toan_dong'
    then case when tg_op = 'DELETE' then old.ma_dx else new.ma_dx end
    when tg_table_name = 'thu_chi' then (select ma_dx from de_xuat_thanh_toan where ma_tc = new.ma_tc)
    else new.ma_dx end;
  if v_ma is null then return null; end if;
  select * into v_dx from de_xuat_thanh_toan where ma_dx = v_ma;
  if not found then return null; end if;
  select coalesce(sum(thanh_tien), 0) into v_tong
    from de_xuat_thanh_toan_dong where ma_dx = v_ma;
  if v_tong <= 0 or v_tong <> v_dx.tong_tien then
    raise exception 'Tổng đề xuất phải khớp các dòng HH/DV.';
  end if;
  if v_dx.trang_thai = 'Đã duyệt' then
    select * into v_tc from thu_chi where ma_tc = v_dx.ma_tc;
    if not found or v_tc.loai <> 'Chi' or v_tc.so_tien <> v_tong
       or v_tc.ma_don is distinct from v_dx.ma_don
       or v_tc.ten_cong_trinh is distinct from v_dx.ten_cong_trinh
       or v_tc.noi_dung_chi is distinct from v_dx.noi_dung_chi
       or v_tc.phuong_thuc is distinct from v_dx.phuong_thuc
       or v_tc.ghi_chu is distinct from v_dx.ghi_chu
       or v_tc.nguoi_tao is distinct from v_dx.nguoi_de_xuat then
      raise exception 'Khoản chi đã duyệt phải khớp đề xuất.';
    end if;
  end if;
  return null;
end; $$;
create constraint trigger trg_dx_khop_so
  after insert or update on de_xuat_thanh_toan
  deferrable initially deferred for each row execute function f_kiem_tra_dx_khop_so();
create constraint trigger trg_dx_dong_khop_so
  after insert or update or delete on de_xuat_thanh_toan_dong
  deferrable initially deferred for each row execute function f_kiem_tra_dx_khop_so();
create constraint trigger trg_tc_dx_khop_so
  after update on thu_chi
  deferrable initially deferred for each row execute function f_kiem_tra_dx_khop_so();

-- Giữ mọi cột cũ theo thứ tự và chỉ thêm mã đề xuất ở cuối view.
create or replace view v_thu_chi_danh_sach with (security_invoker = true) as
select tc.*, coalesce(d.mo_ta_su_co, tc.ten_cong_trinh) as ten_cong_trinh_hien_thi,
  nv.ho_ten as ho_ten_nguoi_thu_chi, dx.ma_dx
from thu_chi tc
left join don_hang d on d.ma_don = tc.ma_don
left join nhan_vien nv on nv.ma_nv = tc.nguoi_tao
left join de_xuat_thanh_toan dx on dx.ma_tc = tc.ma_tc;

notify pgrst, 'reload schema';
commit;
