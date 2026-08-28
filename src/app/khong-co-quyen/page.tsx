import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TrangKhongCoQuyen() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-semibold">Bạn không có quyền truy cập trang này</h1>
      <p className="text-muted-foreground max-w-sm">
        Chức năng này không thuộc phạm vi vai trò tài khoản của bạn. Liên hệ Quản lý nếu bạn cho rằng đây là nhầm lẫn.
      </p>
      <Button render={<Link href="/" />}>Về trang chủ</Button>
    </main>
  );
}
