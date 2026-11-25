"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatVND } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ThuChiDong } from "@/types/database";

export function XemChiTietThuChi({ maTc, tongTien, soDong }: { maTc: string; tongTien: number; soDong: number }) {
  const [open, setOpen] = useState(false);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [dong, setDong] = useState<ThuChiDong[]>([]);

  useEffect(() => {
    if (!open) return;
    let huy = false;
    createClient().from("thu_chi_dong").select("*").eq("ma_tc", maTc).order("thu_tu")
      .then(({ data, error }) => {
        if (huy) return;
        setDangTai(false);
        if (error) setLoi(error.message);
        else setDong((data as ThuChiDong[]) ?? []);
      });
    return () => { huy = true; };
  }, [open, maTc]);

  return <Dialog open={open} onOpenChange={(next) => {
    setOpen(next);
    if (next) { setDangTai(true); setLoi(null); }
  }}>
    <DialogTrigger render={<Button variant="outline" size="xs" aria-label={`Xem ${soDong} dòng của phiếu ${maTc}`} />}><Eye className="h-3.5 w-3.5" /> {soDong} dòng</DialogTrigger>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Chi tiết HH/DV · {maTc}</DialogTitle></DialogHeader>
      {dangTai ? <p className="text-sm text-muted-foreground">Đang tải chi tiết…</p> : null}
      {loi ? <p className="text-sm text-destructive">Không tải được chi tiết: {loi}</p> : null}
      {!dangTai && !loi ? <div className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b text-left"><th className="py-2 pr-3">Tên HH/DV</th><th className="py-2 pr-3 text-right">Đơn giá</th><th className="py-2 pr-3 text-right">Số lượng</th><th className="py-2 text-right">Thành tiền</th></tr></thead>
            <tbody>{dong.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="py-2 pr-3">{item.ten_hh_dv}</td><td className="py-2 pr-3 text-right tabular-nums">{formatVND(item.don_gia)}</td><td className="py-2 pr-3 text-right tabular-nums">{item.so_luong}</td><td className="py-2 text-right tabular-nums">{formatVND(item.thanh_tien)}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="text-right font-semibold">Tổng phiếu: {formatVND(tongTien)}</p>
      </div> : null}
    </DialogContent>
  </Dialog>;
}
