-- =====================================================================
-- 0024: Thêm vai trò mới "Kiểm soát" — xem được toàn bộ dữ liệu/màn
-- hình trong ứng dụng (như một kiểm toán viên nội bộ) nhưng KHÔNG được
-- tạo/sửa/xóa bất kỳ thứ gì. Tách riêng thành migration này vì Postgres
-- không cho phép dùng giá trị enum mới thêm trong CÙNG 1 transaction/
-- migration đã thêm nó — phải chạy tách biệt với 0025 (nơi giá trị này
-- được dùng trong các RLS policy).
-- =====================================================================

alter type vai_tro_enum add value 'Kiểm soát';
