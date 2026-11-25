-- Một phiếu thu chi có nhiều dòng HH/DV. Tổng phiếu vẫn là một dòng thu_chi
-- để duyệt và hạch toán đúng một lần. Chạy riêng sau migration 0037.
begin;

create table thu_chi_dong (
  id bigint generated always as identity primary key,
  ma_tc text not null references thu_chi (ma_tc) on delete cascade,
  thu_tu integer not null check (thu_tu between 1 and 50),
  ten_hh_dv text not null check (length(btrim(ten_hh_dv)) > 0),
  don_gia numeric not null check (don_gia > 0),
  so_luong numeric not null check (so_luong > 0),
  thanh_tien numeric generated always as (round(don_gia * so_luong, 0)) stored,
  unique (ma_tc, thu_tu)
);

alter table thu_chi_dong enable row level security;
grant select on thu_chi_dong to authenticated;
create policy p_thu_chi_dong_select on thu_chi_dong for select to authenticated using (
  exists (select 1 from thu_chi tc where tc.ma_tc = thu_chi_dong.ma_tc)
);

create trigger trg_audit_thu_chi_dong after insert or update or delete on thu_chi_dong
  for each row execute function f_audit('id');

-- Kiểm tra ở cuối transaction: lúc sửa, tổng phiếu và các dòng được thay
-- lần lượt nhưng phải khớp trước khi lưu thành công.
create function f_kiem_tra_tong_thu_chi_dong() returns trigger language plpgsql as $$
declare
  v_ma_tc text;
  v_so_tien numeric;
  v_tong numeric;
  v_so_dong integer;
begin
  if tg_table_name = 'thu_chi_dong' then
    v_ma_tc := case when tg_op = 'DELETE' then old.ma_tc else new.ma_tc end;
  else
    v_ma_tc := new.ma_tc;
  end if;
  select so_tien into v_so_tien from thu_chi where ma_tc = v_ma_tc;
  if not found then return null; end if;
  select coalesce(sum(thanh_tien), 0), count(*) into v_tong, v_so_dong
  from thu_chi_dong where ma_tc = v_ma_tc;
  if v_so_dong > 0 and v_so_tien <> v_tong then
    raise exception 'Tổng phiếu % không khớp tổng các dòng HH/DV.', v_ma_tc;
  end if;
  if tg_table_name = 'thu_chi_dong' and v_so_dong = 0 then
    raise exception 'Phiếu % phải có ít nhất một dòng HH/DV.', v_ma_tc;
  end if;
  return null;
end; $$;

create constraint trigger trg_kiem_tra_tong_thu_chi_dong
  after insert or update or delete on thu_chi_dong
  deferrable initially deferred for each row execute function f_kiem_tra_tong_thu_chi_dong();
create constraint trigger trg_kiem_tra_tong_thu_chi
  after update on thu_chi
  deferrable initially deferred for each row execute function f_kiem_tra_tong_thu_chi_dong();

create function f_tong_dong_thu_chi(p_dong jsonb) returns numeric
language plpgsql immutable as $$
declare
  v_item jsonb;
  v_tong numeric := 0;
  v_gia numeric;
  v_luong numeric;
begin
  if p_dong is null or jsonb_typeof(p_dong) <> 'array' then
    raise exception 'Danh sách HH/DV không hợp lệ.';
  end if;
  if jsonb_array_length(p_dong) < 1 or jsonb_array_length(p_dong) > 50 then
    raise exception 'Phiếu cần từ 1 đến 50 dòng HH/DV.';
  end if;
  for v_item in select value from jsonb_array_elements(p_dong) loop
    if jsonb_typeof(v_item) <> 'object' or btrim(coalesce(v_item->>'ten_hh_dv', '')) = '' then
      raise exception 'Mỗi dòng cần có tên HH/DV.';
    end if;
    if jsonb_typeof(v_item->'don_gia') <> 'number' or
       jsonb_typeof(v_item->'so_luong') <> 'number' then
      raise exception 'Đơn giá và số lượng không hợp lệ.';
    end if;
    v_gia := (v_item->>'don_gia')::numeric;
    v_luong := (v_item->>'so_luong')::numeric;
    if v_gia is null or v_luong is null or v_gia <= 0 or v_luong <= 0 then
      raise exception 'Đơn giá và số lượng phải lớn hơn 0.';
    end if;
    v_tong := v_tong + round(v_gia * v_luong, 0);
  end loop;
  return v_tong;
end; $$;

revoke all on function f_tong_dong_thu_chi(jsonb) from public;

-- SECURITY DEFINER chỉ để ghi phiếu + các dòng trong một transaction.
-- Quyền người gọi và trạng thái duyệt vẫn được kiểm tra tường minh.
create function f_luu_phieu_thu_chi_nhieu_dong(
  p_loai loai_thu_chi_enum,
  p_ma_don text,
  p_ten_cong_trinh text,
  p_noi_dung_thu noi_dung_thu_enum,
  p_noi_dung_chi noi_dung_chi_enum,
  p_phuong_thuc phuong_thuc_thu_enum,
  p_nguoi_tao text,
  p_ngay timestamptz,
  p_ghi_chu text,
  p_dong jsonb,
  p_ma_tc text default null,
  p_da_duyet boolean default null
) returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_vai_tro vai_tro_enum := f_vai_tro_hien_tai();
  v_ma_nv text := f_ma_nv_hien_tai();
  v_phieu thu_chi%rowtype;
  v_tong numeric;
  v_ma_tc text;
  v_item jsonb;
  v_thu_tu integer := 0;
