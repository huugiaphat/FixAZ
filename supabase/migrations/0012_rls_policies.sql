-- =====================================================================
-- 0012: Row-Level Security — ràng buộc phân quyền ở tầng dữ liệu
-- (Mục 2, Mục 10 "Bảo mật phân quyền ở tầng dữ liệu, không chỉ ẩn/hiện
-- trên giao diện"). Supabase ánh xạ MỌI vai trò vào cùng 1 Postgres
-- role "authenticated" — nên toàn bộ phân biệt Quản lý/CSKH-Điều
-- phối/Thợ/Kế toán/Kho phải nằm trong policy USING/WITH CHECK, gọi
-- f_vai_tro_hien_tai() / f_ma_nv_hien_tai() (SECURITY DEFINER, tra
-- cứu qua nhan_vien.auth_user_id = auth.uid()).
--
-- Nguyên tắc thiết kế: KHÔNG GRANT quyền SQL nào không cần dùng (VD
-- không GRANT DELETE cho bảng nghiệp vụ nào — không ai được xóa lịch
-- sử, đúng nguyên tắc 4). Không có policy cho thao tác nào ⇒ mặc định
-- từ chối hoàn toàn thao tác đó.
-- =====================================================================

grant usage on schema public to authenticated;

-- ---------------------------------------------------------------------
-- nhan_vien
-- ---------------------------------------------------------------------
alter table nhan_vien enable row level security;
grant select, insert, update on nhan_vien to authenticated;

create policy p_nv_select on nhan_vien for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối') or auth_user_id = auth.uid()
);
create policy p_nv_insert on nhan_vien for insert to authenticated with check (
  f_vai_tro_hien_tai() = 'Quản lý'
);
create policy p_nv_update on nhan_vien for update to authenticated using (
  f_vai_tro_hien_tai() = 'Quản lý'
) with check (
  f_vai_tro_hien_tai() = 'Quản lý'
);

-- ---------------------------------------------------------------------
-- khach_hang
-- ---------------------------------------------------------------------
alter table khach_hang enable row level security;
grant select, insert, update on khach_hang to authenticated;

create policy p_kh_select on khach_hang for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_kh(ma_kh))
);
create policy p_kh_insert on khach_hang for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')     -- nguyên tắc 6
);
create policy p_kh_update on khach_hang for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);

-- ---------------------------------------------------------------------
-- don_hang  (yêu cầu bắt buộc: Thợ chỉ thấy đơn được điều phối cho mình)
-- ---------------------------------------------------------------------
alter table don_hang enable row level security;
grant select, insert, update on don_hang to authenticated;

create policy p_don_select on don_hang for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kho')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_don_insert on don_hang for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')     -- nguyên tắc 6 — Thợ không có quyền tạo đơn
);
create policy p_don_update on don_hang for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
-- Lưu ý: đổi trang_thai qua UPDATE trực tiếp đã bị trigger
-- trg_don_hang_chan_doi_thang (0009) chặn tuyệt đối — mọi vai trò kể
-- cả Quản lý đều phải gọi RPC f_chuyen_trang_thai_don().

-- ---------------------------------------------------------------------
-- chi_tiet_don
-- ---------------------------------------------------------------------
alter table chi_tiet_don enable row level security;
grant select, insert, update on chi_tiet_don to authenticated;

create policy p_ctd_select on chi_tiet_don for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán', 'Kho')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_ctd_write on chi_tiet_don for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);
create policy p_ctd_update on chi_tiet_don for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);

-- ---------------------------------------------------------------------
-- bao_gia
-- ---------------------------------------------------------------------
alter table bao_gia enable row level security;
grant select, insert, update on bao_gia to authenticated;

create policy p_bg_select on bao_gia for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_bg_insert on bao_gia for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_bg_update on bao_gia for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);

-- ---------------------------------------------------------------------
-- phat_sinh
-- ---------------------------------------------------------------------
alter table phat_sinh enable row level security;
grant select, insert, update on phat_sinh to authenticated;

create policy p_ps_select on phat_sinh for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_ps_insert on phat_sinh for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_ps_update on phat_sinh for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);

