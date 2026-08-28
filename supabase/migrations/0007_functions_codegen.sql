-- =====================================================================
-- 0007: Hàm tiện ích dùng chung + sinh mã tự động cho các khóa chính
-- Các định dạng có nêu rõ trong tài liệu được tuân thủ đúng:
--   NV-001, KH-000001, SC-YYMMDD-XXX (reset theo ngày),
--   BG-YYMMDD-XXX, PS-YYMMDD-XXX (reset theo ngày).
-- Các khóa không nêu định dạng cụ thể dùng PREFIX-000001 tăng dần.
-- =====================================================================

-- Bộ đếm nguyên tử theo khóa (tránh trùng/khoảng trống khi nhiều
-- người tạo đơn cùng lúc — an toàn concurrency nhờ UPSERT nguyên tử).
create table bo_dem_ma (
  khoa text primary key,
  gia_tri bigint not null default 0
);

create function f_sinh_so(p_khoa text) returns bigint
language sql security definer set search_path = public as $$
  insert into bo_dem_ma (khoa, gia_tri) values (p_khoa, 1)
  on conflict (khoa) do update set gia_tri = bo_dem_ma.gia_tri + 1
  returning gia_tri;
$$;

-- Nhân viên hiện tại (theo tài khoản Supabase Auth đang đăng nhập)
create function f_ma_nv_hien_tai() returns text
language sql stable security definer set search_path = public as $$
  select ma_nv from nhan_vien where auth_user_id = auth.uid();
$$;

create function f_vai_tro_hien_tai() returns vai_tro_enum
language sql stable security definer set search_path = public as $$
  select vai_tro_app from nhan_vien where auth_user_id = auth.uid();
$$;

-- ---- Sinh mã cho từng bảng ----

create function f_ma_nv_moi() returns text language plpgsql as $$
begin
  return 'NV-' || lpad(f_sinh_so('NV')::text, 3, '0');
end; $$;

create function f_ma_kh_moi() returns text language plpgsql as $$
begin
  return 'KH-' || lpad(f_sinh_so('KH')::text, 6, '0');
end; $$;

create function f_ma_don_moi() returns text language plpgsql as $$
declare v_ngay text := to_char(now(), 'YYMMDD'); v_so bigint;
begin
  v_so := f_sinh_so('SC-' || v_ngay);
  return 'SC-' || v_ngay || '-' || lpad(v_so::text, 3, '0');
end; $$;

create function f_ma_bg_moi() returns text language plpgsql as $$
declare v_ngay text := to_char(now(), 'YYMMDD'); v_so bigint;
begin
  v_so := f_sinh_so('BG-' || v_ngay);
  return 'BG-' || v_ngay || '-' || lpad(v_so::text, 3, '0');
end; $$;

create function f_ma_ps_moi() returns text language plpgsql as $$
declare v_ngay text := to_char(now(), 'YYMMDD'); v_so bigint;
begin
  v_so := f_sinh_so('PS-' || v_ngay);
  return 'PS-' || v_ngay || '-' || lpad(v_so::text, 3, '0');
end; $$;

create function f_ma_generic_moi(p_prefix text) returns text language plpgsql as $$
begin
  return p_prefix || '-' || lpad(f_sinh_so(p_prefix)::text, 6, '0');
end; $$;

-- ---- Trigger tự sinh khóa chính + trường tự động khi INSERT ----

create function f_bi_nhan_vien() returns trigger language plpgsql as $$
begin
  if new.ma_nv is null then new.ma_nv := f_ma_nv_moi(); end if;
  return new;
end; $$;
create trigger trg_bi_nhan_vien before insert on nhan_vien
  for each row execute function f_bi_nhan_vien();

create function f_bi_khach_hang() returns trigger language plpgsql as $$
begin
  if new.ma_kh is null then new.ma_kh := f_ma_kh_moi(); end if;
  if new.nguoi_tao is null then new.nguoi_tao := f_ma_nv_hien_tai(); end if;
  return new;
end; $$;
create trigger trg_bi_khach_hang before insert on khach_hang
  for each row execute function f_bi_khach_hang();

create function f_bi_don_hang() returns trigger language plpgsql as $$
begin
  if new.ma_don is null then new.ma_don := f_ma_don_moi(); end if;
  if new.nguoi_tiep_nhan is null then new.nguoi_tiep_nhan := f_ma_nv_hien_tai(); end if;
  return new;
end; $$;
create trigger trg_bi_don_hang before insert on don_hang
  for each row execute function f_bi_don_hang();

create function f_bi_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;
create trigger trg_don_hang_updated_at before update on don_hang
  for each row execute function f_bi_updated_at();
