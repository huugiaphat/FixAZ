import { AlertTriangle, CheckCircle2, XCircle, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Quy ước màu cảnh báo theo Mục 8: Đỏ = cần xử lý ngay, Vàng = cần
// theo dõi, Xanh = đạt mục tiêu. Icon trạng thái đi kèm màu để không
// chỉ dựa vào màu sắc (người mù màu vẫn phân biệt được).
export type MucCanhBao = "do" | "vang" | "xanh" | "trung-tinh";

const MAU_ICON_CHIP: Record<MucCanhBao, string> = {
  do: "bg-destructive/10 text-destructive",
  vang: "bg-amber-500/10 text-amber-600",
  xanh: "bg-emerald-500/10 text-emerald-600",
  "trung-tinh": "bg-primary/10 text-primary",
};

const MAU_CHU: Record<MucCanhBao, string> = {
  do: "text-destructive",
  vang: "text-amber-600",
  xanh: "text-emerald-600",
  "trung-tinh": "text-foreground",
};

const MAU_THANH: Record<MucCanhBao, string> = {
  do: "bg-destructive",
  vang: "bg-amber-500",
  xanh: "bg-emerald-500",
  "trung-tinh": "bg-primary",
};

const ICON_TRANG_THAI: Record<Exclude<MucCanhBao, "trung-tinh">, LucideIcon> = {
  do: XCircle,
  vang: AlertTriangle,
  xanh: CheckCircle2,
};

export function StatCard({
  nhan,
  giaTri,
  icon: Icon,
  mucCanhBao = "trung-tinh",
  ghiChu,
  phanTram,
}: {
  nhan: string;
  giaTri: string;
  icon: LucideIcon;
  mucCanhBao?: MucCanhBao;
  ghiChu?: string;
  /** 0-100 — hiện thanh tiến độ mảnh cho các chỉ số dạng % */
  phanTram?: number;
}) {
  const IconTrangThai = mucCanhBao !== "trung-tinh" ? ICON_TRANG_THAI[mucCanhBao] : null;

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", MAU_ICON_CHIP[mucCanhBao])}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
          {IconTrangThai ? <IconTrangThai className={cn("h-4 w-4", MAU_CHU[mucCanhBao])} /> : null}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{nhan}</p>
          <p className={cn("text-2xl font-semibold tabular-nums", MAU_CHU[mucCanhBao])}>{giaTri}</p>
        </div>
        {typeof phanTram === "number" ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", MAU_THANH[mucCanhBao])}
              style={{ width: `${Math.max(0, Math.min(100, phanTram))}%` }}
            />
          </div>
        ) : null}
        {ghiChu ? <p className="text-xs text-muted-foreground">{ghiChu}</p> : null}
      </CardContent>
    </Card>
  );
}
