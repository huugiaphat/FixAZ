import Link from "next/link";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FormVatTuMoi } from "@/components/kho-vat-tu/form-vat-tu-moi";
import { FormXuatNhapKho } from "@/components/kho-vat-tu/form-xuat-nhap-kho";
import { formatVND } from "@/lib/format";
import type { VatTuTinhToan } from "@/types/database";

export default async function TrangKhoVatTu() {
  await requireNhanVien(["Quản lý", "Kho"]);
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_vat_tu").select("*").order("ten");
  const danhSach = (data as VatTuTinhToan[]) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Kho vật tư</h1>
        <div className="flex gap-2">
          <FormXuatNhapKho danhSachVatTu={danhSach} />
          <FormVatTuMoi />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive">Lỗi tải dữ liệu: {error.message}</p>
      ) : danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có vật tư nào.</p>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên vật tư</TableHead>
                  <TableHead>Quy cách</TableHead>
                  <TableHead>ĐVT</TableHead>
                  <TableHead>Giá vốn</TableHead>
                  <TableHead>Giá bán</TableHead>
                  <TableHead>Tồn kho</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSach.map((vt) => {
                  const tonThap = vt.nguong_canh_bao_ton != null && vt.ton_kho < vt.nguong_canh_bao_ton;
                  return (
                    <TableRow key={vt.ma_vt}>
                      <TableCell>
                        <Link href={`/kho-vat-tu/${vt.ma_vt}`} className="font-medium text-primary hover:underline">
                          {vt.ten}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{vt.quy_cach ?? "—"}</TableCell>
                      <TableCell>{vt.don_vi_tinh}</TableCell>
                      <TableCell>{formatVND(vt.gia_von)}</TableCell>
                      <TableCell>{formatVND(vt.gia_ban)}</TableCell>
                      <TableCell>
                        {tonThap ? (
                          <Badge variant="destructive">{vt.ton_kho} (thấp)</Badge>
                        ) : (
                          <span>{vt.ton_kho}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