begin
  if auth.uid() is null or v_ma_nv is null or
     not coalesce(v_vai_tro in ('Admin', 'Quản lý', 'Kế toán'), false) then
    raise exception 'Bạn không có quyền lập hoặc sửa phiếu thu chi.';
  end if;
  if p_loai = 'Thu' and (p_noi_dung_thu is null or p_noi_dung_thu = 'Thanh toán' or p_noi_dung_chi is not null) then
    raise exception 'Danh mục thu không hợp lệ.';
  end if;
  if p_loai = 'Chi' and (p_noi_dung_chi is null or p_noi_dung_thu is not null) then
    raise exception 'Danh mục chi không hợp lệ.';
  end if;
  if p_phuong_thuc not in ('Tiền mặt', 'Chuyển khoản') or p_nguoi_tao is null or p_ngay is null then
    raise exception 'Thiếu phương thức, người thu chi hoặc ngày.';
  end if;
  v_tong := f_tong_dong_thu_chi(p_dong);

  if p_ma_tc is null then
    insert into thu_chi (loai, ma_don, ten_cong_trinh, noi_dung_thu, noi_dung_chi,
                         so_tien, phuong_thuc, nguoi_tao, ngay, ghi_chu)
    values (p_loai, nullif(p_ma_don, ''), nullif(btrim(p_ten_cong_trinh), ''),
            p_noi_dung_thu, p_noi_dung_chi, v_tong, p_phuong_thuc,
            p_nguoi_tao, p_ngay, nullif(btrim(p_ghi_chu), ''))
    returning ma_tc into v_ma_tc;
  else
    select * into v_phieu from thu_chi where ma_tc = p_ma_tc for update;
    if not found or v_phieu.ma_thu is not null or
       not exists (select 1 from thu_chi_dong where ma_tc = p_ma_tc) then
      raise exception 'Phiếu không tồn tại hoặc không có chi tiết HH/DV.';
    end if;
    if p_da_duyet is distinct from v_phieu.da_duyet then
      raise exception 'Trạng thái phiếu đã thay đổi. Vui lòng tải lại trang.';
    end if;
    if v_vai_tro <> 'Admin' and
       (v_phieu.da_duyet or v_phieu.nguoi_lap is distinct from v_ma_nv) then
      raise exception 'Chỉ người lập được sửa trước duyệt; sau duyệt chỉ Admin được sửa.';
    end if;
    update thu_chi set
      loai = p_loai, ma_don = nullif(p_ma_don, ''),
      ten_cong_trinh = nullif(btrim(p_ten_cong_trinh), ''),
      noi_dung_thu = p_noi_dung_thu, noi_dung_chi = p_noi_dung_chi,
      so_tien = v_tong, phuong_thuc = p_phuong_thuc,
      nguoi_tao = p_nguoi_tao, ngay = p_ngay,
      ghi_chu = nullif(btrim(p_ghi_chu), '')
    where ma_tc = p_ma_tc;
    delete from thu_chi_dong where ma_tc = p_ma_tc;
    v_ma_tc := p_ma_tc;
  end if;

  for v_item in select value from jsonb_array_elements(p_dong) loop
    v_thu_tu := v_thu_tu + 1;
    insert into thu_chi_dong (ma_tc, thu_tu, ten_hh_dv, don_gia, so_luong)
    values (v_ma_tc, v_thu_tu, btrim(v_item->>'ten_hh_dv'),
            (v_item->>'don_gia')::numeric, (v_item->>'so_luong')::numeric);
  end loop;
  return v_ma_tc;
end; $$;

revoke all on function f_luu_phieu_thu_chi_nhieu_dong(loai_thu_chi_enum, text, text, noi_dung_thu_enum, noi_dung_chi_enum, phuong_thuc_thu_enum, text, timestamptz, text, jsonb, text, boolean) from public;
grant execute on function f_luu_phieu_thu_chi_nhieu_dong(loai_thu_chi_enum, text, text, noi_dung_thu_enum, noi_dung_chi_enum, phuong_thuc_thu_enum, text, timestamptz, text, jsonb, text, boolean) to authenticated;

create or replace view v_thu_chi_danh_sach with (security_invoker = true) as
select tc.*,
       coalesce(d.mo_ta_su_co, tc.ten_cong_trinh) as ten_cong_trinh_hien_thi,
       nv.ho_ten as ho_ten_nguoi_thu_chi,
       (select count(*)::integer from thu_chi_dong x where x.ma_tc = tc.ma_tc) as so_dong
from thu_chi tc
left join don_hang d on d.ma_don = tc.ma_don
left join nhan_vien nv on nv.ma_nv = tc.nguoi_tao;

commit;
