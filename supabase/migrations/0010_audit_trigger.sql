-- =====================================================================
-- 0010: Audit trail chung (nguyên tắc 4 — mọi đơn phải có dấu vết,
-- không cho phép xóa lịch sử thao tác).
-- Hàm chạy SECURITY DEFINER nên vẫn ghi được audit_log dù client
-- (authenticated) không có quyền INSERT trực tiếp vào bảng này —
-- xem REVOKE ở 0012 để đảm bảo audit_log chỉ có thể ghi qua trigger.
-- =====================================================================

create function f_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_khoa_col text := TG_ARGV[0];
  v_khoa text;
begin
  if TG_OP = 'DELETE' then
    v_khoa := (to_jsonb(old) ->> v_khoa_col);
  else
    v_khoa := (to_jsonb(new) ->> v_khoa_col);
  end if;

  insert into audit_log (bang, khoa_chinh, hanh_dong, du_lieu_truoc, du_lieu_sau, thuc_hien_boi)
  values (
    TG_TABLE_NAME,
    v_khoa,
    TG_OP,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    f_ma_nv_hien_tai()
  );

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end; $$;

create trigger trg_audit_nhan_vien after insert or update or delete on nhan_vien
  for each row execute function f_audit('ma_nv');
create trigger trg_audit_khach_hang after insert or update or delete on khach_hang
  for each row execute function f_audit('ma_kh');
create trigger trg_audit_don_hang after insert or update or delete on don_hang
  for each row execute function f_audit('ma_don');
create trigger trg_audit_chi_tiet_don after insert or update or delete on chi_tiet_don
  for each row execute function f_audit('ma_dong');
create trigger trg_audit_bao_gia after insert or update or delete on bao_gia
  for each row execute function f_audit('ma_bg');
create trigger trg_audit_phat_sinh after insert or update or delete on phat_sinh
  for each row execute function f_audit('ma_ps');
create trigger trg_audit_dieu_phoi after insert or update or delete on dieu_phoi
  for each row execute function f_audit('ma_dp');
create trigger trg_audit_nghiem_thu after insert or update or delete on nghiem_thu
  for each row execute function f_audit('ma_nt');
create trigger trg_audit_thu_tien after insert or update or delete on thu_tien
  for each row execute function f_audit('ma_thu');
create trigger trg_audit_vat_tu after insert or update or delete on vat_tu
  for each row execute function f_audit('ma_vt');
create trigger trg_audit_xuat_nhap_kho after insert or update or delete on xuat_nhap_kho
  for each row execute function f_audit('ma_xn');
create trigger trg_audit_bao_hanh after insert or update or delete on bao_hanh
  for each row execute function f_audit('ma_bh');
create trigger trg_audit_kpi_nhan_vien after insert or update or delete on kpi_nhan_vien
  for each row execute function f_audit('ma_kpi');
create trigger trg_audit_khieu_nai after insert or update or delete on khieu_nai
  for each row execute function f_audit('ma_kn');
create trigger trg_audit_bang_gia_dich_vu after insert or update or delete on bang_gia_dich_vu
  for each row execute function f_audit('ma_dv');
