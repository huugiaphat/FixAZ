export interface MucThanhNgang {
  nhan: string;
  giaTri: number;
  hienThi: string;
  mauThanh?: string;
}

export function ThanhNgang({ items, mauMacDinh = "bg-primary" }: { items: MucThanhNgang[]; mauMacDinh?: string }) {
  const max = Math.max(...items.map((i) => i.giaTri), 1);
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
  }
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.nhan} className="grid grid-cols-[minmax(72px,110px)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-muted-foreground">{it.nhan}</span>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${it.mauThanh ?? mauMacDinh}`}
              style={{ width: `${Math.max((it.giaTri / max) * 100, 2)}%` }}
            />
          </div>
          <span className="tabular-nums font-medium whitespace-nowrap">{it.hienThi}</span>
        </div>
      ))}
    </div>
  );
}
