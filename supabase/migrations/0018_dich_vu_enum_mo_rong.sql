-- =====================================================================
-- 0018: Mở rộng danh sách "Loại dịch vụ" (dùng ở đơn hàng + yêu cầu
-- dịch vụ công khai) theo yêu cầu công ty: Nhà cửa/Điện/Nước/Tổng
-- hợp/Thiết bị/Khác — bỏ "Điện & Nước" (không còn đơn/yêu cầu nào
-- đang dùng giá trị này tính đến thời điểm viết migration).
-- Postgres không có ALTER TYPE ... DROP VALUE nên phải tạo type mới,
-- chuyển cột sang, rồi xóa type cũ.
--
-- don_hang.dich_vu bị 2 view phụ thuộc (v_don_hang, rồi v_tong_hop_dashboard
-- phụ thuộc tiếp vào v_don_hang) nên phải drop theo đúng thứ tự phụ
-- thuộc, đổi kiểu cột, rồi tạo lại y hệt định nghĩa gốc ở 0008 (kể cả
-- security_invoker đã bật ở 0014 — CREATE VIEW mới không tự giữ lại).
-- =====================================================================

drop view if exists v_tong_hop_dashboard;
drop view if exists v_don_hang;

-- Phòng trường hợp lần chạy trước bị lỗi giữa chừng để lại type dở dang.
drop type if exists dich_vu_enum_v2;
create type dich_vu_enum_v2 as enum ('Nhà cửa', 'Điện', 'Nước', 'Tổng hợp', 'Thiết bị', 'Khác');

alter table don_hang alter column dich_vu type dich_vu_enum_v2 using dich_vu::text::dich_vu_enum_v2;
alter table yeu_cau_dich_vu alter column dich_vu type dich_vu_enum_v2 using dich_vu::text::dich_vu_enum_v2;

drop type dich_vu_enum;
alter type dich_vu_enum_v2 rename to dich_vu_enum;

-- ---- Tạo lại v_don_hang y hệt 0008 ----
create view v_don_hang as
select
  d.*,
  coalesce(ct.tong_chi_tiet, 0) + coalesce(ps.tong_phat_sinh, 0) as tong_tien,
  coalesce(t.tong_da_thu, 0) as da_thu,
  (coalesce(ct.tong_chi_tiet, 0) + coalesce(ps.tong_phat_sinh, 0)) - coalesce(t.tong_da_thu, 0) as cong_no
from don_hang d
left join (
  select ma_don, sum(so_luong * gia_ban) as tong_chi_tiet
  from chi_tiet_don group by ma_don
) ct on ct.ma_don = d.ma_don
left join (
  select ma_don, sum(gia) as tong_phat_sinh
  from phat_sinh where khach_xac_nhan = true group by ma_don
) ps on ps.ma_don = d.ma_don
left join (
  select ma_don, sum(so_tien) as tong_da_thu
  from thu_tien group by ma_don
) t on t.ma_don = d.ma_don;

comment on view v_don_hang is 'Đơn hàng kèm TongTien/DaThu/CongNo tính động — dùng thay bảng don_hang ở tầng đọc dữ liệu.';
alter view v_don_hang set (security_invoker = true);
grant select on v_don_hang to authenticated;

-- ---- Tạo lại v_tong_hop_dashboard y hệt 0008 ----
create view v_tong_hop_dashboard as
with thang_hien_tai as (
  select date_trunc('month', now()) as dau_thang
),
don_thang as (
  select d.* from don_hang d, thang_hien_tai t
  where d.ngay_tiep_nhan >= t.dau_thang
),
don_hoan_thanh_thang as (
  select d.* from v_don_hang d, thang_hien_tai t
  where d.trang_thai = 'Đã đóng' and d.ngay_dong_don >= t.dau_thang::date
),
bao_gia_xac_nhan_thang as (
  select distinct bg.ma_don from bao_gia bg, thang_hien_tai t
  where bg.khach_xac_nhan = true and bg.ngay_xac_nhan >= t.dau_thang
),
don_tre as (
  select dp.ma_don from dieu_phoi dp
  where dp.check_in is null and dp.eta is not null and dp.eta < now()
),
gia_von_thang as (
  select coalesce(sum(ct.so_luong * ct.gia_von), 0) as tong_gia_von
  from chi_tiet_don ct
  join don_hoan_thanh_thang d on d.ma_don = ct.ma_don
),
chi_phi_bao_hanh_thang as (
  select coalesce(sum(bh.chi_phi), 0) as tong_chi_phi from bao_hanh bh, thang_hien_tai t
  where bh.created_at >= t.dau_thang
),
khieu_nai_hoan_thanh_thang as (
  select count(distinct kn.ma_don) as so_don_khieu_nai
  from khieu_nai kn
  join don_hoan_thanh_thang d on d.ma_don = kn.ma_don
)
select
  1 as id,
  (select count(*) from don_thang) as don_moi_thang,
  (select count(*) from don_hoan_thanh_thang) as don_hoan_thanh_thang,
  (select coalesce(sum(tong_tien), 0) from don_hoan_thanh_thang) as doanh_thu_thang,
  (select coalesce(sum(da_thu), 0) from don_hoan_thanh_thang) as da_thu_thang,
  (select coalesce(sum(cong_no), 0) from v_don_hang where trang_thai <> 'Đã hủy') as cong_no_hien_tai,
  (select count(*) from don_tre) as don_tre,
  (select count(*) from bao_hanh where trang_thai <> 'Đã đóng') as bao_hanh_dang_xu_ly,
  (select count(*) from khieu_nai where trang_thai <> 'Đã xử lý') as khieu_nai_dang_xu_ly,
  case when (select count(*) from don_thang) = 0 then 0
    else round((select count(*) from bao_gia_xac_nhan_thang)::numeric / (select count(*) from don_thang) * 100, 1)
  end as ty_le_chuyen_doi,
  case when (select count(*) from don_hoan_thanh_thang) = 0 then 0
    else round((select so_don_khieu_nai from khieu_nai_hoan_thanh_thang)::numeric / (select count(*) from don_hoan_thanh_thang) * 100, 1)
  end as ty_le_sua_lai,
  case when (select coalesce(sum(tong_tien), 0) from don_hoan_thanh_thang) = 0 then 0
    else round(
      ((select coalesce(sum(tong_tien), 0) from don_hoan_thanh_thang)
        - (select tong_gia_von from gia_von_thang)
        - (select tong_chi_phi from chi_phi_bao_hanh_thang))
      / (select sum(tong_tien) from don_hoan_thanh_thang) * 100, 1)
  end as bien_loi_nhuan;

comment on view v_tong_hop_dashboard is 'A17_TONGHOP — phục vụ Mục 8 Dashboard Quản lý, tất cả tính động cho tháng hiện tại. Biên lợi nhuận là giá trị xấp xỉ (chưa mô hình hóa chi phí nhân công/vận hành ngoài giá vốn vật tư + chi phí bảo hành, vì tài liệu chưa có thực thể chi phí riêng).';
alter view v_tong_hop_dashboard set (security_invoker = true);
grant select on v_tong_hop_dashboard to authenticated;
