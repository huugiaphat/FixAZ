# Hữu Gia Phát — bản đồ ứng dụng để tiếp tục phát triển

> Cập nhật theo **mã nguồn trong workspace ngày 25/11/2026**. Đây là tài liệu định hướng nhanh, không phải bản xuất dữ liệu production. Những mục ghi “theo trao đổi trước” chưa được kiểm tra lại trên Hostinger/Supabase/GitHub trong ngày này.

## 1. Đọc nhanh trong một phút

- **Ứng dụng chính:** `https://app.huugiaphat.com`, theo trao đổi trước được triển khai từ GitHub lên **Hostinger Web Hosting có hỗ trợ Node.js**.
- **Mã nguồn:** repo `https://github.com/huugiaphat/FixAZ`, nhánh `main`. Tại thời điểm lập tài liệu, commit mới nhất trong workspace là `40a063a` (thêm loại **Thuế** cho chi tiết đơn).
- **Domain Vercel cũ:** `https://huu-gia-phat-app.vercel.app`; `src/proxy.ts` chuyển các trang trên domain này sang cùng đường dẫn ở domain chính bằng HTTP 308. Mã QR cũ trỏ tới `/yeu-cau` vẫn dùng đường chuyển hướng này. `/api/*` trên Vercel đang được miễn chuyển hướng.
- **Dữ liệu:** Supabase project ref `fsjtjscpnmrsztyomyzg` (PostgreSQL, Auth, Storage, API/RLS). Hai nơi chạy app dùng chung dữ liệu **nếu** biến kết nối của mỗi nơi trỏ về cùng project; cấu hình Hostinger thực tế cần kiểm tra trong hPanel.
- **Khách gửi yêu cầu:** trang công khai `/yeu-cau` → Server Action → bảng `yeu_cau_dich_vu` → thông báo cho Quản lý/Admin/CSKH-Điều phối.
- **Công việc đang dở:** kết nối Zalo OA bằng Dynamic API. File API đã được viết **trong working tree nhưng chưa commit/push**, chưa xác nhận cấu hình Hostinger/Zalo, chưa thử luồng thực tế. Xem mục 10.

## 2. Công nghệ và thư mục quan trọng

| Thành phần | Hiện có trong repo |
| --- | --- |
| Web | Next.js `16.3.3` App Router, React `19.2.8`, TypeScript, Tailwind CSS 4, shadcn với `@base-ui/react` |
| Dữ liệu và đăng nhập | `@supabase/supabase-js`, `@supabase/ssr`, PostgreSQL; quyền theo vai trò bằng RLS |
| Form và kiểm tra dữ liệu | React Hook Form, Zod; schema ở `src/lib/schemas/` |
| PWA và ngoại tuyến | `public/manifest.json`, `public/sw.js`, Dexie/IndexedDB, hàng đợi ở `src/lib/offline/` |
| Thông báo | Bảng `thong_bao`, Web Push/VAPID, API cron, GitHub Actions |
| Mã nguồn giao diện | `src/app/` (route), `src/components/`, `src/lib/`, `src/types/database.ts` |
| Database | `supabase/migrations/0001`–`0037`, file gộp `supabase/chay_toan_bo_migrations.sql` chỉ dành cho DB trống |
| Cấu hình | `.env.local.example`, `next.config.ts`, `vercel.json`, `.github/workflows/` |

Chạy local: `npm ci` → tạo `.env.local` từ `.env.local.example` và điền biến thật → `npm run dev`. Kiểm tra kiểu: `npx tsc --noEmit`; build: `npm run build`. **Trước khi sửa mã Next.js**, đọc hướng dẫn tương ứng trong `node_modules/next/dist/docs/` theo `AGENTS.md`.

`README.md`/`SETUP.md` có thông tin cũ (ví dụ số migration, cách chạy cron); ưu tiên mã nguồn và workflow hiện tại. Không chạy `supabase/seed/seed.sql` hoặc `npm run seed:demo` trên dữ liệu thật.

## 3. Nhà cung cấp và luồng truy cập

