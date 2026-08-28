"use server";

import { requireNhanVien } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuanHoaSdt } from "@/lib/format";
import type { VaiTro, DichVu, TrangThaiNhanVien } from "@/types/database";

function sinhMatKhauTam(): string {
  return `Hgp${Math.random().toString(36).slice(2, 8)}!${Math.floor(Math.random() * 100)}`;
}

interface TaoNhanVienInput {
  ho_ten: string;
  email: string;
  chuc_vu: string;
  vai_tro_app: VaiTro;
  sdt: string;
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
  const matKhauTam = sinhMatKhauTam();

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
    sdt: chuanHoaSdt(input.sdt),
    ky_nang: input.ky_nang || null,
    khu_vuc_phu_trach: input.khu_vuc_phu_trach || null,
    trang_thai: "Đang làm" satisfies TrangThaiNhanVien,
  });

  if (errNv) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    const loi = errNv.code === "23505" && errNv.message.includes("nhan_vien_sdt_unique")
      ? "Số điện thoại này đã được dùng cho 1 nhân viên khác."
      : errNv.message;
    return { ok: false, loi };
  }

  return { ok: true, matKhauTam };
}

interface SuaNhanVienInput {
  ho_ten: string;
  email: string;
  chuc_vu: string;
  vai_tro_app: VaiTro;
  sdt: string;
  ky_nang?: DichVu;
  khu_vuc_phu_trach?: string;
}

function loiRangBuocDuyNhat(message: string): string | null {
  if (message.includes("nhan_vien_sdt_unique")) return "Số điện thoại này đã được dùng cho 1 nhân viên khác.";
  if (message.includes("nhan_vien_email_key")) return "Email này đã được dùng cho 1 nhân viên khác.";
  return null;
}

// Sửa thông tin nhân viên (Mục 6.12) — email vẫn là định danh gốc của
// tài khoản Supabase Auth nên khi đổi email phải đồng bộ sang cả
// auth.users, không chỉ bảng nhan_vien.
export async function suaNhanVien(maNv: string, input: SuaNhanVienInput): Promise<{ ok: boolean; loi?: string }> {
  await requireNhanVien(["Quản lý"]);

  const admin = createAdminClient();
  const { data: nvHienTai } = await admin.from("nhan_vien").select("auth_user_id, email").eq("ma_nv", maNv).single();
  if (!nvHienTai) return { ok: false, loi: "Không tìm thấy nhân viên." };

  if (nvHienTai.auth_user_id && input.email !== nvHienTai.email) {
    const { error: errAuth } = await admin.auth.admin.updateUserById(nvHienTai.auth_user_id, { email: input.email });
    if (errAuth) return { ok: false, loi: errAuth.message };
  }

  const { error: errNv } = await admin
    .from("nhan_vien")
    .update({
      ho_ten: input.ho_ten,
      email: input.email,
      chuc_vu: input.chuc_vu,
      vai_tro_app: input.vai_tro_app,
      sdt: chuanHoaSdt(input.sdt),
      ky_nang: input.ky_nang || null,
      khu_vuc_phu_trach: input.khu_vuc_phu_trach || null,
    })
    .eq("ma_nv", maNv);

  if (errNv) {
    return { ok: false, loi: (errNv.code === "23505" && loiRangBuocDuyNhat(errNv.message)) || errNv.message };
  }

  return { ok: true };
}

// Xóa hẳn nhân viên (khác với "Đánh dấu nghỉ việc" — chỉ dùng cho tài
// khoản tạo nhầm/chưa từng phát sinh nghiệp vụ). Các bảng nghiệp vụ
// (đơn hàng, thu tiền, kho...) đều references nhan_vien không kèm
// on delete cascade, nên Postgres sẽ tự chặn (lỗi 23503) nếu nhân
// viên đã có dữ liệu liên quan — báo người dùng dùng "Đánh dấu nghỉ
// việc" thay vì cố xóa.
export async function xoaNhanVien(maNv: string): Promise<{ ok: boolean; loi?: string }> {
  const nvHienTai = await requireNhanVien(["Quản lý"]);
  if (nvHienTai.ma_nv === maNv) {
    return { ok: false, loi: "Không thể tự xóa tài khoản của chính mình." };
  }

  const admin = createAdminClient();
  const { data: nv } = await admin.from("nhan_vien").select("auth_user_id").eq("ma_nv", maNv).single();
  if (!nv) return { ok: false, loi: "Không tìm thấy nhân viên." };

  const { error: errXoa } = await admin.from("nhan_vien").delete().eq("ma_nv", maNv);
  if (errXoa) {
    const loi = errXoa.code === "23503"
      ? "Không thể xóa: nhân viên này đã có dữ liệu nghiệp vụ liên quan (đơn hàng/thu tiền/kho...). Hãy dùng nút \"Đánh dấu nghỉ việc\" thay vì xóa."
      : errXoa.message;
    return { ok: false, loi };
  }

  if (nv.auth_user_id) await admin.auth.admin.deleteUser(nv.auth_user_id);

  return { ok: true };
}

// Quản lý đặt lại mật khẩu giúp nhân viên quên mật khẩu — không có
// luồng tự khôi phục (app không dùng email cho luồng nghiệp vụ, chỉ
// đăng nhập bằng SĐT), nên đây là cách duy nhất để lấy lại quyền
// truy cập, cùng cơ chế với lúc tạo tài khoản mới.
export async function datLaiMatKhau(maNv: string): Promise<{ ok: boolean; matKhauTam?: string; loi?: string }> {
  await requireNhanVien(["Quản lý"]);

  const admin = createAdminClient();
  const { data: nv } = await admin.from("nhan_vien").select("auth_user_id").eq("ma_nv", maNv).single();
  if (!nv?.auth_user_id) return { ok: false, loi: "Không tìm thấy tài khoản đăng nhập của nhân viên này." };

  const matKhauTam = sinhMatKhauTam();
  const { error } = await admin.auth.admin.updateUserById(nv.auth_user_id, { password: matKhauTam });
  if (error) return { ok: false, loi: error.message };

  return { ok: true, matKhauTam };
}
