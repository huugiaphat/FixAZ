"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { TrangThaiDon, VaiTro } from "@/types/database";

// Đồ thị chuyển trạng thái hợp lệ — khớp với f_chuyen_trang_thai_don()
// trong supabase/migrations/0009_business_rules.sql. Danh sách này chỉ
// dùng để hiện đúng nút bấm; ràng buộc thật (nguyên tắc 2 & 8) được
// CSDL kiểm tra lại — không tin tưởng riêng phía client.
const BUOC_TIEP_THEO: Partial<Record<TrangThaiDon, TrangThaiDon>> = {
  "Mới tiếp nhận": "Đã điều phối",
  "Đã điều phối": "Đang khảo sát",
  "Đang khảo sát": "Chờ duyệt báo giá",
  "Chờ duyệt báo giá": "Đang thi công",
  "Đang thi công": "Chờ nghiệm thu",
  "Chờ nghiệm thu": "Đã nghiệm thu - chờ thu tiền",
  "Đã nghiệm thu - chờ thu tiền": "Đã đóng",
};

const CO_THE_HUY: TrangThaiDon[] = [
  "Mới tiếp nhận", "Đã điều phối", "Đang khảo sát", "Chờ duyệt báo giá",
  "Đang thi công", "Chờ nghiệm thu", "Đã nghiệm thu - chờ thu tiền",
];

export function ChuyenTrangThaiDon({ maDon, trangThai, vaiTro }: { maDon: string; trangThai: TrangThaiDon; vaiTro: VaiTro }) {
  const router = useRouter();
  const [dangXuLy, setDangXuLy] = useState(false);
  const [openHuy, setOpenHuy] = useState(false);
  const [lyDoHuy, setLyDoHuy] = useState("");

  const buocTiepTheo = BUOC_TIEP_THEO[trangThai];
  const chiQuanLySua = ["Quản lý", "CSKH-Điều phối"].includes(vaiTro);

  async function chuyen(trangThaiMoi: TrangThaiDon, lyDo?: string, xacNhanKhanCap?: boolean) {
    setDangXuLy(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("f_chuyen_trang_thai_don", {
      p_ma_don: maDon,
      p_trang_thai_moi: trangThaiMoi,
      p_ly_do_huy: lyDo ?? null,
      p_xac_nhan_khan_cap: xacNhanKhanCap ?? false,
    });
    setDangXuLy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Đã chuyển sang "${trangThaiMoi}"`);
    setOpenHuy(false);
    router.refresh();
  }

  if (trangThai === "Đã đóng" || trangThai === "Đã hủy") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {buocTiepTheo ? (
        <Button disabled={dangXuLy} onClick={() => chuyen(buocTiepTheo)}>
          Chuyển sang &quot;{buocTiepTheo}&quot;
        </Button>
      ) : null}

      {chiQuanLySua && CO_THE_HUY.includes(trangThai) ? (
        <Dialog open={openHuy} onOpenChange={setOpenHuy}>
          <Button variant="destructive" onClick={() => setOpenHuy(true)} disabled={dangXuLy}>
            Hủy đơn
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hủy đơn {maDon}</DialogTitle>
              <DialogDescription>Bắt buộc phải nhập lý do khi hủy đơn.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="ly_do_huy">Lý do hủy *</Label>
              <Textarea id="ly_do_huy" value={lyDoHuy} onChange={(e) => setLyDoHuy(e.target.value)} rows={3} />
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                disabled={!lyDoHuy.trim() || dangXuLy}
                onClick={() => chuyen("Đã hủy", lyDoHuy)}
              >
                Xác nhận hủy đơn
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
