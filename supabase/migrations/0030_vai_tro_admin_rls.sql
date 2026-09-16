-- =====================================================================
-- 0030: Cấp quyền cho vai trò "Admin" (0029) — toàn quyền đọc/ghi như
-- Quản lý trên mọi bảng nghiệp vụ, CỘNG THÊM quyền XÓA đơn hàng và
-- phiếu Sổ thu chi mà ngay cả Quản lý cũng không có (giữ đúng nguyên
-- tắc "không ai xóa được lịch sử" cho vai trò Quản lý, chỉ nới cho
-- đúng 1 vai trò cao nhất này).
--
-- Kỹ thuật: KHÔNG sửa lại bất kỳ policy nào đã có (rủi ro cao, dễ sót)
-- — chỉ THÊM 1 policy permissive mới cho 'Admin' trên mỗi bảng/thao
-- tác. Postgres RLS gộp các policy permissive bằng OR, nên thêm vào
-- không ảnh hưởng gì tới các vai trò khác đang hoạt động đúng.
--
-- Cố tình KHÔNG cấp thêm cho Admin: ghi vào audit_log (bất biến với
-- MỌI vai trò, kể cả Admin — đây là nguyên tắc bảo mật lõi, không nới
-- lỏng), và xóa ở các bảng khác ngoài đơn hàng/thu_chi (không được yêu
-- cầu, giữ đúng phạm vi).
-- =====================================================================

