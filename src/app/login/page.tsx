"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { dangNhapBangSdt } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export default function TrangDangNhap() {
  const router = useRouter();
  const [sdt, setSdt] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, setDangXuLy] = useState(false);

  async function xuLyDangNhap(e: React.FormEvent) {
    e.preventDefault();
    setDangXuLy(true);
    setLoi(undefined);

    const ketQua = await dangNhapBangSdt(sdt, matKhau);

    if (!ketQua.ok) {
      setLoi(ketQua.loi);
      setDangXuLy(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="public-page flex items-center justify-center">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-card lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex"><div><p className="text-sm font-medium opacity-80">HỮU GIA PHÁT</p><h2 className="mt-12 text-4xl font-semibold leading-tight tracking-tight">Mọi công việc.<br />Một nơi quản lý.</h2><p className="mt-5 max-w-xs text-sm leading-7 opacity-85">Tiếp nhận yêu cầu, điều phối đội thợ và theo dõi thu chi công trình.</p></div><div className="mt-16 border-t border-white/25 pt-6 text-sm">Nhà cửa · Điện · Nước</div></section>
      <Card className="w-full rounded-none p-3 ring-0 sm:p-7">
        <CardHeader className="items-center text-center gap-2">
          <Image src="/logo.png" alt="Hữu Gia Phát" width={500} height={500} className="h-28 w-28 object-contain" priority />
          <h1 className="text-2xl font-semibold">Đăng nhập</h1>
          <CardDescription>Quản lý dịch vụ sửa nhà cửa, điện nước</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={xuLyDangNhap} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sdt">Số điện thoại</Label>
              <Input
                id="sdt"
                type="tel"
                inputMode="tel"
                placeholder="09xxxxxxxx"
                required
                autoComplete="username"
                value={sdt}
                onChange={(e) => setSdt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mat_khau">Mật khẩu</Label>
              <Input
                id="mat_khau"
                type="password"
                required
                autoComplete="current-password"
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
              />
            </div>
            {loi ? <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{loi}</p> : null}
            <Button type="submit" className="w-full h-11 text-base" disabled={dangXuLy}>
              {dangXuLy ? "Đang đăng nhập…" : "Đăng nhập"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Quên mật khẩu? Liên hệ Quản lý để được đặt lại.
            </p>
          </form>
        </CardContent>
      </Card>
      </div>
    </main>
  );
}
