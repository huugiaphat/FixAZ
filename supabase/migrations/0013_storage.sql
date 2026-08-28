-- =====================================================================
-- 0013: Supabase Storage — bucket lưu ảnh (hiện trạng, phát sinh,
-- nghiệm thu) theo Mục 10 "Lưu trữ và hiển thị ảnh... có nén ảnh hợp
-- lý". Việc nén ảnh trước khi upload thực hiện ở client (xem
-- src/lib/upload-anh.ts) để tiết kiệm băng thông trên mạng yếu.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('anh-don-hang', 'anh-don-hang', true)
on conflict (id) do nothing;

-- Đọc công khai (ảnh không phải dữ liệu nhạy cảm, cần load nhanh trên
-- di động qua CDN) — chỉ nhân viên đăng nhập mới có URL vì đường dẫn
-- nằm trong dữ liệu đơn hàng vốn đã được RLS bảo vệ.
create policy p_storage_anh_don_hang_select on storage.objects for select to public using (
  bucket_id = 'anh-don-hang'
);

create policy p_storage_anh_don_hang_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'anh-don-hang'
);

create policy p_storage_anh_don_hang_delete on storage.objects for delete to authenticated using (
  bucket_id = 'anh-don-hang' and owner = auth.uid()
);
