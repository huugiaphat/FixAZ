"use server";

import { requireNhanVien } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VaiTro, DichVu, TrangThaiNhanVien } from "@/types/database";

interface TaoNhanVienInput {
  ho_ten: string;
  email: string;
  chuc_vu: string;
  vai_tro_app: VaiTro;
  sdt?: string;
  ky_nang?: DichVu;
  khu_vuc_phu_trach?: string;
}

// Chỉ Quản lý mới được tạo tài khoản nhân viên (Mục 6.12). Việc tạo
// tài khoản Supabase Auth cần service role key — bắt buộc chạy ở
// server, không thể làm từ client (Mục Prohibited actions: tạo tài
// khoản không lộ thông tin đăng nhập ra client ngoài mật khẩu tạm 1
// lần hiển thị cho Quản lý tự gửi cho nhân viên).
export async function taoNhanVien(input: TaoNhanVienInput): Promise<{ ok: boolean; matKhauTam?: string; loi?: string }> {
  const nv = await requireNhanVien(["Quản lý"]);
  void nv;

  const admin = createAdminClient();
  const matKhauTam = `Hgp${Math.random().toString(36).slice(2, 8)}!${Math.floor(Math.random() * 100)}`;

  const { data: authUser, error: errAuth } = await admin.auth.admin.createUser({
    email: input.email,
    password: matKhauTam,
    email_confirm: true,
  });
  if (errAuth || !authUser.user) {
    return { ok: false, loi: errAuth?.message ?? "Không tạo được tài khoản đăng nhập" };
  }

  const { error: errNv } = await admin.from("nhan_vien").insert({
    auth_user_id: authUser.user.id,
    ho_ten: input.ho_ten,
    email: input.email,
    chuc_vu: input.chuc_vu,
    vai_tro_app: input.vai_tro_app,
    sdt: input.sdt || null,
    ky_nang: input.ky_nang || null,
    khu_vuc_phu_trach: input.khu_vuc_phu_trach || null,
    trang_thai: "Đang làm" satisfies TrangThaiNhanVien,
  });

  if (errNv) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { ok: false, loi: errNv.message };
  }

  return { ok: true, matKhauTam };
}
