import { createClient } from "@/lib/supabase/server";
import type { NhanVien, VaiTro } from "@/types/database";
import { redirect } from "next/navigation";

// Nhân viên hiện tại (theo tài khoản Supabase Auth) — dùng ở Server
// Component/Layout để cá nhân hóa Trang chủ (Mục 9) và điều hướng
// theo vai trò. Middleware đã đảm bảo có user đăng nhập trước khi
// vào layout (app), nên nếu không tìm thấy hồ sơ nhân_vien tương ứng
// nghĩa là tài khoản Auth chưa được Quản lý gán vào bảng nhân_vien.
export async function getCurrentNhanVien(): Promise<NhanVien | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("nhan_vien")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  return (data as NhanVien) ?? null;
}

export async function requireNhanVien(allowedRoles?: VaiTro[]): Promise<NhanVien> {
  const nv = await getCurrentNhanVien();
  if (!nv) {
    redirect("/login?loi=chua-lien-ket-tai-khoan");
  }
  if (allowedRoles && !allowedRoles.includes(nv.vai_tro_app)) {
    redirect("/khong-co-quyen");
  }
  return nv;
}
