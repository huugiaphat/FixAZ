-- Báo cáo khoản ngoài đơn hàng theo đúng tên công trình trên phiếu thu chi.
-- Chạy sau 0041; giữ nguyên tên/cột view để giao diện hiện tại vẫn đọc được.
begin;

create or replace view v_bao_cao_cong_trinh with (security_invoker = true) as
with phieu_ngoai_don as (
  select tc.ngay, tc.loai, tc.so_tien,
    to_char(tc.ngay at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM') as thang,
    coalesce(nullif(btrim(tc.ten_cong_trinh), ''), 'Chưa gắn công trình') as ten_cong_trinh
  from thu_chi tc
  where tc.ma_don is null and (tc.da_duyet or tc.ma_thu is not null)
)
select
  'DON:' || d.ma_don as ma_muc,
  d.ma_don,
  d.ma_don || ' — ' || d.mo_ta_su_co as ten_hien_thi,
  d.ngay_tiep_nhan as ngay_sap_xep,
  d.trang_thai::text as trang_thai,
  null::text as thang_quan_ly,
  coalesce(sum(tc.so_tien) filter (where tc.loai = 'Thu'), 0) as tong_thu,
  coalesce(sum(tc.so_tien) filter (where tc.loai = 'Chi'), 0) as tong_chi
from don_hang d
left join thu_chi tc on tc.ma_don = d.ma_don
  and (tc.da_duyet or tc.ma_thu is not null)
group by d.ma_don, d.mo_ta_su_co, d.ngay_tiep_nhan, d.trang_thai
union all
select
  'QL:' || p.thang || ':' || md5(p.ten_cong_trinh) as ma_muc,
  null::text as ma_don,
  p.ten_cong_trinh as ten_hien_thi,
  max(p.ngay) as ngay_sap_xep,
  null::text as trang_thai,
  p.thang as thang_quan_ly,
  coalesce(sum(p.so_tien) filter (where p.loai = 'Thu'), 0) as tong_thu,
  coalesce(sum(p.so_tien) filter (where p.loai = 'Chi'), 0) as tong_chi
from phieu_ngoai_don p
group by p.thang, p.ten_cong_trinh;

create or replace view v_bao_cao_chi_phi_cong_trinh with (security_invoker = true) as
select
  case when ma_don is null then
    'QL:' || to_char(ngay at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM') || ':' ||
      md5(coalesce(nullif(btrim(ten_cong_trinh), ''), 'Chưa gắn công trình'))
  else 'DON:' || ma_don end as ma_muc,
  noi_dung_chi::text as danh_muc,
  count(*) as so_phieu,
  sum(so_tien) as tong_chi
from thu_chi
where loai = 'Chi' and da_duyet
group by 1, noi_dung_chi;

notify pgrst, 'reload schema';
commit;
