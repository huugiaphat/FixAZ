import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Quy ước màu cảnh báo theo Mục 8: Đỏ = cần xử lý ngay, Vàng = cần
// theo dõi, Xanh = đạt mục tiêu.
export type MucCanhBao = "do" | "vang" | "xanh" | "trung-tinh";

const MAU: Record<MucCanhBao, string> = {
  do: "border-red-200 bg-red-50",
  vang: "border-amber-200 bg-amber-50",
  xanh: "border-emerald-200 bg-emerald-50",
  "trung-tinh": "",
};

const MAU_CHU: Record<MucCanhBao, string> = {
  do: "text-red-700",
  vang: "text-amber-700",
  xanh: "text-emerald-700",
  "trung-tinh": "text-foreground",
};

export function StatCard({ nhan, giaTri, mucCanhBao = "trung-tinh", ghiChu }: { nhan: string; giaTri: string; mucCanhBao?: MucCanhBao; ghiChu?: string }) {
  return (
    <Card className={cn(MAU[mucCanhBao])}>
      <CardContent className="py-4">
        <p className="text-sm text-muted-foreground">{nhan}</p>
        <p className={cn("text-2xl font-semibold", MAU_CHU[mucCanhBao])}>{giaTri}</p>
        {ghiChu ? <p className="mt-0.5 text-xs text-muted-foreground">{ghiChu}</p> : null}
      </CardContent>
    </Card>
  );
}
