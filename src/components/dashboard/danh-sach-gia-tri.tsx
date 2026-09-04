export interface MucGiaTri {
  nhan: string;
  hienThi: string;
}

/** Danh sách nhãn/số liệu dạng phẳng — không có thanh màu thể hiện độ lớn. */
export function DanhSachGiaTri({ items }: { items: MucGiaTri[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
  }
  return (
    <div className="divide-y">
      {items.map((it) => (
        <div key={it.nhan} className="flex items-center justify-between py-2 text-sm">
          <span className="text-muted-foreground">{it.nhan}</span>
          <span className="font-medium tabular-nums">{it.hienThi}</span>
        </div>
      ))}
    </div>
  );
}
