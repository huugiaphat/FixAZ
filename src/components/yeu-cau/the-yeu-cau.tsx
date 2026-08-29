"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ICON_DICH_VU } from "@/lib/schemas/yeu-cau-dich-vu";
import { formatDateTime } from "@/lib/format";
import type { YeuCauDichVu } from "@/types/database";

const MAU_TRANG_THAI: Record<string, string> = {
  "Mới": "bg-blue-100 text-blue-700 hover:bg-blue-100",
  "Đã liên hệ": "bg-amber-100 text-amber-700 hover:bg-amber-100",
  "Đã tạo đơn": "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  "Đã hủy": "bg-slate-100 text-slate-500 hover:bg-slate-100",
};

export function TheYeuCau({ yeuCau }: { yeuCau: YeuCauDichVu }) {
  const router = useRouter();
  const [dangXuLy, setDangXuLy] = useState(false);
  const IconDichVu = ICON_DICH_VU[yeuCau.dich_vu];

  const urlTaoDon = `/don-hang/moi?${new URLSearchParams({
    ma_yc: yeuCau.ma_yc,
    ho_ten: yeuCau.ho_ten,
    sdt: yeuCau.sdt,
    dich_vu: yeuCau.dich_vu,
    yeu_cau: yeuCau.yeu_cau,
  }).toString()}`;

  const daXongViec = yeuCau.trang_thai === "Đã tạo đơn" || yeuCau.trang_thai === "Đã hủy";

  async function capNhat(patch: Partial<Pick<YeuCauDichVu, "trang_thai" | "ma_don">>) {
    setDangXuLy(true);
    const supabase = createClient();
    const { error } = await supabase.from("yeu_cau_dich_vu").update(patch).eq("ma_yc", yeuCau.ma_yc);
    setDangXuLy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Đã cập nhật yêu cầu");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium">{yeuCau.ma_yc} — {yeuCau.ho_ten}</p>
          <Badge className={MAU_TRANG_THAI[yeuCau.trang_thai]} variant="secondary">{yeuCau.trang_thai}</Badge>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <IconDichVu className="h-3.5 w-3.5" /> {yeuCau.dich_vu}
        </div>
        <p className="text-sm">{yeuCau.yeu_cau}</p>
        <p className="text-sm text-muted-foreground">{yeuCau.dia_chi} · {yeuCau.sdt}</p>
        <p className="text-xs text-muted-foreground">{formatDateTime(yeuCau.created_at)}</p>

        {yeuCau.ma_don ? (
          <Link href={`/don-hang/${yeuCau.ma_don}`} className="text-sm font-medium text-primary hover:underline">
            Xem đơn hàng {yeuCau.ma_don}
          </Link>
        ) : null}

        {!daXongViec ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {yeuCau.trang_thai === "Mới" ? (
              <Button size="sm" variant="outline" disabled={dangXuLy} onClick={() => capNhat({ trang_thai: "Đã liên hệ" })}>
                Đánh dấu đã liên hệ
              </Button>
            ) : null}
            <Button size="sm" render={<Link href={urlTaoDon} />}>
              Tạo đơn hàng
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={dangXuLy} onClick={() => capNhat({ trang_thai: "Đã hủy" })}>
              Hủy yêu cầu
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
