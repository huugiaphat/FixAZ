"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Copy } from "lucide-react";
import { datLaiMatKhau } from "@/app/(app)/quan-tri/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export function NutDatLaiMatKhau({ maNv, hoTen, sdt }: { maNv: string; hoTen: string; sdt: string | null }) {
  const [open, setOpen] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [matKhauMoi, setMatKhauMoi] = useState<string | null>(null);

  async function xacNhan() {
    setDangXuLy(true);
    const ketQua = await datLaiMatKhau(maNv);
    setDangXuLy(false);
    if (!ketQua.ok) {
      toast.error(`Không đặt lại được: ${ketQua.loi}`);
      return;
    }
    setMatKhauMoi(ketQua.matKhauTam!);
  }

  function dong() {
    setOpen(false);
    setMatKhauMoi(null);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dong())}>
      <DialogTrigger render={<Button size="icon" variant="ghost" />}>
        <KeyRound className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        {matKhauMoi ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Đã đặt lại mật khẩu</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Gửi mật khẩu tạm này cho nhân viên qua kênh riêng tư (không gửi qua nơi công khai). Nhân viên nên đổi mật khẩu sau khi đăng nhập.
            </p>
            <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
              <p><span className="text-muted-foreground">SĐT đăng nhập:</span> <span className="font-medium">{sdt}</span></p>
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">Mật khẩu tạm:</span>
                <span className="font-mono font-medium">{matKhauMoi}</span>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(matKhauMoi); toast.success("Đã sao chép mật khẩu"); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </p>
            </div>
            <Button className="w-full" onClick={dong}>Đóng</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Đặt lại mật khẩu cho "{hoTen}"?</DialogTitle>
              <DialogDescription>
                Hệ thống sẽ sinh 1 mật khẩu tạm mới, mật khẩu cũ sẽ không còn dùng được. Dùng khi nhân viên quên mật khẩu.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={dangXuLy}>Hủy</Button>
              <Button onClick={xacNhan} disabled={dangXuLy}>
                {dangXuLy ? "Đang xử lý…" : "Đặt lại mật khẩu"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