-- ---------------------------------------------------------------------
-- dieu_phoi
-- ---------------------------------------------------------------------
alter table dieu_phoi enable row level security;
grant select, insert, update on dieu_phoi to authenticated;

create policy p_dp_select on dieu_phoi for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and tho = f_ma_nv_hien_tai())
);
create policy p_dp_insert on dieu_phoi for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);
create policy p_dp_update on dieu_phoi for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and tho = f_ma_nv_hien_tai())
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and tho = f_ma_nv_hien_tai())
);

-- ---------------------------------------------------------------------
-- nghiem_thu
-- ---------------------------------------------------------------------
alter table nghiem_thu enable row level security;
grant select, insert, update on nghiem_thu to authenticated;

create policy p_nt_select on nghiem_thu for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_nt_insert on nghiem_thu for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_nt_update on nghiem_thu for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);

-- ---------------------------------------------------------------------
-- thu_tien
-- ---------------------------------------------------------------------
alter table thu_tien enable row level security;
grant select, insert, update on thu_tien to authenticated;

create policy p_thu_select on thu_tien for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_thu_insert on thu_tien for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kế toán')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))    -- thu tiền tại chỗ
);
create policy p_thu_update on thu_tien for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kế toán')                    -- đối soát / đánh dấu đã nộp
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kế toán')
);

-- ---------------------------------------------------------------------
-- vat_tu
-- ---------------------------------------------------------------------
alter table vat_tu enable row level security;
grant select, insert, update on vat_tu to authenticated;

create policy p_vt_select on vat_tu for select to authenticated using (true);
create policy p_vt_insert on vat_tu for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho')
);
create policy p_vt_update on vat_tu for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho')
);

-- ---------------------------------------------------------------------
-- xuat_nhap_kho
-- ---------------------------------------------------------------------
alter table xuat_nhap_kho enable row level security;
grant select, insert, update on xuat_nhap_kho to authenticated;

create policy p_xn_select on xuat_nhap_kho for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho')
  or (f_vai_tro_hien_tai() = 'Thợ' and (nguoi_thuc_hien = f_ma_nv_hien_tai() or (ma_don is not null and f_la_tho_cua_don(ma_don))))
);
create policy p_xn_insert on xuat_nhap_kho for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho')
  or (f_vai_tro_hien_tai() = 'Thợ' and loai = 'Xuất' and ma_don is not null and f_la_tho_cua_don(ma_don))
);
create policy p_xn_update on xuat_nhap_kho for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'Kho')
);

-- ---------------------------------------------------------------------
-- bao_hanh
-- ---------------------------------------------------------------------
alter table bao_hanh enable row level security;
grant select, insert, update on bao_hanh to authenticated;

create policy p_bh_select on bao_hanh for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối', 'Kế toán')
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don_cu))
);
create policy p_bh_insert on bao_hanh for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);
create policy p_bh_update on bao_hanh for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);

-- ---------------------------------------------------------------------
-- kpi_nhan_vien
-- ---------------------------------------------------------------------
alter table kpi_nhan_vien enable row level security;
grant select, insert, update on kpi_nhan_vien to authenticated;

create policy p_kpi_select on kpi_nhan_vien for select to authenticated using (
  f_vai_tro_hien_tai() = 'Quản lý' or ma_nv = f_ma_nv_hien_tai()
);
create policy p_kpi_insert on kpi_nhan_vien for insert to authenticated with check (
  f_vai_tro_hien_tai() = 'Quản lý'
);
create policy p_kpi_update on kpi_nhan_vien for update to authenticated using (
  f_vai_tro_hien_tai() = 'Quản lý'
) with check (
  f_vai_tro_hien_tai() = 'Quản lý'
);

-- ---------------------------------------------------------------------
-- khieu_nai
-- ---------------------------------------------------------------------
alter table khieu_nai enable row level security;
grant select, insert, update on khieu_nai to authenticated;

