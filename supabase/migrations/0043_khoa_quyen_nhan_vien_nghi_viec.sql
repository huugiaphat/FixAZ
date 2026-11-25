-- Chạy riêng trên database hiện có, sau các migration trước đó.
-- Thu hồi quyền dữ liệu ngay cả khi nhân viên đã nghỉ vẫn giữ access token
-- còn hạn. Hai hàm này là nguồn vai trò/mã nhân viên cho RLS và các RPC.

begin;

create or replace function public.f_ma_nv_hien_tai() returns text
language sql stable security definer set search_path = public as $$
  select ma_nv from public.nhan_vien
  where auth_user_id = auth.uid() and trang_thai <> 'Đã nghỉ việc';
$$;

create or replace function public.f_vai_tro_hien_tai() returns public.vai_tro_enum
language sql stable security definer set search_path = public as $$
  select vai_tro_app from public.nhan_vien
  where auth_user_id = auth.uid() and trang_thai <> 'Đã nghỉ việc';
$$;

comment on function public.f_ma_nv_hien_tai() is
  'Không trả mã nhân viên khi hồ sơ đã nghỉ việc; chặn quyền sở hữu riêng trong RLS/RPC.';
comment on function public.f_vai_tro_hien_tai() is
  'Không trả vai trò khi hồ sơ đã nghỉ việc; chặn quyền theo vai trò trong RLS/RPC.';

-- Khóa thêm thao tác sửa tài khoản Admin qua kết nối trực tiếp bằng
-- phiên Quản lý. Server Action cũng kiểm tra trước khi dùng service_role.
create or replace function public.f_chan_tu_phong_admin() returns trigger
language plpgsql as $$
declare
  v_lien_quan_admin boolean := new.vai_tro_app = 'Admin';
begin
  if tg_op = 'UPDATE' then
    v_lien_quan_admin := v_lien_quan_admin or old.vai_tro_app = 'Admin';
  end if;
  if auth.uid() is not null
     and public.f_vai_tro_hien_tai() is distinct from 'Admin'
     and v_lien_quan_admin then
    raise exception 'Chỉ Admin được gán hoặc sửa tài khoản Admin.';
  end if;
  return new;
end; $$;

-- Một số danh mục trước đây mở SELECT cho mọi tài khoản authenticated.
-- Thu hẹp chúng cho nhân viên còn làm/nghỉ phép; người nghỉ việc không
-- được đọc qua access token cũ.
drop policy if exists p_active_vat_tu_select on public.vat_tu;
create policy p_active_vat_tu_select on public.vat_tu as restrictive
  for select to authenticated using (public.f_ma_nv_hien_tai() is not null);

drop policy if exists p_active_bang_gia_select on public.bang_gia_dich_vu;
create policy p_active_bang_gia_select on public.bang_gia_dich_vu as restrictive
  for select to authenticated using (public.f_ma_nv_hien_tai() is not null);

drop policy if exists p_active_danh_muc_select on public.danh_muc;
create policy p_active_danh_muc_select on public.danh_muc as restrictive
  for select to authenticated using (public.f_ma_nv_hien_tai() is not null);

drop policy if exists p_active_cau_hinh_select on public.cau_hinh_he_thong;
create policy p_active_cau_hinh_select on public.cau_hinh_he_thong as restrictive
  for select to authenticated using (public.f_ma_nv_hien_tai() is not null);

-- Bucket ảnh hiện là public nên URL ảnh đã biết vẫn truy cập được.
-- Chặn tài khoản đã nghỉ tải thêm/xóa ảnh bằng access token cũ.
drop policy if exists p_storage_anh_don_hang_insert on storage.objects;
create policy p_storage_anh_don_hang_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'anh-don-hang' and public.f_ma_nv_hien_tai() is not null
  );

drop policy if exists p_storage_anh_don_hang_delete on storage.objects;
create policy p_storage_anh_don_hang_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'anh-don-hang' and owner = auth.uid()
    and public.f_ma_nv_hien_tai() is not null
  );

commit;
