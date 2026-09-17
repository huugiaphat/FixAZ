-- =====================================================================
-- 0033: Mở rộng nhom_dv_enum để chứa bảng giá dịch vụ thật (133 dịch vụ,
-- 15 nhóm) từ "Bang gia dich vu Huu Gia Phat.pdf" — enum cũ chỉ có
-- 'Điện'/'Nước', không đủ vì PDF nhóm theo loại công việc (lắp mới/sửa
-- chữa/sơn/chống thấm/...), có nhóm gộp cả điện lẫn nước.
--
-- Postgres không cho dùng giá trị enum mới thêm trong CÙNG transaction
-- vừa thêm nó (lỗi "unsafe use of new value of enum type") — giống hệt
-- lý do 0029/0030 phải tách riêng. File này CHỈ thêm enum, phải chạy
-- (Run) xong, đợi commit, rồi mới chạy phần insert data ở bước sau.
-- =====================================================================

alter type nhom_dv_enum add value 'Điện nước - Lắp mới';
alter type nhom_dv_enum add value 'Điện nước - Sửa chữa';
alter type nhom_dv_enum add value 'Sơn nhà';
alter type nhom_dv_enum add value 'Chống thấm';
alter type nhom_dv_enum add value 'Trần & vách thạch cao';
alter type nhom_dv_enum add value 'Sàn & gạch';
alter type nhom_dv_enum add value 'Mái nhà';
alter type nhom_dv_enum add value 'Phá dỡ';
alter type nhom_dv_enum add value 'Xây tô';
alter type nhom_dv_enum add value 'Cửa nhôm kính';
alter type nhom_dv_enum add value 'Xây mới / cải tạo nhà';
alter type nhom_dv_enum add value 'Sửa máy lạnh';
alter type nhom_dv_enum add value 'Sửa máy giặt';
alter type nhom_dv_enum add value 'Sửa tủ lạnh';
alter type nhom_dv_enum add value 'Sửa máy nước nóng';
