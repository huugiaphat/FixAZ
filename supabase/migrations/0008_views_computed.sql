-- =====================================================================
-- 0008: View tính toán động — thay cho các cột "derived" không được
-- phép lưu cứng theo yêu cầu kỹ thuật ở Mục 3 và ghi chú tại Phụ lục A.
-- =====================================================================

-- A4 (ThanhTien = SoLuong x GiaBan). GiaVon là dữ liệu nội bộ — ẩn với
-- vai trò Thợ (Mục Phụ lục A4). Vì Supabase ánh xạ mọi vai trò vào
-- cùng 1 Postgres role "authenticated" nên không thể ẩn cột bằng
-- column-level GRANT; phải ẩn bằng CASE theo vai trò hiện tại ở view.
create view v_chi_tiet_don as
select
  c.ma_dong, c.ma_don, c.loai, c.ma_dv_vt, c.ten_hang_muc, c.so_luong, c.don_vi_tinh,
  case when f_vai_tro_hien_tai() = 'Thợ' then null else c.gia_von end as gia_von,
  c.gia_ban,
  c.created_at,
  (c.so_luong * c.gia_ban) as thanh_tien
from chi_tiet_don c;

-- A3 (TongTien/DaThu/CongNo)
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

-- A10 (TonKho = Nhập - Xuất)
create view v_vat_tu as
select
  v.*,
  coalesce(nx.ton_kho, 0) as ton_kho
from vat_tu v
left join (
  select
    ma_vt,
    sum(case when loai = 'Nhập' then so_luong else -so_luong end) as ton_kho
  from xuat_nhap_kho
  group by ma_vt
) nx on nx.ma_vt = v.ma_vt;

comment on view v_vat_tu is 'Vật tư kèm TonKho tính động (Nhập - Xuất) — dùng cho cảnh báo tồn kho thấp.';

-- A13 (XepLoai A-E)
create view v_kpi_nhan_vien as
select
  k.*,
  case
    when k.diem_tong >= 90 then 'A'
    when k.diem_tong >= 75 then 'B'
    when k.diem_tong >= 60 then 'C'
    when k.diem_tong >= 45 then 'D'
    else 'E'
  end::xep_loai_kpi_enum as xep_loai
from kpi_nhan_vien k;

comment on view v_kpi_nhan_vien is 'A (90-100) đến E (<60) theo Mục 6.10 — ngưỡng B/C/D nội suy đều vì tài liệu chỉ nêu rõ mốc A và E, công ty có thể yêu cầu điều chỉnh khi có bộ tiêu chí chính thức.';

-- A17. Tổng hợp KPI Dashboard (view thay bảng vật lý — "1 dòng duy
-- nhất", toàn bộ trường tính toán động, phục vụ Mục 8).
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
