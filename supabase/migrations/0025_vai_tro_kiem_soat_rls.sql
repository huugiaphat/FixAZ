-- =====================================================================
-- 0025: Cấp quyền SELECT-only cho vai trò "Kiểm soát" trên mọi bảng
-- nghiệp vụ (thêm vào toàn bộ policy SELECT hiện có), và cố tình KHÔNG
-- đụng tới bất kỳ policy INSERT/UPDATE/DELETE nào — role không nằm
-- trong policy ghi ⇒ bị RLS từ chối hoàn toàn (đúng nguyên tắc "mặc định
-- từ chối" đã nêu ở đầu 0012). Vài bảng chỉ đọc chung (vat_tu,
-- bang_gia_dich_vu, danh_muc, cau_hinh_he_thong) đã "using (true)" nên
-- không cần sửa. thong_bao/push_subscriptions là dữ liệu riêng từng
-- nhân viên (không phải 1 "tab" xem chung) nên cũng không đụng tới.
--
-- Ngoài RLS, hàm f_chuyen_trang_thai_don() là SECURITY DEFINER và được
-- GRANT EXECUTE cho toàn bộ "authenticated" (mọi vai trò dùng chung 1
-- Postgres role) — nó chạy vượt qua RLS UPDATE của don_hang, nên trước
-- giờ về mặt kỹ thuật MỌI vai trò (kể cả Kho/Kế toán) đều có thể gọi
-- thẳng RPC này để đổi trạng thái đơn dù giao diện không hiện nút. Bản
-- vá này thêm gác kiểm tra vai trò NGAY TRONG hàm (khớp đúng điều kiện
-- của p_don_update ở 0012) để đảm bảo "Kiểm soát" — và đúng ra là mọi
-- vai trò không được phép — không thể lách qua RLS bằng cách gọi RPC
-- trực tiếp.
-- =====================================================================

drop policy p_nv_select on nhan_vien;
create policy p_nv_select on nhan_vien for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kiểm soát') or auth_user_id = auth.uid()
);

drop policy p_kh_select on khach_hang;
create policy p_kh_select on khach_hang for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kiểm soát')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_kh(ma_kh))
);

drop policy p_don_select on don_hang;
create policy p_don_select on don_hang for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kho', 'Kiểm soát')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);

drop policy p_ctd_select on chi_tiet_don;
create policy p_ctd_select on chi_tiet_don for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kho', 'Kiểm soát')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);

drop policy p_bg_select on bao_gia;
create policy p_bg_select on bao_gia for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kiểm soát')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);

drop policy p_ps_select on phat_sinh;
create policy p_ps_select on phat_sinh for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kiểm soát')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);

drop policy p_dp_select on dieu_phoi;
create policy p_dp_select on dieu_phoi for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kiểm soát')
  or (f_vai_tro_hien_tai() = 'Thợ' and tho = f_ma_nv_hien_tai())
);

drop policy p_nt_select on nghiem_thu;
create policy p_nt_select on nghiem_thu for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kiểm soát')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);

drop policy p_thu_select on thu_tien;
create policy p_thu_select on thu_tien for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kiểm soát')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);

drop policy p_xn_select on xuat_nhap_kho;
create policy p_xn_select on xuat_nhap_kho for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho', 'Kiểm soát')
  or (f_vai_tro_hien_tai() = 'Thợ' and (nguoi_thuc_hien = f_ma_nv_hien_tai() or (ma_don is not null and f_la_tho_cua_don(ma_don))))
);

drop policy p_bh_select on bao_hanh;
create policy p_bh_select on bao_hanh for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kiểm soát')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don_cu))
);

drop policy p_kpi_select on kpi_nhan_vien;
create policy p_kpi_select on kpi_nhan_vien for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kiểm soát') or ma_nv = f_ma_nv_hien_tai()
);

drop policy p_kn_select on khieu_nai;
create policy p_kn_select on khieu_nai for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kiểm soát')
  or nguoi_xu_ly = f_ma_nv_hien_tai()
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);

drop policy p_ycdv_select on yeu_cau_dich_vu;
create policy p_ycdv_select on yeu_cau_dich_vu for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kiểm soát')
);

drop policy p_thu_chi_select on thu_chi;
create policy p_thu_chi_select on thu_chi for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kế toán', 'Kiểm soát')
);

-- ---------------------------------------------------------------------
-- Gác vai trò trong f_chuyen_trang_thai_don() — khớp đúng điều kiện
-- p_don_update (0012): Quản lý, CSKH-Điều phối, hoặc đúng Thợ phụ trách
-- đơn đó. Toàn bộ thân hàm giữ nguyên y hệt 0009, chỉ thêm đoạn kiểm
-- tra vai trò ngay sau khi lấy v_vai_tro.
-- ---------------------------------------------------------------------
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
    v_vai_tro in ('Quản lý', 'CSKH-Điều phối')
    or (v_vai_tro = 'Thợ' and f_la_tho_cua_don(p_ma_don))
  ) then
    raise exception 'Vai trò % không có quyền chuyển trạng thái đơn hàng.', v_vai_tro;
  end if;

  -- Đồ thị chuyển trạng thái hợp lệ (rút gọn từ quy trình 17 bước, Mục 4)
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

  -- Nguyên tắc 2: không thi công nếu chưa có báo giá được khách xác
  -- nhận, trừ khi Quản lý xác nhận xử lý an toàn khẩn cấp.
  if p_trang_thai_moi = 'Đang thi công' then
    select exists (select 1 from bao_gia where ma_don = p_ma_don and khach_xac_nhan = true)
      into v_co_bao_gia_xac_nhan;
    if not v_co_bao_gia_xac_nhan and not (p_xac_nhan_khan_cap and v_vai_tro = 'Quản lý') then
      raise exception 'Chưa có báo giá được khách xác nhận — không thể chuyển "Đang thi công" (nguyên tắc 2), trừ khi Quản lý xác nhận xử lý an toàn khẩn cấp.';
    end if;
  end if;

  -- Nguyên tắc 8: đóng đơn cần đủ báo giá xác nhận + nghiệm thu xác
  -- nhận + công nợ = 0.
  if p_trang_thai_moi = 'Đã đóng' then
    select exists (select 1 from bao_gia where ma_don = p_ma_don and khach_xac_nhan = true)
      into v_co_bao_gia_xac_nhan;
    select exists (select 1 from nghiem_thu where ma_don = p_ma_don and khach_xac_nhan = true)
      into v_co_nghiem_thu_xac_nhan;
    select cong_no into v_cong_no from v_don_hang where ma_don = p_ma_don;

    if not v_co_bao_gia_xac_nhan then
      raise exception 'Chưa có báo giá được khách xác nhận — không thể đóng đơn (nguyên tắc 8).';
    end if;
    if not v_co_nghiem_thu_xac_nhan then
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

comment on function f_chuyen_trang_thai_don is 'Cổng chuyển trạng thái Đơn hàng duy nhất — enforce nguyên tắc 2 và 8 (Mục 5), cùng gác vai trò khớp p_don_update (0025). Nghiệm thu chỉ được phép ghi Thu tiền khi nghiem_thu.khach_xac_nhan = true, xem check ở f_bi_thu_tien_kiem_tra.';
