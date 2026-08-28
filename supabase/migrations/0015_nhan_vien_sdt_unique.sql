-- =====================================================================
-- 0015: Số điện thoại nhân viên phải duy nhất — dùng để đăng nhập
-- thay cho email (Postgres UNIQUE cho phép nhiều dòng NULL, không cần
-- backfill dữ liệu cũ).
-- =====================================================================

alter table nhan_vien add constraint nhan_vien_sdt_unique unique (sdt);
