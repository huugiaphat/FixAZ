-- =====================================================================
-- 0031: Sửa sót ở 0030 — quên cấp SELECT/INSERT/UPDATE cho Admin trên
-- thu_chi (chỉ thêm mỗi DELETE), khiến Admin vào Sổ thu chi không thấy
-- dòng nào (RLS chặn hết ở SELECT).
-- =====================================================================

create policy p_admin_tc_select on thu_chi for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_tc_insert on thu_chi for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_tc_update on thu_chi for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');
