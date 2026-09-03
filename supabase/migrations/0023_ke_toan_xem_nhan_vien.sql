-- =====================================================================
-- 0023: Cho Kế toán xem được toàn bộ danh sách nhân viên (chỉ SELECT)
-- Cần thiết để hiển thị tên "Người thu chi"/"Thợ phụ trách" đúng tên
-- thay vì mã NV khi Kế toán xem Sổ thu chi / danh sách Đơn hàng — trước
-- giờ nhan_vien chỉ "thấy hết" với Quản lý/CSKH-Điều phối, Kế toán chỉ
-- thấy chính mình. Không đổi insert/update, Kế toán vẫn không được tạo
-- hay sửa nhân viên.
-- =====================================================================

drop policy p_nv_select on nhan_vien;
create policy p_nv_select on nhan_vien for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán') or auth_user_id = auth.uid()
);
