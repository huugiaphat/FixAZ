import Link from "next/link";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormMauBaoGiaMoi } from "@/components/mau-bao-gia/form-mau-bao-gia-moi";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatDateTime } from "@/lib/format";
import type { MauBaoGiaTinhToan } from "@/types/database";

type MauBaoGiaVoiQuanHe = MauBaoGiaTinhToan & { nhan_vien: { ho_ten: string } | null };

export default async function TrangMauBaoGia() {
  const nv = await requireNhanVien(["Quản lý", "CSKH-Điều phối", "Kế toán", "Kiểm soát"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_mau_bao_gia")
    .select("*, nhan_vien(ho_ten)")
    .order("created_at", { ascending: false })
    .limit(1000);
  const danhSach = (data as MauBaoGiaVoiQuanHe[]) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mẫu báo giá</h1>
        {nv.vai_tro_app !== "Kiểm soát" ? <FormMauBaoGiaMoi /> : null}
      </div>
      <p className="text-sm text-muted-foreground">
        Báo giá sơ bộ gửi khách hàng tham khảo trước khi có đơn hàng. Khi khách đồng ý, liên kết mẫu báo giá với đơn hàng tương ứng.
      </p>

      {error ? (
        <p className="text-sm text-destructive">Lỗi tải dữ liệu: {error.message}</p>
      ) : danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có mẫu báo giá nào.</p>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Người tạo</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSach.map((mbg) => (
                  <TableRow key={mbg.ma_mbg} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link href={`/mau-bao-gia/${mbg.ma_mbg}`} className="hover:underline">
                        {mbg.ma_mbg}
                      </Link>
                    </TableCell>
                    <TableCell>{mbg.ten_khach_hang}</TableCell>
                    <TableCell className="text-muted-foreground">{mbg.sdt ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{mbg.dich_vu ?? "—"}</TableCell>
                    <TableCell>{formatVND(mbg.tong_tien)}</TableCell>
                    <TableCell>
                      {mbg.ma_don ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          Đã liên kết {mbg.ma_don}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Chưa liên kết</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{mbg.nhan_vien?.ho_ten ?? mbg.nguoi_tao}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(mbg.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
