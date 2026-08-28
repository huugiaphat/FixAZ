"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { xoaNhanVien } from "@/app/(app)/quan-tri/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export function NutXoaNhanVien({ maNv, hoTen }: { maNv: string; hoTen: string }) {
  const [open, setOpen] = useState(false);
  const [dangXoa, setDangXoa] = useState(false);
  const router = useRouter();

  async function xacNhanXoa() {
    setDangXoa(true);
    const ketQua = await xoaNhanVien(maNv);
    setDangXoa(false);
    if (!ketQua.ok) {
      toast.error(ketQua.loi, { duration: 8000 });
      return;
    }
    toast.success("Đã xóa nhân viên");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" />}>
        <Trash2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa nhân viên "{hoTen}"?</DialogTitle>
          <DialogDescription>
            Chỉ nên dùng cho tài khoản tạo nhầm. Nếu nhân viên đã có đơn hàng/thu tiền/dữ liệu khác, thao tác sẽ bị chặn — dùng "Đánh dấu nghỉ việc" thay thế. Không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={dangXoa}>Hủy</Button>
          <Button variant="destructive" onClick={xacNhanXoa} disabled={dangXoa}>
            {dangXoa ? "Đang xóa…" : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
