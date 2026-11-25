import { NutDangXuat } from "@/components/nav/nut-dang-xuat";

export default function TrangTaiKhoanBiKhoa() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-semibold">Tài khoản đã bị khóa</h1>
      <p className="max-w-sm text-muted-foreground">
        Tài khoản của bạn đã được đánh dấu nghỉ việc. Liên hệ Quản lý hoặc Admin nếu cần kích hoạt lại.
      </p>
      <NutDangXuat chiMayNay className="rounded-lg border px-4 py-2" />
    </main>
  );
}
