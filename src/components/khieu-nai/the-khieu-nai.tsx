"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import type { KhieuNai, NhanVien, VaiTro } from "@/types/database";

const MAU_MUC_DO: Record<string, string> = {
  "Thấp": "bg-slate-100 text-slate-700 hover:bg-slate-100",
  "Trung bình": "bg-amber-100 text-amber-700 hover:bg-amber-100",
  "Cao-Khẩn cấp": "bg-red-100 text-red-700 hover:bg-red-100",
};

export function TheKhieuNai({ khieuNai, vaiTro }: { khieuNai: KhieuNai; vaiTro: VaiTro }) {
  const router = useRouter();
  const duocXuLy = ["Quản lý", "CSKH-Điều phối"].includes(vaiTro);
  const supabase = createClient();
  const [nhanVienList, setNhanVienList] = useState<NhanVien[]>([]);
  const [dangSua, setDangSua] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);
  const [nguoiXuLy, setNguoiXuLy] = useState(khieuNai.nguoi_xu_ly ?? "");
  const [ketQua, setKetQua] = useState(khieuNai.ket_qua ?? "");
  const [trangThai, setTrangThai] = useState(khieuNai.trang_thai);

  useEffect(() => {
    if (!dangSua) return;
    supabase.from("nhan_vien").select("*").eq("trang_thai", "Đang làm").then(({ data }) => setNhanVienList((data as NhanVien[]) ?? []));
  }, [dangSua, supabase]);

  async function luu() {
    setDangLuu(true);
    const { error } = await supabase
      .from("khieu_nai")
      .update({ nguoi_xu_ly: nguoiXuLy || null, ket_qua: ketQua || null, trang_thai: trangThai })
      .eq("ma_kn", khieuNai.ma_kn);
    setDangLuu(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Đã cập nhật khiếu nại");
    setDangSua(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium">{khieuNai.ma_kn} — Đơn: {khieuNai.ma_don}</p>
          <div className="flex gap-1.5">
            <Badge className={MAU_MUC_DO[khieuNai.muc_do]} variant="secondary">{khieuNai.muc_do}</Badge>
            <Badge variant="outline">{khieuNai.trang_thai}</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{khieuNai.noi_dung}</p>
        <p className="text-xs text-muted-foreground">
          {khieuNai.nguoi_xu_ly ? `Người xử lý: ${khieuNai.nguoi_xu_ly} · ` : ""}
          {khieuNai.han_xu_ly ? `Hạn: ${formatDate(khieuNai.han_xu_ly)}` : ""}
        </p>
        {khieuNai.ket_qua ? <p className="text-sm">Kết quả: {khieuNai.ket_qua}</p> : null}

        {!duocXuLy ? null : !dangSua ? (
          <Button size="sm" variant="outline" onClick={() => setDangSua(true)}>Cập nhật xử lý</Button>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Người xử lý</label>
                <Select value={nguoiXuLy} onValueChange={(v) => setNguoiXuLy(v ?? "")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Chọn nhân viên" /></SelectTrigger>
                  <SelectContent>
                    {nhanVienList.map((nv) => (
                      <SelectItem key={nv.ma_nv} value={nv.ma_nv}>{nv.ho_ten}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Trạng thái</label>
                <Select value={trangThai} onValueChange={(v) => setTrangThai((v ?? "Mới") as KhieuNai["trang_thai"])}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mới">Mới</SelectItem>
                    <SelectItem value="Đang xử lý">Đang xử lý</SelectItem>
                    <SelectItem value="Đã xử lý">Đã xử lý</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
