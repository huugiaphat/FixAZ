-- =====================================================================
-- 0021: Cho phép Thợ tự thêm hạng mục vào "Chi tiết BG" (chi_tiet_don)
-- cho đơn mình phụ trách — giúp thợ chủ động chốt vật tư/dịch vụ ngay
-- khi đang khảo sát tại nhà khách, không phải chờ CSKH nhập hộ. Chỉ mở
-- quyền INSERT (tạo mới); sửa/xóa hạng mục đã có vẫn chỉ Quản lý/CSKH-
-- Điều phối mới được làm, để tránh thợ tự ý xóa khoản đã chốt với khách.
-- Dùng lại f_la_tho_cua_don() đã có ở 0011 — đúng thợ đang phụ trách
-- đơn đó (qua don_hang.tho_phu_trach hoặc bản ghi dieu_phoi) mới được.
-- =====================================================================

drop policy p_ctd_write on chi_tiet_don;
create policy p_ctd_write on chi_tiet_don for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
