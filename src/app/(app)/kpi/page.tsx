import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormKpiMoi } from "@/components/kpi/form-kpi-moi";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { KpiNhanVienTinhToan, NhanVien } from "@/types/database";

const MAU_XEP_LOAI: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  B: "bg-lime-100 text-lime-700 hover:bg-lime-100",
  C: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  D: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  E: "bg-red-100 text-red-700 hover:bg-red-100",
};

export default async function TrangKpi() {
  const nv = await requireNhanVien();
  const supabase = await createClient();

  const { data, error } = await supabase.from("v_kpi_nhan_vien").select("*").order("thang", { ascending: false });
  const danhSach = (data as KpiNhanVienTinhToan[]) ?? [];

  let tenNhanVien: Record<string, string> = {};
  if (nv.vai_tro_app === "Quản lý") {
    const { data: nvList } = await supabase.from("nhan_vien").select("*");
    tenNhanVien = Object.fromEntries(((nvList as NhanVien[]) ?? []).map((x) => [x.ma_nv, x.ho_ten]));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">KPI nhân viên</h1>
        {nv.vai_tro_app === "Quản lý" ? <FormKpiMoi /> : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive">Lỗi tải dữ liệu: {error.message}</p>
      ) : danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu KPI.</p>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {nv.vai_tro_app === "Quản lý" ? <TableHead>Nhân viên</TableHead> : null}
                  <TableHead>Tháng</TableHead>
                  <TableHead>Điểm tổng</TableHead>
                  <TableHead>Xếp loại</TableHead>
                  <TableHead>Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSach.map((k) => (
                  <TableRow key={k.ma_kpi}>
                    {nv.vai_tro_app === "Quản lý" ? <TableCell>{tenNhanVien[k.ma_nv] ?? k.ma_nv}</TableCell> : null}
                    <TableCell>{k.thang}</TableCell>
                    <TableCell>{k.diem_tong}</TableCell>
                    <TableCell>
                      <Badge className={MAU_XEP_LOAI[k.xep_loai]} variant="secondary">{k.xep_loai}</Badge>
                    </TableCell>
                    <TableCell className="max-w-64 truncate text-muted-foreground">{k.chi_tiet_diem ?? "—"}</TableCell>
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