create trigger trg_nhan_vien_updated_at before update on nhan_vien
  for each row execute function f_bi_updated_at();

create function f_bi_chi_tiet_don() returns trigger language plpgsql as $$
begin
  if new.ma_dong is null then new.ma_dong := f_ma_generic_moi('CTD'); end if;
  return new;
end; $$;
create trigger trg_bi_chi_tiet_don before insert on chi_tiet_don
  for each row execute function f_bi_chi_tiet_don();

create function f_bi_bao_gia() returns trigger language plpgsql as $$
begin
  if new.ma_bg is null then new.ma_bg := f_ma_bg_moi(); end if;
  if new.nguoi_lap is null then new.nguoi_lap := f_ma_nv_hien_tai(); end if;
  if new.phien_ban is null or new.phien_ban = 1 then
    select coalesce(max(phien_ban), 0) + 1 into new.phien_ban from bao_gia where ma_don = new.ma_don;
  end if;
  return new;
end; $$;
create trigger trg_bi_bao_gia before insert on bao_gia
  for each row execute function f_bi_bao_gia();

create function f_bi_phat_sinh() returns trigger language plpgsql as $$
begin
  if new.ma_ps is null then new.ma_ps := f_ma_ps_moi(); end if;
  return new;
end; $$;
create trigger trg_bi_phat_sinh before insert on phat_sinh
  for each row execute function f_bi_phat_sinh();

create function f_bi_dieu_phoi() returns trigger language plpgsql as $$
begin
  if new.ma_dp is null then new.ma_dp := f_ma_generic_moi('DP'); end if;
  return new;
end; $$;
create trigger trg_bi_dieu_phoi before insert on dieu_phoi
  for each row execute function f_bi_dieu_phoi();

create function f_bi_nghiem_thu() returns trigger language plpgsql as $$
begin
  if new.ma_nt is null then new.ma_nt := f_ma_generic_moi('NT'); end if;
  return new;
end; $$;
create trigger trg_bi_nghiem_thu before insert on nghiem_thu
  for each row execute function f_bi_nghiem_thu();

create function f_bi_thu_tien() returns trigger language plpgsql as $$
begin
  if new.ma_thu is null then new.ma_thu := f_ma_generic_moi('THU'); end if;
  if new.nguoi_thu is null then new.nguoi_thu := f_ma_nv_hien_tai(); end if;
  return new;
end; $$;
create trigger trg_bi_thu_tien before insert on thu_tien
  for each row execute function f_bi_thu_tien();

create function f_bi_vat_tu() returns trigger language plpgsql as $$
begin
  if new.ma_vt is null then new.ma_vt := f_ma_generic_moi('VT'); end if;
  return new;
end; $$;
create trigger trg_bi_vat_tu before insert on vat_tu
  for each row execute function f_bi_vat_tu();

create function f_bi_xuat_nhap_kho() returns trigger language plpgsql as $$
begin
  if new.ma_xn is null then new.ma_xn := f_ma_generic_moi('XN'); end if;
  if new.nguoi_thuc_hien is null then new.nguoi_thuc_hien := f_ma_nv_hien_tai(); end if;
  return new;
end; $$;
create trigger trg_bi_xuat_nhap_kho before insert on xuat_nhap_kho
  for each row execute function f_bi_xuat_nhap_kho();

create function f_bi_bao_hanh() returns trigger language plpgsql as $$
begin
  if new.ma_bh is null then new.ma_bh := f_ma_generic_moi('BH'); end if;
  return new;
end; $$;
create trigger trg_bi_bao_hanh before insert on bao_hanh
  for each row execute function f_bi_bao_hanh();

create function f_bi_kpi_nhan_vien() returns trigger language plpgsql as $$
begin
  if new.ma_kpi is null then new.ma_kpi := f_ma_generic_moi('KPI'); end if;
  return new;
end; $$;
create trigger trg_bi_kpi_nhan_vien before insert on kpi_nhan_vien
  for each row execute function f_bi_kpi_nhan_vien();

create function f_bi_khieu_nai() returns trigger language plpgsql as $$
begin
  if new.ma_kn is null then new.ma_kn := f_ma_generic_moi('KN'); end if;
  return new;
end; $$;
create trigger trg_bi_khieu_nai before insert on khieu_nai
  for each row execute function f_bi_khieu_nai();

create function f_bi_bang_gia_dich_vu() returns trigger language plpgsql as $$
begin
  if new.ma_dv is null then new.ma_dv := f_ma_generic_moi('DV'); end if;
  return new;
end; $$;
create trigger trg_bi_bang_gia_dich_vu before insert on bang_gia_dich_vu
  for each row execute function f_bi_bang_gia_dich_vu();