```text
GitHub (mã nguồn main)
  ├─> Hostinger: app.huugiaphat.com (app chính, theo trao đổi trước)
  └─> Vercel: huu-gia-phat-app.vercel.app
         └─> 308 sang app.huugiaphat.com (trang và mã QR cũ)

Khách / nhân viên -> app.huugiaphat.com -> Supabase (DB + Auth + Storage)
GitHub Actions -> app.huugiaphat.com/api/notifications/check (mỗi 15 phút)
GitHub Actions -> Supabase PostgreSQL (pg_dump hằng ngày)
```

`src/proxy.ts` xử lý domain cũ, còn `src/lib/supabase/middleware.ts` kiểm tra phiên đăng nhập. Trang `/yeu-cau`, `/login` và một số API/asset được truy cập không cần phiên; các vùng nội bộ cần phiên. Chỉ cho phép truy cập route chưa đủ để ghi dữ liệu: quyền ghi còn được kiểm soát bởi RLS hoặc xác thực riêng ở API.

## 4. Vai trò và điều hướng

Vai trò: **Quản lý, Admin, CSKH-Điều phối, Thợ, Kế toán, Kho, Kiểm soát** (`src/types/database.ts`, `src/lib/nav-config.ts`). Quyền thực tế gồm **menu + `requireNhanVien(...)` ở route + điều kiện nút/form + RLS/RPC trong database**; sửa quyền phải rà đủ bốn lớp.

Menu chính dạng danh sách phẳng: **Trang chủ → Dashboard → Sổ thu chi → Đơn hàng → Yêu cầu dịch vụ → Khách hàng → Mẫu báo giá → [Kho vật tư chỉ cho vai trò Kho] → Bảo hành → Khiếu nại → KPI nhân viên → Quản trị**. Mỗi vai trò chỉ thấy các mục được phép. `Kho vật tư` nằm trong tab **Quản trị** cho Quản lý/Admin/Kiểm soát; nhân viên Kho có menu riêng. Trang `/nghiem-thu` vẫn tồn tại nhưng không có mục menu; tab Nghiệm thu nằm trong đơn hàng.

Admin được thiết kế có quyền Quản lý và thêm quyền xóa cứng đơn hàng/phiếu sổ thu chi (migrations `0029`–`0031`). Đợt sửa trước đã bổ sung Admin vào các điều kiện giao diện và người nhận thông báo. Đừng tự suy ra Admin được xóa các bảng khác hoặc được bỏ qua quy tắc nghiệp vụ.

## 5. Các màn hình và luồng nghiệp vụ

| Màn hình | Đường dẫn | Công việc chính |
| --- | --- | --- |
| Trang chủ | `/` | Chào người dùng, thẻ chức năng, đơn đang xử lý của Thợ |
| Dashboard | `/dashboard` | Chỉ số đơn/công trình, thu chi, doanh thu, vận hành, đội thợ; có ô **Đã hủy**; nhiều thống kê lấy tối đa 1.000 đơn gần nhất |
| Sổ thu chi | `/thu-chi` | Thu/chi theo ngày, loại, công trình; sửa/xóa theo quyền |
| Đơn hàng | `/don-hang`, `/don-hang/moi`, `/don-hang/[maDon]` | Tiếp nhận, báo giá, chi tiết BG, điều phối, phát sinh, nghiệm thu, thu tiền, đóng/hủy |
| Yêu cầu dịch vụ | `/yeu-cau-dich-vu` | CSKH xem/xử lý yêu cầu từ trang công khai; tạo khách/đơn; hiện QR cho Quản lý/Admin |
| Form khách | `/yeu-cau` | Công khai, không cần tài khoản; tên, địa chỉ, SĐT, nhóm dịch vụ, mô tả |
| Khách hàng | `/khach-hang`, `/khach-hang/[maKh]` | Hồ sơ và lịch sử khách |
| Mẫu báo giá | `/mau-bao-gia`, `/mau-bao-gia/[ma]`, route in | Tạo dòng báo giá, liên kết đơn, in |
| Kho | `/kho-vat-tu`, `/kho-vat-tu/[maVt]`; tab trong `/quan-tri` | Vật tư, tồn, nhập/xuất, giá |
| Khác | `/bao-hanh`, `/khieu-nai`, `/kpi`, `/quan-tri` | Chăm sóc sau sửa, khiếu nại, KPI, nhân viên/bảng giá/danh mục |

