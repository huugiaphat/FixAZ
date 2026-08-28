import Link from "next/link";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormKhachHangMoi } from "@/components/khach-hang/form-khach-hang";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { KhachHang } from "@/types/database";

export default async function TrangKhachHang({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const nv = await requireNhanVien(["Quản lý", "CSKH-Điều phối", "Kế toán"]);
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("khach_hang").select("*").order("ngay_tao", { ascending: false }).limit(100);
  if (q) query = query.or(`ho_ten.ilike.%${q}%,sdt.ilike.%${q}%,ma_kh.ilike.%${q}%`);
  const { data, error } = await query;
  const danhSach = (data as KhachHang[]) ?? [];

  const duocTao = nv.vai_tro_app === "Quản lý" || nv.vai_tro_app === "CSKH-Điều phối";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Khách hàng</h1>
        {duocTao ? <FormKhachHangMoi /> : null}
      </div>

      <form className="max-w-sm">
        <Input name="q" defaultValue={q} placeholder="Tìm theo tên, SĐT, mã khách hàng…" />
      </form>

      {error ? (
        <p className="text-sm text-destructive">Lỗi tải dữ liệu: {error.message}</p>
      ) : danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có khách hàng nào.</p>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã KH</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Điện thoại</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Nguồn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSach.map((kh) => (
                  <TableRow key={kh.ma_kh} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/khach-hang/${kh.ma_kh}`} className="font-medium text-primary hover:underline">
                        {kh.ma_kh}
                      </Link>
                    </TableCell>
                    <TableCell>{kh.ho_ten}</TableCell>
                    <TableCell>{kh.sdt}</TableCell>
                    <TableCell className="max-w-64 truncate">{kh.dia_chi}</TableCell>
                    <TableCell className="text-muted-foreground">{kh.nguon ?? "—"}</TableCell>
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
