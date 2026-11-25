import { formatVND } from "@/lib/format";

export interface DongTienThang {
  thang: string;
  thu: number;
  chi: number;
}

const CHUOI = [
  { ten: "Tổng thu", mau: "#0f9f6e" },
  { ten: "Tổng chi", mau: "#ea6a55" },
  { ten: "Chênh lệch", mau: "#2563eb" },
] as const;

export function BieuDoDongTien({ duLieu }: { duLieu: DongTienThang[] }) {
  const diem = duLieu.map((d) => ({ ...d, chenhLech: d.thu - d.chi }));
  const maxDuong = Math.max(1, ...diem.flatMap((d) => [d.thu, d.chi, d.chenhLech]));
  const maxAm = Math.max(0, ...diem.map((d) => -d.chenhLech));
  const tren = maxAm > 0 ? 146 : 190;
  const duoi = maxAm > 0 ? 54 : 0;
  const mocKhong = 26 + tren;
  const rong = 720;
  const rongNhom = 100;
  const khoangNhom = 15;
  const rongCot = 21;

  return <div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 px-1 pb-4 text-xs text-muted-foreground">
      {CHUOI.map((c) => <span key={c.ten} className="inline-flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ backgroundColor: c.mau }} />{c.ten}</span>)}
    </div>
    <div className="overflow-x-auto pb-1">
      <svg viewBox={`0 0 ${rong} 270`} className="min-w-[620px] w-full" role="img" aria-label="Biểu đồ tổng thu, tổng chi và chênh lệch dòng tiền trong sáu tháng">
        {[0.25, 0.5, 0.75, 1].map((n) => <line key={n} x1="32" x2="715" y1={mocKhong - n * tren} y2={mocKhong - n * tren} stroke="currentColor" strokeOpacity="0.08" />)}
        <line x1="32" x2="715" y1={mocKhong} y2={mocKhong} stroke="currentColor" strokeOpacity="0.35" />
        {diem.map((d, i) => {
          const nhan = `${d.thang.slice(5)}/${d.thang.slice(2, 4)}`;
          const xNhom = 50 + i * (rongNhom + khoangNhom);
          return <g key={d.thang}>
            {([d.thu, d.chi, d.chenhLech] as const).map((giaTri, j) => {
              const chieuCao = giaTri >= 0 ? giaTri / maxDuong * tren : Math.abs(giaTri) / maxAm * duoi;
              const y = giaTri >= 0 ? mocKhong - chieuCao : mocKhong;
              const x = xNhom + j * (rongCot + 8);
              return <rect key={CHUOI[j].ten} x={x} y={y} width={rongCot} height={Math.max(giaTri === 0 ? 0 : 2, chieuCao)} rx="3" fill={giaTri < 0 ? "#d97706" : CHUOI[j].mau}>
                <title>{`${CHUOI[j].ten} ${d.thang.slice(5)}/${d.thang.slice(0, 4)}: ${formatVND(giaTri)}`}</title>
              </rect>;
            })}
            <text x={xNhom + 35} y={mocKhong + duoi + 22} textAnchor="middle" fill="currentColor" className="text-xs">{nhan}</text>
          </g>;
        })}
      </svg>
    </div>
    <table className="sr-only"><caption>Dòng tiền theo tháng</caption><thead><tr><th>Tháng</th><th>Tổng thu</th><th>Tổng chi</th><th>Chênh lệch</th></tr></thead>
      <tbody>{diem.map((d) => <tr key={d.thang}><td>{d.thang}</td><td>{formatVND(d.thu)}</td><td>{formatVND(d.chi)}</td><td>{formatVND(d.chenhLech)}</td></tr>)}</tbody>
    </table>
  </div>;
}