Chi tiết đơn phân biệt **Sửa nhanh** và **Công trình** (`qui_mo`). Giao diện Công trình chỉ hiển thị tab Chi tiết BG và Thu tiền; các tab còn lại hiển thị cho Sửa nhanh. RPC `f_chuyen_trang_thai_don` kiểm soát đổi trạng thái và quy tắc đóng đơn (xem migration `0028`/`0030`). Giá trị trạng thái gồm Mới tiếp nhận, Đã điều phối, Đang khảo sát, Chờ duyệt báo giá, Đang thi công, Chờ nghiệm thu, Đã nghiệm thu - chờ thu tiền, Đã đóng, Đã hủy.

**Bảng giá dịch vụ:** theo lần thay dữ liệu trước, có 95 dòng từ `gia new.pdf` (D01–D40, N01–N35, H01–H20), 11 nhóm; đây là thông tin từ lịch sử làm việc, **chưa kiểm tra lại số dòng trên DB hôm nay**. Bảng ở `/quan-tri` theo thứ tự cột **Dịch vụ – ĐVT – Đơn giá – Nhóm**. Nhóm đang cho chọn nằm ở `src/lib/schemas/danh-muc.ts`.

**Chi tiết BG:** loại `Dịch vụ`/`Vật tư` dùng danh sách có sẵn; `Thuế` nhập thủ công (`src/lib/schemas/chi-tiet-don.ts`, migration `0035`).

## 6. Dữ liệu và phân quyền database

Các migration định nghĩa **25 bảng public** (bao gồm bảng kỹ thuật `bo_dem_ma`, `audit_log`, `push_subscriptions`):

- Lõi: `nhan_vien`, `khach_hang`, `danh_muc`, `cau_hinh_he_thong`, `bo_dem_ma`.
- Đơn: `don_hang`, `chi_tiet_don`, `bao_gia`, `phat_sinh`, `dieu_phoi`, `nghiem_thu`, `thu_tien`, `mau_bao_gia`, `mau_bao_gia_dong`.
- Tài chính/kho: `thu_chi`, `vat_tu`, `xuat_nhap_kho`, `bang_gia_dich_vu`.
- Hậu mãi/vận hành: `yeu_cau_dich_vu`, `bao_hanh`, `khieu_nai`, `kpi_nhan_vien`, `thong_bao`, `push_subscriptions`, `audit_log`.

Các view tính toán gồm `v_don_hang`, `v_chi_tiet_don`, `v_vat_tu`, `v_kpi_nhan_vien`, `v_tong_hop_dashboard`, `v_thu_chi_tong_hop`, `v_mau_bao_gia`, `v_mau_bao_gia_dong`. **View mới phải bật `security_invoker = true`** để không vô tình vượt RLS (migration `0014`).

`thu_tien` tự tạo dòng `Thu` tương ứng trong `thu_chi` bằng trigger (migration `0020`). Dòng có `ma_thu` là dòng đồng bộ, không sửa/xóa trực tiếp tại Sổ thu chi. Migration `0032` sửa trigger xóa: `BEFORE DELETE` phải trả `OLD`; trả `NEW` sẽ âm thầm bỏ qua lệnh xóa. Khi dùng Supabase `.delete()`, nên xác nhận có hàng thực sự bị xóa, vì RLS có thể trả thành công với 0 hàng.

File `supabase/chay_toan_bo_migrations.sql` chỉ dành cho khởi tạo DB mới; **không chạy lại toàn bộ trên production**. Migration thêm giá trị enum cần chạy và commit xong trước khi ghi dữ liệu sử dụng giá trị mới. Thay đổi schema trong repo không tự áp dụng lên Supabase theo các workflow hiện có.

`src/types/database.ts` có các kiểu viết tay; hiện `NhomDichVu` vẫn chỉ ghi `Điện | Nước`, `LoaiHangMuc` chỉ ghi `Dịch vụ | Vật tư`, trong khi schema/form đã mở rộng. Khi sửa phần này, đối chiếu migration và dữ liệu thật; cân nhắc sinh lại kiểu từ DB.

