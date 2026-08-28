-- =====================================================================
-- Seed dữ liệu mẫu cho môi trường DEV/TEST.
--
-- QUAN TRỌNG: tài liệu yêu cầu (Mục 12) ghi rõ giá dịch vụ, hạn mức
-- giảm giá, chỉ tiêu KPI hiện chỉ là "số liệu khung minh họa" và file
-- Google Sheet dữ liệu mẫu thật KHÔNG được đính kèm trong tài liệu này
-- — nên toàn bộ giá/tên dịch vụ/vật tư dưới đây là DỮ LIỆU GIẢ ĐỊNH để
-- test giao diện, KHÔNG PHẢI số liệu công ty cung cấp. Phải thay bằng
-- số liệu thật trước khi vận hành (đúng lưu ý tại Mục 12 tài liệu).
--
-- Tài khoản đăng nhập demo (5 vai trò) KHÔNG được tạo trong file SQL
-- này vì Supabase Auth cần đi qua Admin API để hash mật khẩu đúng
-- chuẩn — xem scripts/seed-demo-users.mjs sau khi dự án Next.js được
-- scaffold (chạy `npm run seed:demo` sau khi có .env.local).
-- =====================================================================

-- Danh mục dùng chung — "ChucVu" (9 vị trí theo sơ đồ tổ chức, Mục B
-- quy chế KHÔNG có trong tài liệu tóm tắt này) — đây là danh sách TẠM
-- để có dữ liệu test; Quản lý cần vào Danh mục quản trị chỉnh lại cho
-- đúng sơ đồ tổ chức thật của công ty.
insert into danh_muc (loai_danh_muc, gia_tri, thu_tu) values
  ('ChucVu', 'Giám đốc', 1),
  ('ChucVu', 'Trưởng phòng Kinh doanh', 2),
  ('ChucVu', 'CSKH/Kinh doanh', 3),
  ('ChucVu', 'Điều phối viên', 4),
  ('ChucVu', 'Thợ chính', 5),
  ('ChucVu', 'Thợ phụ', 6),
  ('ChucVu', 'Kế toán/Đối soát', 7),
  ('ChucVu', 'Kho/Mua hàng', 8),
  ('ChucVu', 'Nhân viên khác', 9)
on conflict (loai_danh_muc, gia_tri) do nothing;

insert into danh_muc (loai_danh_muc, gia_tri, thu_tu) values
  ('KhuVuc', 'Khu vực 1', 1),
  ('KhuVuc', 'Khu vực 2', 2),
  ('KhuVuc', 'Khu vực 3', 3)
on conflict (loai_danh_muc, gia_tri) do nothing;

-- Bảng giá dịch vụ — DEMO, cần công ty cung cấp số liệu thật (Mục 12).
insert into bang_gia_dich_vu (ten_dich_vu, nhom_dich_vu, don_vi_tinh, gia_tham_khao) values
  ('Sửa ổ cắm/công tắc điện', 'Điện', 'Điểm', '80.000 - 150.000 đ'),
  ('Thay/sửa bóng đèn, đường dây điện trong nhà', 'Điện', 'Điểm', '100.000 - 300.000 đ'),
  ('Kiểm tra & sửa chập/cháy điện', 'Điện', 'Lần', '200.000 - 600.000 đ'),
  ('Sửa vòi nước, van nước rò rỉ', 'Nước', 'Điểm', '100.000 - 250.000 đ'),
  ('Thông tắc đường ống nước', 'Nước', 'Lần', '200.000 - 500.000 đ'),
  ('Lắp đặt/sửa máy bơm nước', 'Nước', 'Lần', '250.000 - 700.000 đ')
on conflict do nothing;

-- Vật tư — DEMO.
insert into vat_tu (ten, quy_cach, don_vi_tinh, gia_von, gia_ban, nguong_canh_bao_ton) values
  ('Dây điện đôi 2x1.5mm', 'Cuộn 100m', 'Cuộn', 350000, 450000, 3),
  ('Ổ cắm âm tường', 'Loại đơn', 'Cái', 25000, 45000, 10),
  ('Van nước PVC 27mm', 'Phi 27', 'Cái', 30000, 55000, 10),
  ('Ống nước PVC 27mm', 'Cây 4m', 'Cây', 60000, 95000, 5),
  ('Băng keo điện', 'Cuộn', 'Cuộn', 5000, 12000, 20)
on conflict do nothing;
