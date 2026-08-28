"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatVND } from "@/lib/format";
import type { BaoHanh } from "@/types/database";

const MAU_TRANG_THAI: Record<string, string> = {
  "Mới tạo": "bg-slate-100 text-slate-700 hover:bg-slate-100",
  "Đang xử lý": "bg-amber-100 text-amber-700 hover:bg-amber-100",
  "Đã đóng": "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
};

export function TheBaoHanh({ baoHanh }: { baoHanh: BaoHanh }) {
  const router = useRouter();
  const [dangSua, setDangSua] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);
  const [ketQua, setKetQua] = useState(baoHanh.ket_qua ?? "");
  const [chiPhi, setChiPhi] = useState(baoHanh.chi_phi ?? 0);
  const [nguyenNhan, setNguyenNhan] = useState(baoHanh.nguyen_nhan ?? "");
  const [trangThai, setTrangThai] = useState(baoHanh.trang_thai);

  async function luu() {
    setDangLuu(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("bao_hanh")
      .update({
        ket_qua: ketQua || null,
        chi_phi: chiPhi,
        nguyen_nhan: nguyenNhan || null,
        trang_thai: trangThai,
      })
      .eq("ma_bh", baoHanh.ma_bh);
    setDangLuu(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Đã cập nhật bảo hành");
    setDangSua(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium">{baoHanh.ma_bh} — Đơn cũ: {baoHanh.ma_don_cu}</p>
          <Badge className={MAU_TRANG_THAI[baoHanh.trang_thai]} variant="secondary">{baoHanh.trang_thai}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{baoHanh.noi_dung}</p>
        <p className="text-xs text-muted-foreground">Yêu cầu ngày {formatDate(baoHanh.ngay_yeu_cau)}</p>

        {!dangSua ? (
          <div className="space-y-1 pt-1 text-sm">
            {baoHanh.nguyen_nhan ? <p>Phân loại: <span className="font-medium">{baoHanh.nguyen_nhan}</span></p> : null}
            {baoHanh.ket_qua ? <p>Kết quả: {baoHanh.ket_qua}</p> : null}
            {baoHanh.chi_phi ? <p>Chi phí: {formatVND(baoHanh.chi_phi)}</p> : null}
            <Button size="sm" variant="outline" className="mt-1" onClick={() => setDangSua(true)}>
              Cập nhật xử lý
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Phân loại lỗi</label>
                <Select value={nguyenNhan} onValueChange={(v) => setNguyenNhan(v ?? "")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lỗi cũ tái phát">Lỗi cũ tái phát (miễn phí)</SelectItem>
                    <SelectItem value="Lỗi mới phát sinh">Lỗi mới phát sinh (tính phí)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Trạng thái</label>
                <Select value={trangThai} onValueChange={(v) => setTrangThai((v ?? "Mới tạo") as BaoHanh["trang_thai"])}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mới tạo">Mới tạo</SelectItem>
                    <SelectItem value="Đang xử lý">Đang xử lý</SelectItem>
                    <SelectItem value="Đã đóng">Đã đóng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Chi phí (0 nếu miễn phí)</label>
              <Input type="number" min={0} value={chiPhi} onChange={(e) => setChiPhi(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Kết quả xử lý</label>
              <Textarea rows={2} value={ketQua} onChange={(e) => setKetQua(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={dangLuu} onClick={luu}>Lưu</Button>
              <Button size="sm" variant="ghost" onClick={() => setDangSua(false)}>Hủy</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