## 7. Ảnh, thông báo, ngoại tuyến

- Ảnh đơn hàng nằm ở Supabase Storage bucket `anh-don-hang` (migration `0013`), bucket **public**, upload cần đăng nhập. Ảnh được nén ở `src/lib/upload-anh.ts`.
- Thông báo nội bộ dùng `thong_bao`; Web Push dùng `push_subscriptions`, VAPID và `src/lib/push/`. `src/lib/notifications.ts` tạo thông báo và gửi push. GitHub Actions gọi API `/api/notifications/check` mỗi 15 phút bằng secret.
- PWA đăng ký Service Worker ở **production**; ở dev tự gỡ SW/cache cũ (`src/components/service-worker-register.tsx`). Các thao tác có dùng `saveOrQueue` được lưu tạm bằng Dexie khi mất mạng và đồng bộ lại; **không mặc định coi mọi thao tác/ảnh upload đều hỗ trợ offline**.

## 8. Sao lưu, vận hành và biến môi trường

`.github/workflows/database-backup.yml`: chạy hằng ngày lúc **02:00 giờ Việt Nam**, cài `postgresql-client-17`, dùng `pg_dump` qua Supabase pooler, upload artifact giữ **30 ngày**; có thể chạy tay qua GitHub Actions. Theo trao đổi trước đã có một lần chạy thành công, nhưng **chưa kiểm tra lịch chạy gần đây, tính đầy đủ của file dump hoặc thử khôi phục**. `pg_dump` sao lưu PostgreSQL; **file ảnh trong Storage cần phương án sao lưu riêng**.

Các biến quan trọng (chỉ ghi **tên**, không lưu giá trị vào tài liệu):

| Tên | Nơi dùng |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kết nối Supabase từ client/server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Action/API có quyền quản trị, không đưa ra client |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push |
| `CRON_SECRET` | Xác thực API kiểm tra thông báo |
| `SUPABASE_DB_PASSWORD` | GitHub Actions sao lưu database |
| `ZALO_DYNAMIC_API_SECRET` | **Dự kiến** xác thực Dynamic API Zalo; chưa xác nhận đã cấu hình production |

Giữ bí mật trong Hostinger/GitHub Secrets/.env.local; `.env.local` được gitignore. Mật khẩu DB từng được dán vào lịch sử chat, nên cần **đổi mật khẩu đó và cập nhật secret sao lưu** khi có dịp kiểm tra bảo mật; không sao chép mật khẩu cũ vào file này.

## 9. Thao tác an toàn khi tiếp tục phát triển

1. Kiểm tra `git status` trước khi sửa; không đưa PDF tham khảo hoặc `.env.local` vào commit nếu không được yêu cầu.
2. Với Next.js 16.3.3, đọc tài liệu trong `node_modules/next/dist/docs/` cho route/proxy/API cần sửa (xem `AGENTS.md`).
3. Sửa quyền: đối chiếu menu, route, nút/form và RLS/RPC. Đặc biệt kiểm tra Admin song song với Quản lý.
4. Sửa dữ liệu: viết migration mới, cập nhật file gộp nếu phù hợp, triển khai schema rồi mới sử dụng từ giao diện. Không chạy lại migration đã chạy trên production.
5. Kiểm tra `npx tsc --noEmit`, build khi thay đổi có rủi ro, rồi thử đường đi thực tế trên domain chính; push GitHub **không chứng minh** Hostinger đã deploy xong.
6. Đối chiếu backup/khôi phục trước những lần thay dữ liệu hàng loạt. Tránh xóa dữ liệu thật để thử luồng.

## 10. Trạng thái tích hợp Zalo OA (công việc gần nhất)

Mục tiêu người dùng: lấy **tên Zalo + nội dung tin nhắn thô** từ chatbox Zalo OA, tạo một yêu cầu trong ứng dụng để nhân viên liên hệ sau. Người dùng đã chọn **Dynamic API** của luồng chat, thay cho webhook chung. OA App ID/Secret Key đã có theo trao đổi; chưa cần ghi các khóa đó vào repo.

