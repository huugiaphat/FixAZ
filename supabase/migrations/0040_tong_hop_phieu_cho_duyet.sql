-- Hàng chờ duyệt là toàn bộ phiếu chưa xử lý, không giới hạn bởi bộ lọc
-- tháng của Sổ thu chi. Đề xuất thanh toán chưa được hạch toán cho đến khi duyệt.
-- Chạy riêng sau 0039 trên database hiện có.
begin;

create or replace function f_tong_hop_phieu_cho_duyet()
returns table (
  cho_duyet_thu numeric,
  cho_duyet_chi numeric,
  so_phieu_cho_duyet bigint,
  so_de_xuat_cho_duyet bigint
)
language sql stable security invoker set search_path = public, pg_temp as $$
  with phieu_nhap_tay as (
    select
      coalesce(sum(so_tien) filter (where loai = 'Thu'), 0) as thu,
      coalesce(sum(so_tien) filter (where loai = 'Chi'), 0) as chi,
      count(*) as so_phieu
    from thu_chi
    where ma_thu is null and not da_duyet
  ), de_xuat as (
    select coalesce(sum(tong_tien), 0) as chi, count(*) as so_phieu
    from de_xuat_thanh_toan
    where trang_thai = 'Chờ duyệt'
  )
  select phieu_nhap_tay.thu, phieu_nhap_tay.chi + de_xuat.chi,
    phieu_nhap_tay.so_phieu + de_xuat.so_phieu, de_xuat.so_phieu
  from phieu_nhap_tay cross join de_xuat;
$$;

revoke all on function f_tong_hop_phieu_cho_duyet() from public;
grant execute on function f_tong_hop_phieu_cho_duyet() to authenticated;

notify pgrst, 'reload schema';
commit;
