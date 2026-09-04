export interface DiemNhomCot {
  nhan: string;
  giaTri: number[];
}

export interface ChuoiCot {
  nhan: string;
  mau: string;
}

/** Biểu đồ cột dọc theo nhóm (VD: 3 cột/tháng) — mỗi cột có ghi số liệu, kèm chú giải màu. */
export function BieuDoCotNhom({ diem, chuoi, chieuCao = 170 }: { diem: DiemNhomCot[]; chuoi: ChuoiCot[]; chieuCao?: number }) {
  const max = Math.max(1, ...diem.flatMap((d) => d.giaTri));
  return (
    <div>
      <div className="flex items-end justify-around gap-2 border-b" style={{ height: chieuCao }}>
        {diem.map((d) => (
          <div key={d.nhan} className="flex h-full flex-1 items-end justify-center gap-1.5">
            {d.giaTri.map((v, i) => (
              <div key={i} className="flex h-full flex-col items-center justify-end" style={{ width: 26 }}>
                <span className="mb-1 text-[11px] font-medium tabular-nums">{v}</span>
                <div
                  className={`w-full rounded-t-sm ${chuoi[i]?.mau ?? "bg-primary"}`}
                  style={{ height: `${v > 0 ? Math.max((v / max) * 100, 3) : 0}%` }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-around">
        {diem.map((d) => (
          <span key={d.nhan} className="flex-1 text-center text-xs text-muted-foreground">
            {d.nhan}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {chuoi.map((c) => (
          <div key={c.nhan} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`h-2.5 w-2.5 rounded-sm ${c.mau}`} />
            {c.nhan}
          </div>
        ))}
      </div>
    </div>
  );
}
