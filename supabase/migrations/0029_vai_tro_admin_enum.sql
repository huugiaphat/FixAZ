-- =====================================================================
-- 0029: Thêm vai trò "Admin" — toàn quyền cao nhất trong ứng dụng, tách
-- riêng khỏi "Quản lý" (hiện có nhiều người mang vai trò Quản lý, nhưng
-- chỉ chủ doanh nghiệp mới nên có quyền xóa cứng đơn hàng/phiếu thu chi
-- — xem 0030). Phải nằm RIÊNG 1 migration, chạy RIÊNG (Run) trước 0030
-- — Postgres không cho phép dùng giá trị enum mới thêm trong cùng 1
-- transaction với câu lệnh ADD VALUE.
-- =====================================================================

alter type vai_tro_enum add value 'Admin';
