// Tạo 5 tài khoản demo (1 tài khoản / vai trò) để kiểm thử ứng dụng —
// KHÔNG dùng cho môi trường thật. Chạy sau khi đã có .env.local với
// SUPABASE_SERVICE_ROLE_KEY hợp lệ và đã áp dụng xong migrations.
//
//   node scripts/seed-demo-users.mjs
//
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Nạp .env.local thủ công (script chạy bằng `node` thuần, không qua Next.js).
try {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {
  console.error("Không đọc được .env.local — hãy tạo file này trước (xem .env.local.example).");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey || url.includes("xxxxxxxxxxxx")) {
  console.error("Thiếu hoặc chưa điền NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const MAT_KHAU_DEMO = "HgpDemo@123";

const TAI_KHOAN_DEMO = [
  { email: "quanly@demo.huugiaphat.vn", sdt: "0901000001", ho_ten: "Nguyễn Văn Quản", chuc_vu: "Giám đốc", vai_tro_app: "Quản lý" },
  { email: "dieuphoi@demo.huugiaphat.vn", sdt: "0901000002", ho_ten: "Trần Thị Điều", chuc_vu: "Điều phối viên", vai_tro_app: "CSKH-Điều phối" },
  { email: "tho@demo.huugiaphat.vn", sdt: "0901000003", ho_ten: "Lê Văn Thợ", chuc_vu: "Thợ chính", vai_tro_app: "Thợ", ky_nang: "Điện & Nước" },
  { email: "ketoan@demo.huugiaphat.vn", sdt: "0901000004", ho_ten: "Phạm Thị Kế", chuc_vu: "Kế toán/Đối soát", vai_tro_app: "Kế toán" },
  { email: "kho@demo.huugiaphat.vn", sdt: "0901000005", ho_ten: "Hoàng Văn Kho", chuc_vu: "Kho/Mua hàng", vai_tro_app: "Kho" },
];

for (const tk of TAI_KHOAN_DEMO) {
  const { data: created, error: errAuth } = await admin.auth.admin.createUser({
    email: tk.email,
    password: MAT_KHAU_DEMO,
    email_confirm: true,
  });

  let authUserId = created?.user?.id;
  if (errAuth) {
    if (errAuth.message?.includes("already been registered") || errAuth.code === "email_exists") {
      const { data: list } = await admin.auth.admin.listUsers();
      authUserId = list.users.find((u) => u.email === tk.email)?.id;
      console.log(`~ Tài khoản Auth đã tồn tại: ${tk.email}`);
    } else {
      console.error(`✗ Lỗi tạo Auth user ${tk.email}:`, errAuth.message);
      continue;
    }
  } else {
    console.log(`✓ Đã tạo Auth user: ${tk.email}`);
  }

  const { error: errNv } = await admin.from("nhan_vien").upsert(
    {
      auth_user_id: authUserId,
      ho_ten: tk.ho_ten,
      chuc_vu: tk.chuc_vu,
      vai_tro_app: tk.vai_tro_app,
      email: tk.email,
      sdt: tk.sdt,
      ky_nang: tk.ky_nang ?? null,
      trang_thai: "Đang làm",
    },
    { onConflict: "email" },
  );
  if (errNv) console.error(`✗ Lỗi upsert nhan_vien ${tk.email}:`, errNv.message);
  else console.log(`✓ Đã liên kết hồ sơ nhân_vien: ${tk.email} (${tk.vai_tro_app})`);
}

console.log(`\nHoàn tất. Đăng nhập bằng SĐT (090100000<1-5>), mật khẩu demo cho cả 5 tài khoản: ${MAT_KHAU_DEMO}`);