-- ---- Đọc/ghi như Quản lý trên các bảng còn lại (không có delete) ----
create policy p_admin_nv_select on nhan_vien for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_nv_insert on nhan_vien for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_nv_update on nhan_vien for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_kh_select on khach_hang for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_kh_insert on khach_hang for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_kh_update on khach_hang for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_don_select on don_hang for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_don_insert on don_hang for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_don_update on don_hang for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_ctd_select on chi_tiet_don for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_ctd_insert on chi_tiet_don for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_ctd_update on chi_tiet_don for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_ctd_delete on chi_tiet_don for delete to authenticated using (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_bg_select on bao_gia for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_bg_insert on bao_gia for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_bg_update on bao_gia for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_ps_select on phat_sinh for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_ps_insert on phat_sinh for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_ps_update on phat_sinh for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_dp_select on dieu_phoi for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_dp_insert on dieu_phoi for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_dp_update on dieu_phoi for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_nt_select on nghiem_thu for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_nt_insert on nghiem_thu for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_nt_update on nghiem_thu for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_thu_select on thu_tien for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_thu_insert on thu_tien for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_thu_update on thu_tien for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_vt_insert on vat_tu for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_vt_update on vat_tu for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_xn_select on xuat_nhap_kho for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_xn_insert on xuat_nhap_kho for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_xn_update on xuat_nhap_kho for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_bh_select on bao_hanh for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_bh_insert on bao_hanh for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_bh_update on bao_hanh for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_kpi_select on kpi_nhan_vien for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_kpi_insert on kpi_nhan_vien for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_kpi_update on kpi_nhan_vien for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_kn_select on khieu_nai for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_kn_insert on khieu_nai for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_kn_update on khieu_nai for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_dv_insert on bang_gia_dich_vu for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_dv_update on bang_gia_dich_vu for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_dm_insert on danh_muc for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_dm_update on danh_muc for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_ch_update on cau_hinh_he_thong for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_tb_select on thong_bao for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_ycdv_select on yeu_cau_dich_vu for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_ycdv_update on yeu_cau_dich_vu for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_mbg_select on mau_bao_gia for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_mbg_insert on mau_bao_gia for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_mbg_update on mau_bao_gia for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');

create policy p_admin_mbgd_select on mau_bao_gia_dong for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_mbgd_insert on mau_bao_gia_dong for insert to authenticated with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_mbgd_update on mau_bao_gia_dong for update to authenticated using (f_vai_tro_hien_tai() = 'Admin') with check (f_vai_tro_hien_tai() = 'Admin');
create policy p_admin_mbgd_delete on mau_bao_gia_dong for delete to authenticated using (f_vai_tro_hien_tai() = 'Admin');

-- Audit log: chỉ đọc thêm cho Admin — KHÔNG cấp ghi cho ai, kể cả Admin.
create policy p_admin_audit_select on audit_log for select to authenticated using (f_vai_tro_hien_tai() = 'Admin');

-- ---- Quyền XÓA mới — chỉ Admin, chỉ 2 bảng được yêu cầu ----
grant delete on don_hang to authenticated;
create policy p_admin_don_delete on don_hang for delete to authenticated using (f_vai_tro_hien_tai() = 'Admin');
comment on policy p_admin_don_delete on don_hang is 'Xóa cứng đơn hàng — chỉ Admin. Các bảng con cascade (chi_tiet_don, bao_gia, phat_sinh, dieu_phoi, nghiem_thu, thu_tien) sẽ tự xóa theo; các bảng KHÔNG cascade (khieu_nai, bao_hanh, xuat_nhap_kho, thu_chi, mau_bao_gia, yeu_cau_dich_vu) sẽ CHẶN việc xóa nếu còn dòng tham chiếu — đúng ý muốn "không xóa được nếu còn dữ liệu liên quan".';

grant delete on thu_chi to authenticated;
create policy p_admin_tc_delete on thu_chi for delete to authenticated using (f_vai_tro_hien_tai() = 'Admin');

-- Mở rộng trigger chặn sửa dòng thu_chi đồng bộ từ thu_tien (0027) để
-- chặn luôn cả XÓA — xóa 1 dòng đã đồng bộ sẽ làm Sổ thu chi lệch với
-- khoản thu thật của đơn hàng, không có cách nào đồng bộ lại.
drop trigger trg_chan_sua_thu_chi_dong_bo on thu_chi;
create trigger trg_chan_sua_thu_chi_dong_bo before update or delete on thu_chi
  for each row execute function f_chan_sua_thu_chi_dong_bo();

comment on function f_chan_sua_thu_chi_dong_bo is 'Chặn sửa VÀ xóa dòng thu_chi tự động đồng bộ từ thu_tien (ma_thu not null) — kể cả Admin, để Sổ thu chi luôn khớp với tiền thực thu của đơn hàng.';

-- ---- Chặn tự phong "Admin" — p_nv_update (0012) cho phép MỌI Quản lý
-- sửa vai_tro_app của BẤT KỲ ai (kể cả chính họ), nên nếu không chặn
-- riêng, 1 trong 4 tài khoản Quản lý hiện có có thể tự đổi vai trò
-- mình thành Admin ngay trong màn hình Quản trị → Nhân viên. Chỉ cho
-- phép gán vai_tro_app = 'Admin' khi: (a) người gọi đang là Admin (Admin
-- tự thêm Admin khác), hoặc (b) gọi bằng service role không qua phiên
-- đăng nhập nào (auth.uid() is null — dùng đúng 1 lần để gán Admin đầu
-- tiên qua script, xem hướng dẫn triển khai).
create function f_chan_tu_phong_admin() returns trigger language plpgsql as $$
begin
  if new.vai_tro_app = 'Admin' and auth.uid() is not null and f_vai_tro_hien_tai() is distinct from 'Admin' then
    raise exception 'Chỉ Admin mới có thể gán vai trò Admin cho người khác.';
  end if;
  return new;
end; $$;

create trigger trg_chan_tu_phong_admin before insert or update on nhan_vien
  for each row execute function f_chan_tu_phong_admin();

-- ---- Cho phép Admin đổi trạng thái đơn hàng qua RPC (0009/0025) và
-- dùng quyền xác nhận khẩn cấp như Quản lý ----
create or replace function f_chuyen_trang_thai_don(
  p_ma_don text,
  p_trang_thai_moi trang_thai_don_enum,
  p_ly_do_huy text default null,
  p_xac_nhan_khan_cap boolean default false
) returns don_hang language plpgsql security definer set search_path = public as $$
declare
  v_don don_hang;
  v_co_bao_gia_xac_nhan boolean;
  v_co_nghiem_thu_xac_nhan boolean;
  v_cong_no numeric;
  v_vai_tro vai_tro_enum;
begin
  perform set_config('app.bypass_state_guard', 'true', true);

  select * into v_don from don_hang where ma_don = p_ma_don for update;
  if not found then
    raise exception 'Không tìm thấy đơn hàng %', p_ma_don;
  end if;

  v_vai_tro := f_vai_tro_hien_tai();

  if not (
    v_vai_tro in ('Quản lý', 'Admin', 'CSKH-Điều phối')
    or (v_vai_tro = 'Thợ' and f_la_tho_cua_don(p_ma_don))
  ) then
    raise exception 'Vai trò % không có quyền chuyển trạng thái đơn hàng.', v_vai_tro;
  end if;

  if p_trang_thai_moi <> 'Đã hủy' then
    if not (
      (v_don.trang_thai = 'Mới tiếp nhận' and p_trang_thai_moi = 'Đã điều phối') or
      (v_don.trang_thai = 'Đã điều phối' and p_trang_thai_moi = 'Đang khảo sát') or
      (v_don.trang_thai = 'Đang khảo sát' and p_trang_thai_moi = 'Chờ duyệt báo giá') or
      (v_don.trang_thai = 'Chờ duyệt báo giá' and p_trang_thai_moi = 'Đang thi công') or
      (v_don.trang_thai = 'Đang thi công' and p_trang_thai_moi = 'Chờ nghiệm thu') or
      (v_don.trang_thai = 'Chờ nghiệm thu' and p_trang_thai_moi = 'Đã nghiệm thu - chờ thu tiền') or
      (v_don.trang_thai = 'Đã nghiệm thu - chờ thu tiền' and p_trang_thai_moi = 'Đã đóng')
    ) then
      raise exception 'Không được chuyển trạng thái từ "%" sang "%"', v_don.trang_thai, p_trang_thai_moi;
    end if;
  else
    if v_don.trang_thai in ('Đã đóng', 'Đã hủy') then
      raise exception 'Đơn đã "%" không thể hủy', v_don.trang_thai;
    end if;
    if p_ly_do_huy is null or length(trim(p_ly_do_huy)) = 0 then
      raise exception 'Bắt buộc nhập lý do khi hủy đơn (nguyên tắc bắt buộc tại Mục 6.2)';
    end if;
  end if;

  if p_trang_thai_moi = 'Đang thi công' then
    select exists (select 1 from bao_gia where ma_don = p_ma_don and khach_xac_nhan = true)
      into v_co_bao_gia_xac_nhan;
    if not v_co_bao_gia_xac_nhan and not (p_xac_nhan_khan_cap and v_vai_tro in ('Quản lý', 'Admin')) then
      raise exception 'Chưa có báo giá được khách xác nhận — không thể chuyển "Đang thi công" (nguyên tắc 2), trừ khi Quản lý/Admin xác nhận xử lý an toàn khẩn cấp.';
    end if;
  end if;

  if p_trang_thai_moi = 'Đã đóng' then
    select exists (select 1 from bao_gia where ma_don = p_ma_don and khach_xac_nhan = true)
      into v_co_bao_gia_xac_nhan;
    select exists (select 1 from nghiem_thu where ma_don = p_ma_don and khach_xac_nhan = true)
      into v_co_nghiem_thu_xac_nhan;
    select cong_no into v_cong_no from v_don_hang where ma_don = p_ma_don;

    if v_don.qui_mo = 'Sửa nhanh' and not v_co_bao_gia_xac_nhan then
      raise exception 'Chưa có báo giá được khách xác nhận — không thể đóng đơn (nguyên tắc 8).';
    end if;
    if v_don.qui_mo = 'Sửa nhanh' and not v_co_nghiem_thu_xac_nhan then
      raise exception 'Chưa có nghiệm thu được khách xác nhận — không thể đóng đơn (nguyên tắc 8).';
    end if;
    if coalesce(v_cong_no, 0) <> 0 then
      raise exception 'Công nợ còn %, chưa thu đủ tiền — không thể đóng đơn (nguyên tắc 8).', v_cong_no;
    end if;
  end if;

  update don_hang
    set trang_thai = p_trang_thai_moi,
        ly_do_tu_choi_huy = case when p_trang_thai_moi = 'Đã hủy' then p_ly_do_huy else ly_do_tu_choi_huy end,
        ngay_dong_don = case when p_trang_thai_moi = 'Đã đóng' then current_date else ngay_dong_don end
    where ma_don = p_ma_don
    returning * into v_don;

  return v_don;
end; $$;

comment on function f_chuyen_trang_thai_don is 'Chuyển trạng thái có phân quyền (Quản lý/Admin/CSKH-Điều phối/đúng Thợ); Sửa nhanh cần báo giá và nghiệm thu xác nhận, Công trình bỏ qua; đóng đơn luôn cần công nợ bằng 0.';
