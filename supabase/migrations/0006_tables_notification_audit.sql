-- =====================================================================
-- 0006: Bổ sung kỹ thuật ngoài 17 bảng gốc — cần thiết để đáp ứng
-- Mục 7 (Tự động hóa & thông báo) và nguyên tắc 4 (mọi đơn phải có
-- dấu vết / audit trail).
-- =====================================================================

-- Thông báo trong app (chuông thông báo + nguồn cho Web Push)
create table thong_bao (
  id uuid primary key default gen_random_uuid(),
  loai loai_thong_bao_enum not null,
  tieu_de text not null,
  noi_dung text,
  ma_don text references don_hang (ma_don),
  ma_vt text references vat_tu (ma_vt),
  nguoi_nhan text not null references nhan_vien (ma_nv),
  da_doc boolean not null default false,
  da_gui_push boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table thong_bao is 'Log thông báo tự động (Mục 7) — nguồn cho chuông thông báo trong app và trigger gửi Web Push.';
create index idx_thong_bao_nguoi_nhan on thong_bao (nguoi_nhan, da_doc);

-- Đăng ký nhận Web Push theo từng nhân viên/thiết bị
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  ma_nv text not null references nhan_vien (ma_nv) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

comment on table push_subscriptions is 'VAPID Web Push subscription — 1 nhân viên có thể có nhiều thiết bị (đăng nhập nhiều thiết bị theo Mục 10).';
create index idx_push_subscriptions_nv on push_subscriptions (ma_nv);

-- Nhật ký thao tác (nguyên tắc 4) — không cho phép UPDATE/DELETE, chỉ INSERT
-- (thực thi bằng RLS ở 0012, không cấp quyền update/delete cho bất kỳ role nào).
create table audit_log (
  id bigint generated always as identity primary key,
  bang text not null,
  khoa_chinh text not null,
  hanh_dong text not null,                              -- INSERT / UPDATE / DELETE
  du_lieu_truoc jsonb,
  du_lieu_sau jsonb,
  thuc_hien_boi text references nhan_vien (ma_nv),
  thoi_gian timestamptz not null default now()
);

comment on table audit_log is 'Audit trail phục vụ nguyên tắc 4 — ghi tự động qua trigger generic ở 0010, không cho sửa/xóa.';
create index idx_audit_log_bang_khoa on audit_log (bang, khoa_chinh);
