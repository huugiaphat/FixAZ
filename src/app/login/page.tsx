"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dangNhapBangSdt } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold">
            HGP
          </div>
          <CardTitle className="text-xl">Hữu Gia Phát</CardTitle>
          <CardDescription>Quản lý dịch vụ sửa chữa điện nước</CardDescription>
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
            {loi ? <p className="text-sm text-destructive">{loi}</p> : null}
            <Button type="submit" className="w-full h-11 text-base" disabled={dangXuLy}>
              {dangXuLy ? "Đang đăng nhập…" : "Đăng nhập"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Quên mật khẩu? Liên hệ Quản lý để được đặt lại.
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
