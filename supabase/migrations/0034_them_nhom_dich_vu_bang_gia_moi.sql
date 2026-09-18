-- =====================================================================
-- 0034: Thêm nhóm dịch vụ cho bảng giá mới ("gia new.pdf" — Bảng đơn
-- giá khoán nội bộ Điện/Nước/Nhà cửa, mã D01-D40/N01-N35/H01-H20).
-- 'Điện' và 'Nước' đã có sẵn từ 0001, chỉ thiếu 9 nhóm còn lại.
--
-- Cùng lý do 0029/0030/0033: KHÔNG dùng giá trị enum mới thêm trong
-- cùng transaction — chạy (Run) xong file này, đợi commit, rồi mới
-- insert data ở bước sau.
-- =====================================================================

alter type nhom_dv_enum add value 'Máy bơm';
alter type nhom_dv_enum add value 'Bình nóng lạnh';
alter type nhom_dv_enum add value 'Điện 3 pha';
alter type nhom_dv_enum add value 'Đi dây';
alter type nhom_dv_enum add value 'Tủ điện';
alter type nhom_dv_enum add value 'Thiết bị';
alter type nhom_dv_enum add value 'EV';
alter type nhom_dv_enum add value 'Khẩn cấp';
alter type nhom_dv_enum add value 'Nhà cửa';
