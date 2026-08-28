"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { chuanHoaSdt } from "@/lib/format";

const LOI_CHUNG = "Số điện thoại hoặc mật khẩu không đúng.";

// Nhân viên đăng nhập bằng SĐT thay vì email (Mục 2 — tài khoản gắn
// theo vai trò). Supabase Auth vẫn lưu email làm định danh gốc; ở đây
// ta tra SĐT → email qua service role (bắt buộc vì người dùng chưa
// đăng nhập nên bị RLS chặn đọc bảng nhan_vien), rồi mới đăng nhập
// bằng email đó qua client gắn cookie để phiên đăng nhập được lưu.
export async function dangNhapBangSdt(sdt: string, matKhau: string): Promise<{ ok: boolean; loi?: string }> {
  const sdtChuanHoa = chuanHoaSdt(sdt);
  if (!sdtChuanHoa || !matKhau) return { ok: false, loi: LOI_CHUNG };

  const admin = createAdminClient();
  const { data: nv } = await admin
    .from("nhan_vien")
    .select("email")
    .eq("sdt", sdtChuanHoa)
    .maybeSingle();

  if (!nv) return { ok: false, loi: LOI_CHUNG };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: nv.email, password: matKhau });
  if (error) return { ok: false, loi: LOI_CHUNG };

  return { ok: true };
}
