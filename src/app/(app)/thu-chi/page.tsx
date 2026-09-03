import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormThuChiMoi } from "@/components/thu-chi/form-thu-chi-moi";
import { BoLocThuChi } from "@/components/thu-chi/bo-loc-thu-chi";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatDateTime } from "@/lib/format";
import type { ThuChi } from "@/types/database";

type ThuChiVoiDon = ThuChi & { don_hang: { mo_ta_su_co: string } | null };

export default async function TrangThuChi({
  searchParams,
}: {
  searchParams: Promise<{ tu?: string; den?: string; loai?: string }>;
}) {
  await requireNhanVien(["Quản lý", "Kế toán"]);
  const { tu, den, loai } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("thu_chi")
    .select("*, don_hang(mo_ta_su_co)")
    .order("ngay", { ascending: false })
    .limit(200);
  if (tu) query = query.gte("ngay", tu);
  if (den) query = query.lte("ngay", `${den}T23:59:59`);
  if (loai === "Thu" || loai === "Chi") query = query.eq("loai", loai);

  const { data, error } = await query;
  const danhSach = (data as ThuChiVoiDon[]) ?? [];

  const tongThu = danhSach.filter((tc) => tc.loai === "Thu").reduce((s, tc) => s + tc.so_tien, 0);
  const tongChi = danhSach.filter((tc) => tc.loai === "Chi").reduce((s, tc) => s + tc.so_tien, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Sổ thu chi</h1>
        <FormThuChiMoi />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Tổng thu (đang lọc)</p>
            <p className="text-xl font-semibold text-emerald-600">{formatVND(tongThu)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Tổng chi (đang lọc)</p>
            <p className="text-xl font-semibold text-destructive">{formatVND(tongChi)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Chênh lệch</p>
            <p className={`text-xl font-semibold ${tongThu - tongChi >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {formatVND(tongThu - tongChi)}
            </p>
          </CardContent>
        </Card>
      </div>

      <BoLocThuChi tu={tu} den={den} loai={loai} />

      {error ? (
        <p className="text-sm text-destructive">Lỗi tải dữ liệu: {error.message}</p>
      ) : danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có khoản thu chi nào.</p>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Tên công trình</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSach.map((tc) => (
                  <TableRow key={tc.ma_tc}>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={tc.loai === "Thu" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-red-100 text-red-700 hover:bg-red-100"}
                      >
                        {tc.loai}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-56 truncate">
                      {tc.don_hang?.mo_ta_su_co ?? tc.ten_cong_trinh ?? "—"}
                    </TableCell>
                    <TableCell>{tc.noi_dung_thu ?? tc.noi_dung_chi}</TableCell>
                    <TableCell className={tc.loai === "Thu" ? "text-emerald-600" : "text-destructive"}>
                      {tc.loai === "Thu" ? "+" : "-"}{formatVND(tc.so_tien)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tc.phuong_thuc}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(tc.ngay)}</TableCell>
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
