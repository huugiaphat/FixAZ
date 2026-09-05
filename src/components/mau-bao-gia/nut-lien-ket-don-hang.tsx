"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChonDonHang } from "@/components/don-hang/chon-don-hang";

export function NutLienKetDonHang({ maMbg, maDonHienTai }: { maMbg: string; maDonHienTai: string | null }) {
  const [open, setOpen] = useState(false);
  const [maDon, setMaDon] = useState<string | undefined>(maDonHienTai ?? undefined);
  const [dangLuu, setDangLuu] = useState(false);
  const router = useRouter();

  async function luu(giaTri: string | null) {
    setDangLuu(true);
    const supabase = createClient();
    const { error } = await supabase.from("mau_bao_gia").update({ ma_don: giaTri }).eq("ma_mbg", maMbg);
    setDangLuu(false);
    if (error) {
      toast.error(`Không cập nhật được: ${error.message}`);
      return;
    }
    toast.success(giaTri ? "Đã liên kết đơn hàng" : "Đã hủy liên kết");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Link2 className="h-4 w-4" /> {maDonHienTai ? "Đổi đơn hàng liên kết" : "Liên kết đơn hàng"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Liên kết với đơn hàng</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ChonDonHang value={maDon} onChange={setMaDon} placeholder="Tìm đơn hàng theo mã/mô tả…" />
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full" disabled={dangLuu || !maDon} onClick={() => luu(maDon ?? null)}>
              {dangLuu ? "Đang lưu…" : "Lưu liên kết"}
            </Button>
            {maDonHienTai ? (
              <Button variant="ghost" className="w-full text-muted-foreground" disabled={dangLuu} onClick={() => luu(null)}>
                Hủy liên kết hiện tại
              </Button>
            ) : null}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
