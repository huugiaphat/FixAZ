export interface MucGiaTri {
  nhan: string;
  hienThi: string;
  giaTri?: number;
}

/** Danh sách nhãn/số liệu dạng phẳng — không có thanh màu thể hiện độ lớn. */
export function DanhSachGiaTri({ items, mau = "bg-blue-500" }: { items: MucGiaTri[]; mau?: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
  }
  const tong = items.reduce((s, item) => s + Math.max(0, item.giaTri ?? 0), 0);
  return (
    <div className="space-y-4 pt-3">
      {items.map((it) => (
        <div key={it.nhan} className="space-y-2 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <span className="text-muted-foreground">{it.nhan}</span>
            <span className="font-semibold tabular-nums">{it.hienThi}</span>
          </div>
          {typeof it.giaTri === "number" && <div className="h-2 overflow-hidden rounded-full bg-muted" aria-label={`Tỷ trọng ${tong > 0 ? Math.round(it.giaTri / tong * 100) : 0}%`}>
            <div className={`h-full rounded-full ${mau}`} style={{ width: `${tong > 0 ? Math.max(0, it.giaTri) / tong * 100 : 0}%` }} />
          </div>}
        </div>
      ))}
    </div>
  );
}
