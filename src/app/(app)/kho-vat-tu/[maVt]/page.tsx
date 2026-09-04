import { notFound } from "next/navigation";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatDateTime } from "@/lib/format";
import type { VatTuTinhToan, XuatNhapKho } from "@/types/database";

export default async function ChiTietVatTu({ params }: { params: Promise<{ maVt: string }> }) {
  await requireNhanVien(["Quản lý", "Kho", "Kiểm soát"]);
  const { maVt } = await params;
  const supabase = await createClient();

  const { data: vt } = await supabase.from("v_vat_tu").select("*").eq("ma_vt", maVt).single();
  if (!vt) notFound();
  const vatTu = vt as VatTuTinhToan;

  const { data: lichSu } = await supabase
    .from("xuat_nhap_kho")
    .select("*")
    .eq("ma_vt", maVt)
    .order("ngay_giao_dich", { ascending: false });
  const danhSach = (lichSu as XuatNhapKho[]) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{vatTu.ma_vt}</p>
        <h1 className="text-2xl font-semibold">{vatTu.ten}</h1>
      </div>

      <Card>
        <CardContent className="grid gap-3 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Quy cách</p>
            <p className="font-medium">{vatTu.quy_cach ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Đơn vị tính</p>
            <p className="font-medium">{vatTu.don_vi_tinh}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Giá vốn / Giá bán</p>
            <p className="font-medium">{formatVND(vatTu.gia_von)} / {formatVND(vatTu.gia_ban)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tồn kho hiện tại</p>
            <p className="text-xl font-semibold">{vatTu.ton_kho}</p>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Lịch sử nhập/xuất</h2>
        {danhSach.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có giao dịch nào.</p>
        ) : (
          <Card className="overflow-hidden py-0">
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Đơn liên quan</TableHead>
                    <TableHead>Người thực hiện</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {danhSach.map((xn) => (
                    <TableRow key={xn.ma_xn}>
                      <TableCell>{formatDateTime(xn.ngay_giao_dich)}</TableCell>
                      <TableCell>
                        <Badge variant={xn.loai === "Nhập" ? "secondary" : "outline"}>{xn.loai}</Badge>
                      </TableCell>
                      <TableCell>{xn.so_luong}</TableCell>
                      <TableCell>{xn.ma_don ?? "—"}</TableCell>
                      <TableCell>{xn.nguoi_thuc_hien}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
