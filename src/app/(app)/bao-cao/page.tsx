import Link from "next/link";
import { Fragment } from "react";
import { PageHeading } from "@/components/page-heading";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatVND } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type DongCongTrinh = {
  ma_muc: string;
  ma_don: string | null;
  ten_hien_thi: string;
  ngay_sap_xep: string;
  trang_thai: string | null;
  thang_quan_ly: string | null;
  tong_thu: number;
  tong_chi: number;
};
type DongChiPhi = { ma_muc: string; danh_muc: string; so_phieu: number; tong_chi: number };
type DongThang = { thang: string; tong_thu: number; tong_chi: number; thu_chua_gan_don: number; chi_chua_gan_don: number };
type TongHop = { tong_thu: number; tong_chi: number; thu_quan_ly: number; chi_quan_ly: number };

const MOI_TRANG = 25;

function namHienTai() {
  return Number(new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date()));
}

function duongDan(params: { nam: number; tim?: string; trang?: number; maMuc?: string }) {
  const query = new URLSearchParams({ nam: String(params.nam) });
  if (params.tim) query.set("tim", params.tim);
  if (params.trang && params.trang > 1) query.set("trang", String(params.trang));
  if (params.maMuc) query.set("ma_muc", params.maMuc);
  return `/bao-cao?${query.toString()}`;
}

function phanTram(thu: number, chenhLech: number) {
  return thu > 0 ? `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(chenhLech / thu * 100)}%` : "—";
}

