-- Báo cáo dòng tiền: chỉ lấy phiếu đã duyệt hoặc khoản thu đồng bộ.
-- Các view chạy theo quyền người đăng nhập, không vượt qua RLS của bảng gốc.
begin;

create view v_bao_cao_cong_trinh with (security_invoker = true) as
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
  'QL:' || to_char(tc.ngay at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM') as ma_muc,
  null::text as ma_don,
  'Thu Chi tháng ' || to_char(min(tc.ngay) at time zone 'Asia/Ho_Chi_Minh', 'MM/YYYY') as ten_hien_thi,
  max(tc.ngay) as ngay_sap_xep,
  null::text as trang_thai,
  to_char(tc.ngay at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM') as thang_quan_ly,
  coalesce(sum(tc.so_tien) filter (where tc.loai = 'Thu'), 0) as tong_thu,
  coalesce(sum(tc.so_tien) filter (where tc.loai = 'Chi'), 0) as tong_chi
from thu_chi tc
where tc.ma_don is null and (tc.da_duyet or tc.ma_thu is not null)
group by to_char(tc.ngay at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM');

create view v_bao_cao_chi_phi_cong_trinh with (security_invoker = true) as
select
  case when ma_don is null
    then 'QL:' || to_char(ngay at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM')
    else 'DON:' || ma_don end as ma_muc,
  noi_dung_chi::text as danh_muc, count(*) as so_phieu,
  sum(so_tien) as tong_chi
from thu_chi
where loai = 'Chi' and da_duyet
group by 1, noi_dung_chi;

create view v_bao_cao_thang with (security_invoker = true) as
select to_char(ngay at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM') as thang,
  coalesce(sum(so_tien) filter (where loai = 'Thu'), 0) as tong_thu,
  coalesce(sum(so_tien) filter (where loai = 'Chi'), 0) as tong_chi,
  coalesce(sum(so_tien) filter (where loai = 'Thu' and ma_don is null), 0) as thu_chua_gan_don,
  coalesce(sum(so_tien) filter (where loai = 'Chi' and ma_don is null), 0) as chi_chua_gan_don
from thu_chi
where da_duyet or ma_thu is not null
group by to_char(ngay at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM');

create view v_bao_cao_tong_hop with (security_invoker = true) as
select 1 as id,
  coalesce(sum(so_tien) filter (where loai = 'Thu'), 0) as tong_thu,
  coalesce(sum(so_tien) filter (where loai = 'Chi'), 0) as tong_chi,
  coalesce(sum(so_tien) filter (where loai = 'Thu' and ma_don is null), 0) as thu_quan_ly,
  coalesce(sum(so_tien) filter (where loai = 'Chi' and ma_don is null), 0) as chi_quan_ly
from thu_chi
where da_duyet or ma_thu is not null;

grant select on v_bao_cao_cong_trinh, v_bao_cao_chi_phi_cong_trinh,
  v_bao_cao_thang, v_bao_cao_tong_hop to authenticated;
notify pgrst, 'reload schema';
commit;
