-- =====================================================================
-- 0035: Thêm 'Thuế' vào loai_hang_muc_enum — chi_tiet_don.loai hiện chỉ
-- có 'Dịch vụ'/'Vật tư', cần thêm để ghi khoản thuế như 1 hạng mục
-- riêng trong Chi tiết đơn.
-- =====================================================================

alter type loai_hang_muc_enum add value 'Thuế';
