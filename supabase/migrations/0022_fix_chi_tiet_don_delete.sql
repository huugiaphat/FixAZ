-- =====================================================================
-- 0022: Sửa lỗi nút "Xóa" ở tab Chi tiết BG không hoạt động cho ai cả.
-- chi_tiet_don chưa bao giờ được GRANT DELETE (0012 chỉ cấp select/
-- insert/update) — trước giờ bấm "Xóa" không báo lỗi nhưng thực chất
-- không xóa được dòng nào (0 rows affected). Cấp quyền DELETE + policy
-- giới hạn Quản lý/CSKH-Điều phối, đúng như quy tắc hiện có ở update.
-- =====================================================================

grant delete on chi_tiet_don to authenticated;
create policy p_ctd_delete on chi_tiet_don for delete to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);
