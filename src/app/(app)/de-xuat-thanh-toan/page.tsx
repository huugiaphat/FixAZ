import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { FormDeXuatThanhToan } from "@/components/thu-chi/form-de-xuat-thanh-toan";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatVND } from "@/lib/format";
import type { DeXuatThanhToan } from "@/types/database";

export default async function TrangDeXuatThanhToan({ searchParams }: {
  searchParams: Promise<{ trang?: string }>;
}) {
  await requireNhanVien();
  const { trang: trangParam } = await searchParams;
  const trang = Math.max(1, Math.min(100000, Number.parseInt(trangParam ?? "1", 10) || 1));
  const supabase = await createClient();
  const { data, count, error } = await supabase.from("de_xuat_thanh_toan")
    .select("*", { count: "exact" }).order("created_at", { ascending: false })
    .range((trang - 1) * 25, trang * 25 - 1);
  const danhSach = (data as DeXuatThanhToan[]) ?? [];
  const soTrang = Math.max(1, Math.ceil((count ?? 0) / 25));
  return <div className="space-y-5">
    <PageHeading title="Đề xuất thanh toán" description="Nhân viên lập phiếu chi tiết; Admin duyệt để ghi nhận khoản chi.">
      <FormDeXuatThanhToan />
    </PageHeading>
    {error && <p className="text-sm text-destructive">Không tải được đề xuất: {error.message}</p>}
    {!error && danhSach.length === 0 && <p className="text-sm text-muted-foreground">Chưa có đề xuất thanh toán.</p>}
    <div className="grid gap-3">{danhSach.map(dx => <Card key={dx.ma_dx}><CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="space-y-1">
        <Link href={`/de-xuat-thanh-toan/${encodeURIComponent(dx.ma_dx)}`} className="font-semibold text-primary hover:underline">{dx.ma_dx}</Link>
        <p className="text-sm text-muted-foreground">{dx.ten_cong_trinh ?? dx.ma_don ?? dx.noi_dung_chi} · {formatDateTime(dx.created_at)}</p>
      </div>
      <div className="flex items-center gap-3"><span className="font-semibold tabular-nums">{formatVND(dx.tong_tien)}</span><Badge variant="secondary">{dx.trang_thai}</Badge></div>
    </CardContent></Card>)}</div>
    {soTrang > 1 && <nav aria-label="Phân trang đề xuất" className="flex items-center justify-between text-sm">
      {trang > 1 ? <Link href={`/de-xuat-thanh-toan?trang=${trang - 1}`}>← Trang trước</Link> : <span />}
      <span>Trang {trang}/{soTrang}</span>
      {trang < soTrang ? <Link href={`/de-xuat-thanh-toan?trang=${trang + 1}`}>Trang sau →</Link> : <span />}
    </nav>}
  </div>;
}
