import Link from "next/link";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BadgeTrangThaiDon, BadgeUuTien } from "@/components/don-hang/badge-trang-thai";
import { formatDate, formatDateTime } from "@/lib/format";
import type { DonHang, DieuPhoi, NhanVien } from "@/types/database";

export default async function TrangDieuPhoi() {
  await requireNhanVien(["Quản lý", "CSKH-Điều phối", "Kiểm soát"]);
  const supabase = await createClient();

  const [{ data: chuaDieuPhoi }, { data: dangXuLy }] = await Promise.all([
    supabase
      .from("don_hang")
      .select("*")
      .eq("trang_thai", "Mới tiếp nhận")
      .order("uu_tien")
      .order("ngay_tiep_nhan"),
    supabase
      .from("dieu_phoi")
      .select("*")
      .neq("trang_thai", "Hoàn thành")
      .order("eta"),
  ]);

  const danhSachChuaDieuPhoi = (chuaDieuPhoi as DonHang[]) ?? [];
  const danhSachDangXuLy = (dangXuLy as DieuPhoi[]) ?? [];

  const maDonLienQuan = danhSachDangXuLy.map((dp) => dp.ma_don);
  const maThoLienQuan = danhSachDangXuLy.map((dp) => dp.tho);

  const [{ data: donLienQuan }, { data: thoLienQuan }] = await Promise.all([
    maDonLienQuan.length
      ? supabase.from("don_hang").select("ma_don, mo_ta_su_co, uu_tien, trang_thai").in("ma_don", maDonLienQuan)
      : Promise.resolve({ data: [] as Pick<DonHang, "ma_don" | "mo_ta_su_co" | "uu_tien" | "trang_thai">[] }),
    maThoLienQuan.length
      ? supabase.from("nhan_vien").select("ma_nv, ho_ten").in("ma_nv", maThoLienQuan)
      : Promise.resolve({ data: [] as Pick<NhanVien, "ma_nv" | "ho_ten">[] }),
  ]);

  const donTheoMa = new Map((donLienQuan ?? []).map((d) => [d.ma_don, d]));
  const thoTheoMa = new Map((thoLienQuan ?? []).map((t) => [t.ma_nv, t.ho_ten]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Điều phối</h1>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Đơn chưa điều phối ({danhSachChuaDieuPhoi.length})</h2>
        {danhSachChuaDieuPhoi.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có đơn nào đang chờ điều phối.</p>
        ) : (
          <div className="space-y-2">
            {danhSachChuaDieuPhoi.map((d) => (
              <Link key={d.ma_don} href={`/don-hang/${d.ma_don}`}>
                <Card className="hover:border-primary">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{d.ma_don} — {d.mo_ta_su_co}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(d.ngay_tiep_nhan)} · {d.dich_vu}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <BadgeUuTien uuTien={d.uu_tien} />
                      <BadgeTrangThaiDon trangThai={d.trang_thai} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Đang điều phối / thi công ({danhSachDangXuLy.length})</h2>
        {danhSachDangXuLy.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có đơn nào đang được xử lý ngoài hiện trường.</p>
        ) : (
          <Card className="overflow-hidden py-0">
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Đơn hàng</TableHead>
                    <TableHead>Thợ</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {danhSachDangXuLy.map((dp) => {
                    const don = donTheoMa.get(dp.ma_don);
                    return (
                      <TableRow key={dp.ma_dp}>
                        <TableCell>
                          <Link href={`/don-hang/${dp.ma_don}`} className="font-medium hover:underline">
                            {dp.ma_don}
                          </Link>
                          {don ? <p className="truncate text-sm text-muted-foreground">{don.mo_ta_su_co}</p> : null}
                        </TableCell>
                        <TableCell>{thoTheoMa.get(dp.tho) ?? dp.tho}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(dp.eta)}</TableCell>
                        <TableCell><Badge variant="secondary">{dp.trang_thai}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
