import { PageHeading } from "@/components/page-heading";
import Link from "next/link";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BadgeTrangThaiDon, BadgeUuTien } from "@/components/don-hang/badge-trang-thai";
import { formatDate, formatVND } from "@/lib/format";
import { Plus } from "lucide-react";
import type { DonHangTinhToan, KhachHang, NhanVien } from "@/types/database";

export default async function TrangDonHang() {
  const nv = await requireNhanVien(["Quản lý", "Admin", "CSKH-Điều phối", "Thợ", "Kế toán", "Kiểm soát"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_don_hang")
    .select("*")
    .order("ngay_tiep_nhan", { ascending: false })
    .limit(100);
  const danhSach = (data as DonHangTinhToan[]) ?? [];

  const maKhList = [...new Set(danhSach.map((d) => d.ma_kh))];
  const maNvList = [...new Set(danhSach.map((d) => d.tho_phu_trach).filter((x): x is string => !!x))];

  const [{ data: khList }, { data: nvList }] = await Promise.all([
    maKhList.length ? supabase.from("khach_hang").select("ma_kh, ho_ten, sdt").in("ma_kh", maKhList) : Promise.resolve({ data: [] }),
    maNvList.length ? supabase.from("nhan_vien").select("ma_nv, ho_ten").in("ma_nv", maNvList) : Promise.resolve({ data: [] }),
  ]);

  const khMap = new Map((khList as Pick<KhachHang, "ma_kh" | "ho_ten" | "sdt">[] | null ?? []).map((k) => [k.ma_kh, k]));
  const nvMap = new Map((nvList as Pick<NhanVien, "ma_nv" | "ho_ten">[] | null ?? []).map((n) => [n.ma_nv, n]));

  const duocTao = (nv.vai_tro_app === "Quản lý" || nv.vai_tro_app === "Admin") || nv.vai_tro_app === "CSKH-Điều phối";

  return (
    <div className="space-y-4">
      <PageHeading title="Đơn hàng" description="Theo dõi công việc từ tiếp nhận, thi công đến thanh toán.">
        {duocTao ? (
          <Button render={<Link href="/don-hang/moi" />} className="gap-2">
            <Plus className="h-4 w-4" /> Tạo đơn mới
          </Button>
        ) : null}
      </PageHeading>

      {error ? (
        <p className="text-sm text-destructive">Lỗi tải dữ liệu: {error.message}</p>
      ) : danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {nv.vai_tro_app === "Thợ" ? "Bạn chưa được điều phối đơn nào." : "Chưa có đơn hàng nào."}
        </p>
      ) : (
        <>
        <div className="grid gap-3 lg:hidden">
          {danhSach.map(d => <Link key={d.ma_don} href={`/don-hang/${d.ma_don}`} className="rounded-xl border bg-card p-4 hover:border-primary/50">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-primary">{d.ma_don}</span><BadgeTrangThaiDon trangThai={d.trang_thai} /></div>
            <h2 className="font-semibold leading-relaxed">{d.mo_ta_su_co}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{khMap.get(d.ma_kh)?.ho_ten ?? "Khách hàng"} · {d.dich_vu} · {d.qui_mo ?? "Sửa nhanh"}</p>
            <div className="my-3 flex items-center justify-between gap-2"><BadgeUuTien uuTien={d.uu_tien} /><span className="text-xs text-muted-foreground">{formatDate(d.ngay_tiep_nhan)}</span></div>
            <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm"><div><p className="text-xs text-muted-foreground">Tổng tiền</p><p className="mt-1 font-semibold tabular-nums">{formatVND(d.tong_tien)}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Công nợ</p><p className="mt-1 font-semibold tabular-nums text-destructive">{formatVND(d.cong_no)}</p></div></div>
          </Link>)}
        </div>
        <Card className="hidden overflow-hidden py-0 lg:flex">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Ngày tiếp nhận</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Loại dịch vụ</TableHead>
                  <TableHead>Qui mô</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead>Thợ phụ trách</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Công nợ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSach.map((d) => {
                  const kh = khMap.get(d.ma_kh);
                  const tho = d.tho_phu_trach ? nvMap.get(d.tho_phu_trach) : null;
                  return (
                    <TableRow key={d.ma_don}>
                      <TableCell>
                        <Link href={`/don-hang/${d.ma_don}`} className="font-medium text-primary hover:underline">
                          {d.ma_don}
                        </Link>
                        <p className="max-w-56 truncate text-xs text-muted-foreground">{d.mo_ta_su_co}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(d.ngay_tiep_nhan)}</TableCell>
                      <TableCell>
                        {kh ? (
                          <>
                            <p>{kh.ho_ten}</p>
                            <p className="text-xs text-muted-foreground">{kh.sdt}</p>
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{d.dich_vu}</TableCell>
                      <TableCell>{d.qui_mo ?? "Sửa nhanh"}</TableCell>
                      <TableCell>
                        <BadgeUuTien uuTien={d.uu_tien} />
                      </TableCell>
                      <TableCell>{tho?.ho_ten ?? d.tho_phu_trach ?? "—"}</TableCell>
                      <TableCell className="font-medium">{formatVND(d.tong_tien)}</TableCell>
                      <TableCell className={d.cong_no > 0 ? "text-destructive" : "text-emerald-600"}>
                        {formatVND(d.cong_no)}
                      </TableCell>
                      <TableCell>
                        <BadgeTrangThaiDon trangThai={d.trang_thai} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}
