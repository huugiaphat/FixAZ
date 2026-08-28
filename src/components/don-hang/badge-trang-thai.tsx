import { Badge } from "@/components/ui/badge";
import type { TrangThaiDon } from "@/types/database";

export const MAU_TRANG_THAI_DON: Record<TrangThaiDon, string> = {
  "Mới tiếp nhận": "bg-slate-100 text-slate-700 hover:bg-slate-100",
  "Đã điều phối": "bg-blue-100 text-blue-700 hover:bg-blue-100",
  "Đang khảo sát": "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
  "Chờ duyệt báo giá": "bg-amber-100 text-amber-700 hover:bg-amber-100",
  "Đang thi công": "bg-orange-100 text-orange-700 hover:bg-orange-100",
  "Chờ nghiệm thu": "bg-purple-100 text-purple-700 hover:bg-purple-100",
  "Đã nghiệm thu - chờ thu tiền": "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
  "Đã đóng": "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  "Đã hủy": "bg-red-100 text-red-700 hover:bg-red-100",
};

export function BadgeTrangThaiDon({ trangThai }: { trangThai: TrangThaiDon }) {
  return (
    <Badge variant="secondary" className={MAU_TRANG_THAI_DON[trangThai]}>
      {trangThai}
    </Badge>
  );
}

export const MAU_UU_TIEN: Record<string, string> = {
  "P1-Khẩn cấp": "bg-red-100 text-red-700 hover:bg-red-100",
  "P2-Trong ngày": "bg-amber-100 text-amber-700 hover:bg-amber-100",
  "P3-Đặt lịch": "bg-slate-100 text-slate-700 hover:bg-slate-100",
};

export function BadgeUuTien({ uuTien }: { uuTien: string }) {
  return (
    <Badge variant="secondary" className={MAU_UU_TIEN[uuTien]}>
      {uuTien}
    </Badge>
  );
}