Hiện trong working tree có `src/app/api/zalo/yeu-cau/route.ts`, chỉnh sửa `src/lib/supabase/middleware.ts` và `.env.local.example`. API nháp nhận POST JSON, kiểm tra header `x-zalo-secret`, rồi gọi lại Server Action của form `/yeu-cau`. **Điểm chưa khớp yêu cầu:** schema form hiện bắt buộc `ho_ten`, `dia_chi`, `sdt`, `dich_vu`, `yeu_cau`; Zalo chỉ có tên + nội dung chat thì API nháp sẽ từ chối. Chưa có nguồn `Zalo OA` hoặc ID tin nhắn để chống tạo trùng; chưa kiểm tra định dạng request/response Zalo Dynamic API, chưa chạy thử end-to-end.

**Không push nguyên trạng API nháp lên production.** Trước khi tiếp tục, quyết định cách lưu yêu cầu thiếu SĐT/địa chỉ (nên hỗ trợ dữ liệu thiếu một cách rõ ràng trong DB và UI, không dùng dữ liệu giả), xác thực request, xử lý gọi lặp, cấu hình biến môi trường Hostinger, rồi test với một luồng OA thực. Header secret nháp được sinh trong phiên trước; nếu đã dán/chia sẻ ở nơi khác thì tạo secret mới.

## 11. Nguồn để tra nhanh

- Menu/vai trò: `src/lib/nav-config.ts`, `src/lib/auth.ts`, `src/types/database.ts`.
- Domain/phiên: `src/proxy.ts`, `src/lib/supabase/middleware.ts`.
- Yêu cầu công khai: `src/app/yeu-cau/`, `src/lib/schemas/yeu-cau-dich-vu.ts`, `src/components/yeu-cau/the-yeu-cau.tsx`.
- Đơn hàng: `src/app/(app)/don-hang/`, `src/components/don-hang/`, migrations `0003`, `0009`, `0028`, `0030`.
- Tài chính: `src/app/(app)/thu-chi/`, migrations `0019`, `0020`, `0027`, `0030`–`0032`.
- Bảng giá/kho: `src/app/(app)/quan-tri/page.tsx`, `src/app/(app)/kho-vat-tu/`, migrations `0033`–`0035`.
- Sao lưu/cron: `.github/workflows/database-backup.yml`, `.github/workflows/notifications-cron.yml`.

## 12. Thay đổi đang chuẩn bị: duyệt phiếu thu chi

Theo xác nhận của người dùng, migration `0036_duyet_phieu_thu_chi.sql` đã chạy thành công trên Supabase ngày 25/11/2026. Phiếu nhập tay có trạng thái chờ/đã duyệt; người lập được sửa trước duyệt; Admin được sửa/xóa cả trước lẫn sau duyệt và là người duy nhất được duyệt hoặc “Không duyệt” để xóa phiếu chờ duyệt. Dòng tự đồng bộ từ `thu_tien` tiếp tục bất biến và không tham gia quy trình duyệt. Phiếu cũ không lưu tài khoản lập thật nên migration tạm gán `nguoi_lap = nguoi_tao`; nếu trước đây nhập hộ, cần kiểm tra lại người được quyền sửa. Trước khi áp dụng `0037`, các tổng thu/chi và Dashboard vẫn tính cả phiếu chờ duyệt.

## 13. Đang chuẩn bị: sổ thu chi theo tháng và phân trang

Migration `0037_so_thu_chi_phan_trang.sql` và giao diện mới **chưa xác nhận đã áp dụng trên Supabase/Hostinger**. Khi chạy migration, mọi phiếu nhập tay còn chờ duyệt tại thời điểm đó được đánh dấu là dữ liệu cũ đã duyệt (`duyet_du_lieu_cu = true`) và ghi nhận thời điểm chuyển đổi, không gán cho Admin cụ thể; phiếu tạo sau migration vẫn chờ Admin duyệt. Sổ mặc định tháng hiện tại, 25 phiếu/trang, lọc/tìm kiếm ở database, tổng hợp toàn bộ kết quả lọc bằng RPC. Phiếu chờ duyệt không vào tổng thu/chi chính thức và Dashboard; dòng tự đồng bộ vẫn được tính. Chỉ chạy file migration riêng sau `0036`, không chạy lại file gộp.
