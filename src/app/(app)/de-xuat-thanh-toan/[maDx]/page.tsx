import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { FormDeXuatThanhToan } from "@/components/thu-chi/form-de-xuat-thanh-toan";
import { ThaoTacDeXuat } from "@/components/thu-chi/thao-tac-de-xuat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatVND } from "@/lib/format";
import type { DeXuatThanhToan, DeXuatThanhToanDong } from "@/types/database";

export default async function ChiTietDeXuat({ params }: { params: Promise<{ maDx: string }> }) {
  const nv = await requireNhanVien();
  const { maDx } = await params;
  const supabase = await createClient();
  const [{ data, error }, { data: dongData, error: dongError }] = await Promise.all([
    supabase.from("de_xuat_thanh_toan").select("*").eq("ma_dx", maDx).single(),
    supabase.from("de_xuat_thanh_toan_dong").select("*").eq("ma_dx", maDx).order("thu_tu"),
  ]);
  if (error || !data) notFound();
  const dx = data as DeXuatThanhToan;
  const dong = (dongData as DeXuatThanhToanDong[]) ?? [];
  const laAdmin = nv.vai_tro_app === "Admin";
  const nguoiLap = dx.nguoi_de_xuat === nv.ma_nv;
  const duocSua = (dx.trang_thai === "Chờ duyệt" && (nguoiLap || laAdmin))
    || (dx.trang_thai === "Đã duyệt" && laAdmin);
  return <div className="space-y-5">
    <Link href="/de-xuat-thanh-toan" className="text-sm text-primary hover:underline">← Danh sách đề xuất</Link>
    <PageHeading title={dx.ma_dx} description="Chi tiết đề xuất thanh toán">
      {duocSua && !dongError && dong.length > 0 && <FormDeXuatThanhToan maDx={dx.ma_dx} banDau={{
        ma_don: dx.ma_don ?? "", ten_cong_trinh: dx.ten_cong_trinh ?? "",
        noi_dung_chi: dx.noi_dung_chi,
        phuong_thuc: dx.phuong_thuc === "Chuyển khoản" ? "Chuyển khoản" : "Tiền mặt",
        ghi_chu: dx.ghi_chu ?? "",
        dong: dong.map(item => ({ ten_hh_dv: item.ten_hh_dv, don_gia: item.don_gia, so_luong: item.so_luong })),
      }} />}
    </PageHeading>
    {dongError && <p className="text-sm text-destructive">Không tải được chi tiết: {dongError.message}</p>}
    <Card><CardContent className="space-y-3 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="secondary">{dx.trang_thai}</Badge><strong className="text-xl">{formatVND(dx.tong_tien)}</strong></div>
      <p><span className="text-muted-foreground">Danh mục:</span> {dx.noi_dung_chi}</p>
      <p><span className="text-muted-foreground">Công trình:</span> {dx.ten_cong_trinh ?? dx.ma_don ?? "Không gắn công trình"}</p>
      <p><span className="text-muted-foreground">Phương thức:</span> {dx.phuong_thuc}</p>
      <p><span className="text-muted-foreground">Người đề xuất:</span> {dx.nguoi_de_xuat} · {formatDateTime(dx.created_at)}</p>
      {dx.ghi_chu && <p className="whitespace-pre-wrap"><span className="text-muted-foreground">Mô tả:</span> {dx.ghi_chu}</p>}
      {dx.duyet_luc && <p><span className="text-muted-foreground">Duyệt lúc:</span> {formatDateTime(dx.duyet_luc)}</p>}
      {dx.ma_tc && <p><span className="text-muted-foreground">Phiếu chi:</span> {["Admin", "Quản lý", "Kế toán", "Kiểm soát"].includes(nv.vai_tro_app)
        ? <Link href="/thu-chi" className="text-primary hover:underline">{dx.ma_tc}</Link> : dx.ma_tc}</p>}
      {dx.trang_thai === "Chờ duyệt" && <ThaoTacDeXuat maDx={dx.ma_dx} laAdmin={laAdmin} nguoiLap={nguoiLap} />}
    </CardContent></Card>
    {!dongError && <Card><CardContent className="overflow-x-auto py-5">
      <table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b text-left">
        <th className="py-2 pr-3">Tên HH/DV</th><th className="py-2 pr-3 text-right">Đơn giá</th>
        <th className="py-2 pr-3 text-right">Số lượng</th><th className="py-2 text-right">Thành tiền</th>
      </tr></thead><tbody>{dong.map(item => <tr key={item.id} className="border-b last:border-0">
        <td className="py-2 pr-3">{item.ten_hh_dv}</td><td className="py-2 pr-3 text-right tabular-nums">{formatVND(item.don_gia)}</td>
        <td className="py-2 pr-3 text-right tabular-nums">{item.so_luong}</td><td className="py-2 text-right tabular-nums">{formatVND(item.thanh_tien)}</td>
      </tr>)}</tbody></table>
    </CardContent></Card>}
  </div>;
}
