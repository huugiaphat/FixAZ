-- =====================================================================
-- 0014: VÁ LỖI BẢO MẬT NGHIÊM TRỌNG — các VIEW tạo ở 0008 mặc định
-- chạy với quyền của NGƯỜI TẠO VIEW (thường là superuser postgres khi
-- chạy qua SQL Editor), khiến RLS của bảng gốc bị BỎ QUA hoàn toàn
-- khi truy vấn qua view — vi phạm trực tiếp yêu cầu bắt buộc "Thợ chỉ
-- được thấy đơn được điều phối cho mình" (Mục 2) vì mọi trang đọc dữ
-- liệu qua v_don_hang/v_chi_tiet_don/v_vat_tu/v_kpi_nhan_vien đều lộ
-- toàn bộ dữ liệu cho mọi vai trò.
--
-- Khắc phục: bật security_invoker (Postgres 15+) để view thực thi
-- với quyền của NGƯỜI ĐANG TRUY VẤN — RLS của bảng gốc áp dụng đúng
-- như khi query trực tiếp vào bảng.
-- =====================================================================

alter view v_chi_tiet_don set (security_invoker = true);
alter view v_don_hang set (security_invoker = true);
alter view v_vat_tu set (security_invoker = true);
alter view v_kpi_nhan_vien set (security_invoker = true);
alter view v_tong_hop_dashboard set (security_invoker = true);
