-- Migration 0036: chạy riêng trên database hiện có, không chạy lại file SQL tổng hợp.
-- Phiếu nhập tay: người lập sửa khi chờ duyệt; Admin sửa/xóa trước và sau
-- duyệt, đồng thời là người duy nhất duyệt hoặc từ chối (xóa).
-- Dòng đồng bộ từ thu_tien
-- không tham gia quy trình này và tiếp tục không được sửa/xóa trực tiếp.

alter table thu_chi
  add column nguoi_lap text references nhan_vien (ma_nv),
  add column da_duyet boolean not null default false,
  add column nguoi_duyet text references nhan_vien (ma_nv),
  add column duyet_luc timestamptz,
  add constraint chk_thu_chi_duyet_hop_le check (
    (da_duyet = false and nguoi_duyet is null and duyet_luc is null)
    or (da_duyet = true and nguoi_duyet is not null and duyet_luc is not null and ma_thu is null)
  );

-- Trước đây chỉ có "người thu chi" (có thể chọn hộ người khác), không lưu
-- tài khoản thực sự tạo phiếu. Gán tạm cho người thu chi của phiếu cũ;
-- không thể khôi phục chính xác người lập nếu đã chọn hộ.
update thu_chi set nguoi_lap = nguoi_tao where ma_thu is null;

create or replace function f_bi_thu_chi() returns trigger language plpgsql as $$
begin
  if new.ma_tc is null then new.ma_tc := f_ma_generic_moi('TC'); end if;
  if new.nguoi_tao is null then new.nguoi_tao := f_ma_nv_hien_tai(); end if;
  -- Không tin nguoi_lap/duyệt do client gửi: gắn với tài khoản đăng nhập.
  if auth.uid() is not null then new.nguoi_lap := f_ma_nv_hien_tai(); end if;
  new.da_duyet := false;
  new.nguoi_duyet := null;
  new.duyet_luc := null;
  return new;
end; $$;

drop policy p_thu_chi_update on thu_chi;
drop policy p_admin_tc_update on thu_chi;
create policy p_thu_chi_update on thu_chi for update to authenticated using (
  ma_thu is null and
  (f_vai_tro_hien_tai() = 'Admin' or
   (not da_duyet and f_vai_tro_hien_tai() in ('Quản lý', 'Kế toán') and nguoi_lap = f_ma_nv_hien_tai()))
) with check (
  ma_thu is null and (f_vai_tro_hien_tai() = 'Admin' or
  (f_vai_tro_hien_tai() in ('Quản lý', 'Kế toán') and
   not da_duyet and nguoi_lap = f_ma_nv_hien_tai()))
);

-- DELETE vẫn chỉ cấp cho Admin ở 0030; dòng tự đồng bộ không được xóa.
drop policy p_admin_tc_delete on thu_chi;
create policy p_admin_tc_delete on thu_chi for delete to authenticated using (
  f_vai_tro_hien_tai() = 'Admin' and ma_thu is null
);

-- Thay hàm trigger hiện có (0032) để chặn cả truy cập vượt RLS, ví dụ
-- service-role, và để việc duyệt là một thao tác nguyên tử ở database.
create or replace function f_chan_sua_thu_chi_dong_bo() returns trigger language plpgsql as $$
declare
  v_nguoi_hien_tai text := f_ma_nv_hien_tai();
  v_la_admin boolean := coalesce(f_vai_tro_hien_tai() = 'Admin', false);
begin
  if tg_op = 'DELETE' then
    if old.ma_thu is not null then
      raise exception 'Dòng tự đồng bộ từ Thu tiền không thể xóa trực tiếp.';
    end if;
    if not v_la_admin then
      raise exception 'Chỉ Admin được xóa phiếu thu chi.';
    end if;
    return old;
  end if;

  if old.ma_thu is not null then
    raise exception 'Dòng tự đồng bộ từ Thu tiền không thể sửa/duyệt trực tiếp.';
  end if;
  if new.ma_tc is distinct from old.ma_tc or
     new.created_at is distinct from old.created_at then
    raise exception 'Không thể đổi mã phiếu hoặc thời điểm tạo phiếu.';
  end if;
  if new.nguoi_lap is distinct from old.nguoi_lap then
    raise exception 'Không thể đổi người lập phiếu.';
  end if;

  if old.da_duyet then
    if not v_la_admin then
      raise exception 'Chỉ Admin được sửa phiếu đã duyệt.';
    end if;
    if not new.da_duyet or
       new.nguoi_duyet is distinct from old.nguoi_duyet or
       new.duyet_luc is distinct from old.duyet_luc then
      raise exception 'Không thể hủy duyệt hoặc thay đổi dấu vết duyệt phiếu.';
    end if;
    return new;
  end if;

  if new.da_duyet then
    if not v_la_admin then
      raise exception 'Chỉ Admin được duyệt phiếu thu chi.';
    end if;
    if (to_jsonb(new) - array['da_duyet', 'nguoi_duyet', 'duyet_luc'])
       is distinct from
       (to_jsonb(old) - array['da_duyet', 'nguoi_duyet', 'duyet_luc']) then
      raise exception 'Không thể sửa nội dung phiếu trong lần duyệt.';
    end if;
    new.nguoi_duyet := v_nguoi_hien_tai;
    new.duyet_luc := now();
    return new;
  end if;

  if not v_la_admin and
     (f_vai_tro_hien_tai() not in ('Quản lý', 'Kế toán') or
      v_nguoi_hien_tai is null or
      old.nguoi_lap is distinct from v_nguoi_hien_tai) then
    raise exception 'Chỉ người lập phiếu hoặc Admin được sửa khi chưa duyệt.';
  end if;
  if new.nguoi_duyet is not null or new.duyet_luc is not null then
    raise exception 'Không thể tự điền thông tin duyệt phiếu.';
  end if;
  return new;
end; $$;

create trigger trg_audit_thu_chi after insert or update or delete on thu_chi
  for each row execute function f_audit('ma_tc');
