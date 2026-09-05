import Link from "next/link";
import { notFound } from "next/navigation";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormThemDong } from "@/components/mau-bao-gia/form-them-dong";
import { NutXoaDong } from "@/components/mau-bao-gia/nut-xoa-dong";
import { NutLienKetDonHang } from "@/components/mau-bao-gia/nut-lien-ket-don-hang";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVND, formatDateTime } from "@/lib/format";
import { Printer } from "lucide-react";
import type { MauBaoGiaTinhToan, MauBaoGiaDongTinhToan } from "@/types/database";

type MauBaoGiaChiTiet = MauBaoGiaTinhToan & {
  nhan_vien: { ho_ten: string } | null;
  don_hang: { mo_ta_su_co: string; trang_thai: string } | null;
};

export default async function TrangChiTietMauBaoGia({ params }: { params: Promise<{ ma: string }> }) {
  const nv = await requireNhanVien(["Quản lý", "CSKH-Điều phối", "Kế toán", "Kiểm soát"]);
  const { ma } = await params;
  const supabase = await createClient();

  const { data: mbg } = await supabase
    .from("v_mau_bao_gia")
    .select("*, nhan_vien(ho_ten), don_hang(mo_ta_su_co, trang_thai)")
    .eq("ma_mbg", ma)
    .maybeSingle();
  if (!mbg) notFound();
  const chiTiet = mbg as MauBaoGiaChiTiet;

  const { data: dong } = await supabase
    .from("v_mau_bao_gia_dong")
    .select("*")
    .eq("ma_mbg", ma)
    .order("created_at", { ascending: true });
  const danhSachDong = (dong as MauBaoGiaDongTinhToan[]) ?? [];

  const coTheSua = nv.vai_tro_app !== "Kiểm soát";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{chiTiet.ma_mbg}</h1>
          <p className="text-sm text-muted-foreground">Tạo lúc {formatDateTime(chiTiet.created_at)} bởi {chiTiet.nhan_vien?.ho_ten ?? chiTiet.nguoi_tao}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/mau-bao-gia/${chiTiet.ma_mbg}/in`} target="_blank">
            <Button variant="outline" className="gap-2">
              <Printer className="h-4 w-4" /> In báo giá
            </Button>
          </Link>
          {coTheSua ? <NutLienKetDonHang maMbg={chiTiet.ma_mbg} maDonHienTai={chiTiet.ma_don} /> : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin khách hàng</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Khách hàng</p>
            <p className="font-medium">{chiTiet.ten_khach_hang}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Số điện thoại</p>
            <p className="font-medium">{chiTiet.sdt ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Địa chỉ</p>
            <p className="font-medium">{chiTiet.dia_chi ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dịch vụ</p>
            <p className="font-medium">{chiTiet.dich_vu ?? "—"}</p>
          </div>
          {chiTiet.ghi_chu ? (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">Ghi chú</p>
              <p className="font-medium whitespace-pre-wrap">{chiTiet.ghi_chu}</p>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <p className="text-sm text-muted-foreground">Liên kết đơn hàng</p>
            {chiTiet.ma_don ? (
              <Link href={`/don-hang/${chiTiet.ma_don}`} className="inline-block">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  {chiTiet.ma_don} — {chiTiet.don_hang?.mo_ta_su_co} ({chiTiet.don_hang?.trang_thai})
                </Badge>
              </Link>
            ) : (
              <Badge variant="secondary">Chưa liên kết</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden py-0">
        <CardHeader className="flex-row items-center justify-between border-b py-4">
          <CardTitle className="text-base">Hạng mục</CardTitle>
          {coTheSua ? <FormThemDong maMbg={chiTiet.ma_mbg} /> : null}
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {danhSachDong.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Chưa có hạng mục nào.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nội dung công việc</TableHead>
                  <TableHead>ĐVT</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Đơn giá</TableHead>
                  <TableHead>Thành tiền</TableHead>
                  {coTheSua ? <TableHead className="w-10" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSachDong.map((d) => (
                  <TableRow key={d.ma_dong}>
                    <TableCell>{d.ten_hang_muc}</TableCell>
                    <TableCell className="text-muted-foreground">{d.don_vi_tinh ?? "—"}</TableCell>
                    <TableCell>{d.so_luong}</TableCell>
                    <TableCell>{formatVND(d.don_gia)}</TableCell>
                    <TableCell className="font-medium">{formatVND(d.thanh_tien)}</TableCell>
                    {coTheSua ? (
                      <TableCell>
                        <NutXoaDong maDong={d.ma_dong} />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <div className="rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">Tổng cộng</p>
          <p className="text-xl font-semibold">{formatVND(chiTiet.tong_tien)}</p>
        </div>
      </div>
    </div>
  );
}