export default async function TrangBaoCao({ searchParams }: {
  searchParams: Promise<{ nam?: string; tim?: string; trang?: string; ma_muc?: string }>;
}) {
  await requireNhanVien(["Quản lý", "Admin", "Kế toán", "Kiểm soát"]);
  const params = await searchParams;
  const namMacDinh = namHienTai();
  const namSo = Number(params.nam);
  const nam = Number.isInteger(namSo) && namSo >= 2000 && namSo <= 2100 ? namSo : namMacDinh;
  const tim = params.tim?.trim().slice(0, 100) ?? "";
  const trang = Math.max(1, Math.min(100000, Number.parseInt(params.trang ?? "1", 10) || 1));
  const supabase = await createClient();

  let congTrinhQuery = supabase.from("v_bao_cao_cong_trinh")
    .select("*", { count: "exact" })
    .order("ngay_sap_xep", { ascending: false })
    .order("ma_muc", { ascending: false });
  if (tim) congTrinhQuery = congTrinhQuery.ilike("ten_hien_thi", `%${tim.replace(/[%_]/g, "\\$&")}%`);

  const [congTrinhResult, thangResult, tongHopResult] = await Promise.all([
    congTrinhQuery.range((trang - 1) * MOI_TRANG, trang * MOI_TRANG - 1),
    supabase.from("v_bao_cao_thang").select("*")
      .gte("thang", `${nam}-01`).lte("thang", `${nam}-12`)
      .order("thang", { ascending: false }),
    supabase.from("v_bao_cao_tong_hop").select("*").single(),
  ]);

  const congTrinh = (congTrinhResult.data as DongCongTrinh[] | null) ?? [];
  const duLieuThang = (thangResult.data as DongThang[] | null) ?? [];
  const thangMap = new Map(duLieuThang.map(d => [d.thang, d]));
  const theoThang = Array.from({ length: 12 }, (_, i) => {
    const thang = `${nam}-${String(12 - i).padStart(2, "0")}`;
    return thangMap.get(thang) ?? { thang, tong_thu: 0, tong_chi: 0, thu_chua_gan_don: 0, chi_chua_gan_don: 0 };
  });
  const soTrang = Math.max(1, Math.ceil((congTrinhResult.count ?? 0) / MOI_TRANG));
  const maMucDuocChon = congTrinh.find(d => d.ma_muc === params.ma_muc)?.ma_muc;
  const chiPhiResult = maMucDuocChon
    ? await supabase.from("v_bao_cao_chi_phi_cong_trinh").select("*")
        .eq("ma_muc", maMucDuocChon).order("tong_chi", { ascending: false })
    : null;
  const chiPhi = (chiPhiResult?.data as DongChiPhi[] | null) ?? [];
  const tongHop = tongHopResult.data as TongHop | null;
  const tongThuNam = theoThang.reduce((sum, d) => sum + Number(d.tong_thu), 0);
  const tongChiNam = theoThang.reduce((sum, d) => sum + Number(d.tong_chi), 0);

  return <div className="space-y-6">
    <PageHeading title="Báo Cáo" description="Thu chi đã hạch toán theo công trình và theo tháng." />
    <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      “Báo Cáo Dòng Tiền” là tổng mọi khoản thu và chi trong tháng; “Thu Chi tháng” chỉ là phần không qua đơn hàng và đã nằm trong tổng đó. Chênh lệch = tiền đã thu − tiền đã chi; tỷ lệ = chênh lệch / tiền đã thu. Đây là dòng tiền thực thu, thực chi, chưa phải lợi nhuận kế toán. Phiếu chờ duyệt không được tính.
    </p>
    {tongHopResult.error ? <p className="text-sm text-destructive">Không tải được tổng hợp: {tongHopResult.error.message}</p> :
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="py-4"><p className="text-sm text-muted-foreground">Tổng thu · tất cả thời gian</p><p className="text-xl font-semibold text-emerald-700">{formatVND(Number(tongHop?.tong_thu ?? 0))}</p><p className="mt-1 text-xs text-muted-foreground">Thu chi quản lý: {formatVND(Number(tongHop?.thu_quan_ly ?? 0))}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-sm text-muted-foreground">Tổng chi · tất cả thời gian</p><p className="text-xl font-semibold text-destructive">{formatVND(Number(tongHop?.tong_chi ?? 0))}</p><p className="mt-1 text-xs text-muted-foreground">Thu chi quản lý: {formatVND(Number(tongHop?.chi_quan_ly ?? 0))}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-sm text-muted-foreground">Chênh lệch · tất cả thời gian</p><p className="text-xl font-semibold">{formatVND(Number(tongHop?.tong_thu ?? 0) - Number(tongHop?.tong_chi ?? 0))}</p></CardContent></Card>
      </div>}

    <section className="space-y-3" aria-labelledby="bao-cao-cong-trinh">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 id="bao-cao-cong-trinh" className="text-xl font-semibold">Theo công trình</h2>
          <p className="text-sm text-muted-foreground">25 dòng mỗi trang · “Thu Chi tháng MM/YYYY” chỉ gồm khoản ngoài đơn hàng. Bấm từng dòng để xem chi phí.</p></div>
        <form action="/bao-cao" className="flex gap-2">
          <input type="hidden" name="nam" value={nam} />
          <input name="tim" defaultValue={tim} aria-label="Tìm mã hoặc tên công trình" placeholder="Tìm công trình…" className="h-10 w-56 rounded-md border bg-background px-3 text-sm" />
          <button type="submit" className="rounded-md border px-4 text-sm font-medium hover:bg-muted">Tìm</button>
        </form>
      </div>
      <Card><CardContent className="p-0">
        {congTrinhResult.error ? <p className="p-4 text-sm text-destructive">Không tải được báo cáo công trình: {congTrinhResult.error.message}</p> :
        <Table><TableHeader><TableRow>
          <TableHead>Công trình</TableHead><TableHead className="text-right">Tổng thu</TableHead>
          <TableHead className="text-right">Tổng chi</TableHead><TableHead className="text-right">Chênh lệch</TableHead>
          <TableHead className="text-right">Tỷ lệ %</TableHead>
        </TableRow></TableHeader><TableBody>
          {congTrinh.map(d => {
            const thu = Number(d.tong_thu);
            const chi = Number(d.tong_chi);
            const chenh = thu - chi;
            const mo = maMucDuocChon === d.ma_muc;
            return <Fragment key={d.ma_muc}><TableRow>
              <TableCell className="max-w-80 whitespace-normal">
                <Link href={duongDan({ nam, tim, trang, maMuc: mo ? undefined : d.ma_muc })} aria-expanded={mo} className="font-medium text-primary hover:underline">
                  {d.ten_hien_thi}
                </Link>
                {d.thang_quan_ly && <span className="ml-2 text-xs text-muted-foreground">Không qua đơn hàng</span>}
                {d.trang_thai === "Đã hủy" && <span className="ml-2 text-xs text-muted-foreground">Đã hủy</span>}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatVND(thu)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatVND(chi)}</TableCell>
              <TableCell className={`text-right font-medium tabular-nums ${chenh < 0 ? "text-destructive" : "text-emerald-700"}`}>{formatVND(chenh)}</TableCell>
              <TableCell className="text-right tabular-nums">{phanTram(thu, chenh)}</TableCell>
              </TableRow>
              {mo && <TableRow><TableCell colSpan={5} className="!whitespace-normal bg-muted/30 p-4">
                <div className="space-y-2"><h3 className="font-semibold">Chi phí của {d.ten_hien_thi}</h3>
                  {chiPhiResult?.error ? <p className="text-sm text-destructive">Không tải được chi tiết: {chiPhiResult.error.message}</p> :
                  chiPhi.length ? <Table><TableHeader><TableRow><TableHead>Danh mục chi</TableHead><TableHead className="text-right">Số phiếu</TableHead><TableHead className="text-right">Số tiền</TableHead></TableRow></TableHeader>
                    <TableBody>{chiPhi.map(c => <TableRow key={c.danh_muc}><TableCell>{c.danh_muc}</TableCell><TableCell className="text-right">{c.so_phieu}</TableCell><TableCell className="text-right">{formatVND(Number(c.tong_chi))}</TableCell></TableRow>)}</TableBody></Table>
                    : <p className="text-sm text-muted-foreground">Chưa có phiếu chi đã duyệt trong mục này.</p>}
                  {d.ma_don ? <Link href={`/don-hang/${encodeURIComponent(d.ma_don)}`} className="inline-block text-sm text-primary hover:underline">Xem đơn hàng →</Link>
                    : <Link href={`/thu-chi?thang=${encodeURIComponent(d.thang_quan_ly ?? "")}`} className="inline-block text-sm text-primary hover:underline">Xem Sổ thu chi tháng →</Link>}
                </div>
              </TableCell></TableRow>}
            </Fragment>;
          })}
          {congTrinh.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Không có công trình phù hợp.</TableCell></TableRow>}
        </TableBody></Table>}
      </CardContent></Card>
      {soTrang > 1 && <div className="flex items-center justify-between text-sm">
        <span>{congTrinhResult.count} mục · 25 mục/trang · Trang {trang}/{soTrang}</span>
        <div className="flex gap-2">
          {trang > 1 && <Link className="rounded-md border px-3 py-2 hover:bg-muted" href={duongDan({ nam, tim, trang: trang - 1 })}>← Trước</Link>}
          {trang < soTrang && <Link className="rounded-md border px-3 py-2 hover:bg-muted" href={duongDan({ nam, tim, trang: trang + 1 })}>Sau →</Link>}
        </div>
      </div>}
    </section>

    <section className="space-y-3" aria-labelledby="bao-cao-thang">
      <div className="flex flex-wrap items-center justify-between gap-3"><div>
        <h2 id="bao-cao-thang" className="text-xl font-semibold">Theo tháng</h2>
        <p className="text-sm text-muted-foreground">“Báo Cáo Dòng Tiền” gồm tất cả thu chi theo ngày phát sinh tại Việt Nam, kể cả khoản ngoài đơn hàng.</p>
      </div><div className="flex items-center gap-3 text-sm">
        <Link href={duongDan({ nam: nam - 1, tim })} className="rounded-md border px-3 py-2 hover:bg-muted">← Năm trước</Link>
        <span className="font-semibold">{nam}</span>
        <Link href={duongDan({ nam: nam + 1, tim })} className="rounded-md border px-3 py-2 hover:bg-muted">Năm sau →</Link>
      </div></div>
      <Card><CardContent className="p-0">
        {thangResult.error ? <p className="p-4 text-sm text-destructive">Không tải được báo cáo tháng: {thangResult.error.message}</p> :
        <Table><TableHeader><TableRow><TableHead>Báo cáo tháng</TableHead><TableHead className="text-right">Tổng thu</TableHead><TableHead className="text-right">Tổng chi</TableHead><TableHead className="text-right">Thu ngoài đơn</TableHead><TableHead className="text-right">Chi ngoài đơn</TableHead><TableHead className="text-right">Chênh lệch</TableHead><TableHead className="text-right">Tỷ lệ %</TableHead></TableRow></TableHeader>
          <TableBody>{theoThang.map(d => {
            const thu = Number(d.tong_thu);
            const chi = Number(d.tong_chi);
            return <TableRow key={d.thang}><TableCell className="font-medium">Báo Cáo Dòng Tiền {d.thang.slice(5)}/{d.thang.slice(0, 4)}</TableCell><TableCell className="text-right">{formatVND(thu)}</TableCell><TableCell className="text-right">{formatVND(chi)}</TableCell><TableCell className="text-right text-muted-foreground">{formatVND(Number(d.thu_chua_gan_don))}</TableCell><TableCell className="text-right text-muted-foreground">{formatVND(Number(d.chi_chua_gan_don))}</TableCell><TableCell className={`text-right ${thu - chi < 0 ? "text-destructive" : "text-emerald-700"}`}>{formatVND(thu - chi)}</TableCell><TableCell className="text-right">{phanTram(thu, thu - chi)}</TableCell></TableRow>;
          })}
          </TableBody><tfoot><TableRow className="font-semibold"><TableCell>Cả năm {nam}</TableCell><TableCell className="text-right">{formatVND(tongThuNam)}</TableCell><TableCell className="text-right">{formatVND(tongChiNam)}</TableCell><TableCell className="text-right">{formatVND(theoThang.reduce((sum, d) => sum + Number(d.thu_chua_gan_don), 0))}</TableCell><TableCell className="text-right">{formatVND(theoThang.reduce((sum, d) => sum + Number(d.chi_chua_gan_don), 0))}</TableCell><TableCell className="text-right">{formatVND(tongThuNam - tongChiNam)}</TableCell><TableCell className="text-right">{phanTram(tongThuNam, tongThuNam - tongChiNam)}</TableCell></TableRow></tfoot></Table>}
      </CardContent></Card>
    </section>
  </div>;
}