create policy p_kn_select on khieu_nai for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
  or nguoi_xu_ly = f_ma_nv_hien_tai()
  or (f_vai_tro_hien_tai() = 'Thợ' and f_la_tho_cua_don(ma_don))
);
create policy p_kn_insert on khieu_nai for insert to authenticated with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);
create policy p_kn_update on khieu_nai for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối') or nguoi_xu_ly = f_ma_nv_hien_tai()
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối') or nguoi_xu_ly = f_ma_nv_hien_tai()
);

-- ---------------------------------------------------------------------
-- bang_gia_dich_vu, danh_muc — danh mục tham chiếu, đọc chung
-- ---------------------------------------------------------------------
alter table bang_gia_dich_vu enable row level security;
grant select, insert, update on bang_gia_dich_vu to authenticated;
create policy p_dv_select on bang_gia_dich_vu for select to authenticated using (true);
create policy p_dv_write on bang_gia_dich_vu for insert to authenticated with check (f_vai_tro_hien_tai() = 'Quản lý');
create policy p_dv_update on bang_gia_dich_vu for update to authenticated using (f_vai_tro_hien_tai() = 'Quản lý') with check (f_vai_tro_hien_tai() = 'Quản lý');

alter table danh_muc enable row level security;
grant select, insert, update on danh_muc to authenticated;
create policy p_dm_select on danh_muc for select to authenticated using (true);
create policy p_dm_write on danh_muc for insert to authenticated with check (f_vai_tro_hien_tai() = 'Quản lý');
create policy p_dm_update on danh_muc for update to authenticated using (f_vai_tro_hien_tai() = 'Quản lý') with check (f_vai_tro_hien_tai() = 'Quản lý');

-- Cấu hình hệ thống: đọc chung (trigger kiểm tra hạn mức giảm giá cần
-- đọc được dù người gọi là CSKH-Điều phối/Thợ), chỉ Quản lý được sửa.
alter table cau_hinh_he_thong enable row level security;
grant select, update on cau_hinh_he_thong to authenticated;
create policy p_ch_select on cau_hinh_he_thong for select to authenticated using (true);
create policy p_ch_update on cau_hinh_he_thong for update to authenticated using (f_vai_tro_hien_tai() = 'Quản lý') with check (f_vai_tro_hien_tai() = 'Quản lý');

-- ---------------------------------------------------------------------
-- thong_bao / push_subscriptions — dữ liệu riêng của từng nhân viên
-- ---------------------------------------------------------------------
alter table thong_bao enable row level security;
grant select, update on thong_bao to authenticated;   -- INSERT chỉ qua service_role (server tự động hóa, Mục 7)
create policy p_tb_select on thong_bao for select to authenticated using (
  nguoi_nhan = f_ma_nv_hien_tai() or f_vai_tro_hien_tai() = 'Quản lý'
);
create policy p_tb_update on thong_bao for update to authenticated using (
  nguoi_nhan = f_ma_nv_hien_tai()
) with check (
  nguoi_nhan = f_ma_nv_hien_tai()
);

alter table push_subscriptions enable row level security;
grant select, insert, update, delete on push_subscriptions to authenticated;
create policy p_push_all on push_subscriptions for all to authenticated using (
  ma_nv = f_ma_nv_hien_tai()
) with check (
  ma_nv = f_ma_nv_hien_tai()
);

-- ---------------------------------------------------------------------
-- audit_log — chỉ đọc (Quản lý), không cấp write cho bất kỳ ai; ghi
-- log chỉ diễn ra qua trigger f_audit() chạy SECURITY DEFINER.
-- ---------------------------------------------------------------------
alter table audit_log enable row level security;
grant select on audit_log to authenticated;
create policy p_audit_select on audit_log for select to authenticated using (
  f_vai_tro_hien_tai() = 'Quản lý'
);

-- bo_dem_ma: không cấp quyền trực tiếp cho client — chỉ được đụng tới
-- qua hàm f_sinh_so() (SECURITY DEFINER).
alter table bo_dem_ma enable row level security;
revoke all on bo_dem_ma from authenticated, anon;

grant execute on function f_chuyen_trang_thai_don(text, trang_thai_don_enum, text, boolean) to authenticated;
