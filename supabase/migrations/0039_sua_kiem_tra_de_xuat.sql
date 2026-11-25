-- Chạy riêng sau 0038 trên database hiện có.
-- Trigger này chạy cho cả đầu phiếu, dòng HH/DV và Sổ thu chi. Trong 0038,
-- một biểu thức CASE truy cập NEW.ma_tc khi NEW là dòng HH/DV (không có ma_tc),
-- làm thao tác lưu đề xuất báo "record new has no field ma_tc".
begin;

create or replace function f_kiem_tra_dx_khop_so() returns trigger language plpgsql
set search_path = public, pg_temp as $$
declare
  v_ma text;
  v_dx de_xuat_thanh_toan%rowtype;
  v_tong numeric;
  v_tc thu_chi%rowtype;
begin
  if tg_op = 'DELETE' then
    v_ma := to_jsonb(old)->>'ma_dx';
  elsif tg_table_name = 'thu_chi' then
    select ma_dx into v_ma
    from de_xuat_thanh_toan
    where ma_tc = to_jsonb(new)->>'ma_tc';
  else
    v_ma := to_jsonb(new)->>'ma_dx';
  end if;

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

commit;
