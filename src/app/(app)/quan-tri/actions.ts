"use server";

import { requireNhanVien } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuanHoaSdt } from "@/lib/format";
import type { VaiTro, KyNangNhanVien, TrangThaiNhanVien } from "@/types/database";

function sinhMatKhauTam(): string {
  return `Hgp${Math.random().toString(36).slice(2, 8)}!${Math.floor(Math.random() * 100)}`;
}

interface TaoNhanVienInput {
  ho_ten: string;
  email: string;
  chuc_vu: string;
  vai_tro_app: VaiTro;
  sdt: string;
  ky_nang?: KyNangNhanVien[];
  khu_vuc_phu_trach?: string;
}

// Chỉ Quản lý mới được tạo tài khoản nhân viên (Mục 6.12). Việc tạo
// tài khoản Supabase Auth cần service role key — bắt buộc chạy ở
// server, không thể làm từ client (Mục Prohibited actions: tạo tài
// khoản không lộ thông tin đăng nhập ra client ngoài mật khẩu tạm 1
// lần hiển thị cho Quản lý tự gửi cho nhân viên).
export async function taoNhanVien(input: TaoNhanVienInput): Promise<{ ok: boolean; matKhauTam?: string; loi?: string }> {
  const nv = await requireNhanVien(["Quản lý", "Admin"]);
  if (input.vai_tro_app === "Admin" && nv.vai_tro_app !== "Admin") {
    return { ok: false, loi: "Chỉ Admin được gán vai trò Admin." };
  }

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
    ky_nang: input.ky_nang ?? [],
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
  ky_nang?: KyNangNhanVien[];
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
  const nguoiThaoTac = await requireNhanVien(["Quản lý", "Admin"]);

  const admin = createAdminClient();
  const { data: nvHienTai } = await admin.from("nhan_vien").select("auth_user_id, email, vai_tro_app").eq("ma_nv", maNv).single();
  if (!nvHienTai) return { ok: false, loi: "Không tìm thấy nhân viên." };
  if (nguoiThaoTac.vai_tro_app !== "Admin" &&
      (input.vai_tro_app === "Admin" || nvHienTai.vai_tro_app === "Admin")) {
    return { ok: false, loi: "Chỉ Admin được gán hoặc sửa tài khoản Admin." };
  }
  if (nguoiThaoTac.ma_nv === maNv && nvHienTai.vai_tro_app === "Admin" && input.vai_tro_app !== "Admin") {
    return { ok: false, loi: "Admin không thể tự bỏ vai trò Admin của mình." };
  }

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
      ky_nang: input.ky_nang ?? [],
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
  const nvHienTai = await requireNhanVien(["Quản lý", "Admin"]);
  if (nvHienTai.ma_nv === maNv) {
    return { ok: false, loi: "Không thể tự xóa tài khoản của chính mình." };
  }

  const admin = createAdminClient();
  const { data: nv } = await admin.from("nhan_vien").select("auth_user_id, vai_tro_app").eq("ma_nv", maNv).single();
  if (!nv) return { ok: false, loi: "Không tìm thấy nhân viên." };
  if (nvHienTai.vai_tro_app !== "Admin" && nv.vai_tro_app === "Admin") {
    return { ok: false, loi: "Chỉ Admin được quản lý tài khoản Admin." };
  }

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
  const nguoiThaoTac = await requireNhanVien(["Quản lý", "Admin"]);

  const admin = createAdminClient();
  const { data: nv } = await admin.from("nhan_vien").select("auth_user_id, vai_tro_app").eq("ma_nv", maNv).single();
  if (!nv?.auth_user_id) return { ok: false, loi: "Không tìm thấy tài khoản đăng nhập của nhân viên này." };
  if (nguoiThaoTac.vai_tro_app !== "Admin" && nv.vai_tro_app === "Admin") {
    return { ok: false, loi: "Chỉ Admin được quản lý tài khoản Admin." };
  }

  const matKhauTam = sinhMatKhauTam();
  const { error } = await admin.auth.admin.updateUserById(nv.auth_user_id, { password: matKhauTam });
  if (error) return { ok: false, loi: error.message };

  return { ok: true, matKhauTam };
}

// Nghỉ việc phải khóa cả quyền dữ liệu lẫn đăng nhập. Server Action kiểm tra
// vai trò trước khi dùng service_role; nếu bước khóa Auth lỗi thì khôi phục
// trạng thái hồ sơ để hai nguồn không âm thầm lệch nhau.
export async function doiTrangThaiNhanVien(maNv: string): Promise<{ ok: boolean; loi?: string }> {
  const nguoiThaoTac = await requireNhanVien(["Quản lý", "Admin"]);
  if (nguoiThaoTac.ma_nv === maNv) {
    return { ok: false, loi: "Không thể tự khóa tài khoản của chính mình." };
  }

  const admin = createAdminClient();
  const { data: nv, error: loiDoc } = await admin.from("nhan_vien")
    .select("auth_user_id, vai_tro_app, trang_thai").eq("ma_nv", maNv).single();
  if (loiDoc || !nv) return { ok: false, loi: "Không tìm thấy nhân viên." };
  if (!nv.auth_user_id) return { ok: false, loi: "Nhân viên chưa có tài khoản đăng nhập để khóa/mở khóa." };
  if (nguoiThaoTac.vai_tro_app !== "Admin" && nv.vai_tro_app === "Admin") {
    return { ok: false, loi: "Chỉ Admin được quản lý tài khoản Admin." };
  }

  const trangThaiMoi: TrangThaiNhanVien = nv.trang_thai === "Đã nghỉ việc" ? "Đang làm" : "Đã nghỉ việc";
  const { error: loiLuu } = await admin.from("nhan_vien")
    .update({ trang_thai: trangThaiMoi }).eq("ma_nv", maNv).eq("trang_thai", nv.trang_thai)
    .select("ma_nv").single();
  if (loiLuu) return { ok: false, loi: "Trạng thái nhân viên đã thay đổi hoặc không thể lưu. Hãy tải lại trang." };

  const { error: loiAuth } = await admin.auth.admin.updateUserById(nv.auth_user_id, {
    ban_duration: trangThaiMoi === "Đã nghỉ việc" ? "876000h" : "none",
  });
  if (loiAuth) {
    const { error: loiKhoiPhuc } = await admin.from("nhan_vien")
      .update({ trang_thai: nv.trang_thai }).eq("ma_nv", maNv).eq("trang_thai", trangThaiMoi)
      .select("ma_nv").single();
    return { ok: false, loi: loiKhoiPhuc
      ? "Khóa đăng nhập thất bại và không khôi phục được trạng thái nhân viên. Cần Admin kiểm tra ngay."
      : `Không cập nhật được trạng thái đăng nhập: ${loiAuth.message}` };
  }
  return { ok: true };
}
