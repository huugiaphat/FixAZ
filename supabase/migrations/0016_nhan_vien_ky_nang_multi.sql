-- =====================================================================
-- 0016: Kỹ năng nhân viên đổi sang danh sách riêng (Tổng hợp/Điện
-- nước/Hàn/Xây/Sơn/Học việc) và cho chọn nhiều — tách khỏi
-- dich_vu_enum (cột này dùng chung với don_hang.dich_vu, không thể
-- đổi giá trị enum đó mà không ảnh hưởng ý nghĩa của đơn hàng).
-- Chuyển sang text[] thay vì tạo enum mới để dễ sửa danh sách sau này
-- mà không cần thêm migration (ràng buộc giá trị hợp lệ ở tầng ứng
-- dụng qua Zod, giống các mảng khác trong schema như anh_hien_trang).
-- =====================================================================

alter table nhan_vien
  alter column ky_nang type text[]
  using case when ky_nang is null then '{}'::text[] else array[ky_nang::text] end,
  alter column ky_nang set default '{}'::text[],
  alter column ky_nang set not null;
