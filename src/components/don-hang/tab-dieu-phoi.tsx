"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { saveOrQueue } from "@/lib/offline/queue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";
import type { DieuPhoi, NhanVien, VaiTro } from "@/types/database";

export function TabDieuPhoi({
  maDon,
  danhSach,
  vaiTro,
  maNvHienTai,
}: {
  maDon: string;
  danhSach: DieuPhoi[];
  vaiTro: VaiTro;
  maNvHienTai: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [thoList, setThoList] = useState<NhanVien[]>([]);
  const [thoChon, setThoChon] = useState("");
  const [eta, setEta] = useState("");
  const [dangXuLy, setDangXuLy] = useState(false);

  const duocGan = ["Quản lý", "CSKH-Điều phối"].includes(vaiTro);

  useEffect(() => {
    if (!duocGan) return;
    supabase
      .from("nhan_vien")
      .select("*")
      .eq("vai_tro_app", "Thợ")
      .eq("trang_thai", "Đang làm")
      .then(({ data }) => setThoList((data as NhanVien[]) ?? []));
  }, [duocGan, supabase]);

  async function ganTho() {
    if (!thoChon) return;
    setDangXuLy(true);
    const { error: err1 } = await supabase.from("dieu_phoi").insert({
      ma_don: maDon,
      tho: thoChon,
      eta: eta ? new Date(eta).toISOString() : null,
      gio_nhan: new Date().toISOString(),
    });
    const { error: err2 } = await supabase.from("don_hang").update({ tho_phu_trach: thoChon }).eq("ma_don", maDon);
    setDangXuLy(false);
    if (err1 || err2) {
      toast.error(err1?.message ?? err2?.message);
      return;
    }
    toast.success("Đã gán thợ phụ trách đơn");
    router.refresh();
  }

  async function capNhatDieuPhoi(maDp: string, patch: Partial<DieuPhoi>) {
    setDangXuLy(true);
    const ketQua = await saveOrQueue({
      bang: "dieu_phoi",
      thao_tac: "update",
      gia_tri: patch,
      dieu_kien: { ma_dp: maDp },
      mo_ta: `Cập nhật điều phối đơn ${maDon}`,
    });
    setDangXuLy(false);
    if (ketQua.error) toast.error(ketQua.error);
    else {
      if (ketQua.queued) toast.success("Đã lưu tạm — sẽ đồng bộ khi có mạng");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa điều phối thợ nào cho đơn này.</p>
      ) : (
        <div className="space-y-2">
          {danhSach.map((dp) => {
            const laToi = dp.tho === maNvHienTai;
            return (
              <Card key={dp.ma_dp}>
                <CardContent className="space-y-2 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">Thợ: {dp.tho}</p>
                    <Badge variant="secondary">{dp.trang_thai}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <p>ETA: {formatDateTime(dp.eta)}</p>
                    <p>Nhận đơn: {formatDateTime(dp.gio_nhan)}</p>
                    <p>Check-in: {formatDateTime(dp.check_in)}</p>
                    <p>Check-out: {formatDateTime(dp.check_out)}</p>
                  </div>
                  {laToi ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {!dp.gio_xuat_phat ? (
                        <Button size="sm" variant="outline" disabled={dangXuLy} onClick={() => capNhatDieuPhoi(dp.ma_dp, { gio_xuat_phat: new Date().toISOString(), trang_thai: "Đang di chuyển" })}>
                          Đã xuất phát
                        </Button>
                      ) : null}
                      {!dp.check_in ? (
                        <Button size="sm" disabled={dangXuLy} onClick={() => capNhatDieuPhoi(dp.ma_dp, { check_in: new Date().toISOString(), trang_thai: "Đã đến" })}>
                          Check-in tại hiện trường
                        </Button>
                      ) : !dp.check_out ? (
                        <Button size="sm" disabled={dangXuLy} onClick={() => capNhatDieuPhoi(dp.ma_dp, { check_out: new Date().toISOString(), trang_thai: "Hoàn thành" })}>
                          Check-out (hoàn thành tại hiện trường)
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {duocGan ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="font-medium">Gán thợ phụ trách</p>
            <div className="space-y-2">
              <Label>Thợ *</Label>
              <Select value={thoChon} onValueChange={(v) => setThoChon(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn thợ theo kỹ năng/khu vực" />
                </SelectTrigger>
                <SelectContent>
                  {thoList.map((t) => (
                    <SelectItem key={t.ma_nv} value={t.ma_nv}>
                      {t.ho_ten} — {t.ky_nang.length ? t.ky_nang.join(", ") : "?"} — {t.khu_vuc_phu_trach ?? "?"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eta">Giờ hẹn dự kiến (ETA)</Label>
              <Input id="eta" type="datetime-local" value={eta} onChange={(e) => setEta(e.target.value)} />
            </div>
            <Button className="w-full" disabled={!thoChon || dangXuLy} onClick={ganTho}>
              Gán thợ
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
