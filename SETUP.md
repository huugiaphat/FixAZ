# Hướng dẫn kết nối Supabase & chạy dự án

## 1. Tạo dự án Supabase (miễn phí)
1. Vào https://supabase.com → **New project**.
2. Đặt tên (VD `huu-gia-phat`), chọn mật khẩu database, chọn region gần Việt Nam (Singapore).
3. Đợi vài phút để project khởi tạo xong.

## 2. Lấy thông tin kết nối
Vào **Project Settings → API**, copy:
- `Project URL` → dán vào `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → dán vào `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key (bấm Reveal) → dán vào `SUPABASE_SERVICE_ROLE_KEY` (**giữ bí mật, không commit/không lộ ra client**)

Sao chép `.env.local.example` thành `.env.local` rồi điền 3 giá trị trên.

## 3. Áp dụng schema database
Cách đơn giản nhất (không cần cài Supabase CLI): vào **SQL Editor** trên dashboard Supabase → **New query**, mở file `supabase/chay_toan_bo_migrations.sql` (đã gộp sẵn toàn bộ 13 migration theo đúng thứ tự), dán toàn bộ nội dung vào và bấm **Run** — 1 lần duy nhất là xong. Sau đó chạy tiếp `supabase/seed/seed.sql` (dữ liệu demo, tùy chọn).

Cách khác (khuyến nghị nếu quen dòng lệnh) — dùng Supabase CLI:
```bash
npx supabase login
npx supabase link --project-ref <project-ref-trong-url-dashboard>
npx supabase db push
```

## 4. Sinh khóa Web Push (VAPID)
```bash
npx web-push generate-vapid-keys
```
Dán `Public Key` vào `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `Private Key` vào `VAPID_PRIVATE_KEY`.

## 5. Tạo tài khoản demo để test 5 vai trò
Sau khi đã điền đủ `.env.local` và chạy xong migrations:
```bash
npm run seed:demo
```
Script tạo 5 tài khoản (mật khẩu chung: `HgpDemo@123`):
- `quanly@demo.huugiaphat.vn` — Quản lý
- `dieuphoi@demo.huugiaphat.vn` — CSKH-Điều phối
- `tho@demo.huugiaphat.vn` — Thợ
- `ketoan@demo.huugiaphat.vn` — Kế toán
- `kho@demo.huugiaphat.vn` — Kho

## 6. Chạy ứng dụng
```bash
npm run dev
```
Mở http://localhost:3000, đăng nhập bằng 1 trong 5 tài khoản demo ở trên.

## 7. (Tùy chọn) Bật cron thông báo tự động khi deploy Vercel
`vercel.json` đã cấu hình sẵn cron gọi `/api/notifications/check` mỗi 15 phút. Chỉ cần đặt biến môi trường `CRON_SECRET` (một chuỗi ngẫu nhiên) trên Vercel — Vercel Cron sẽ tự gửi kèm header xác thực đúng chuẩn.
