import Link from "next/link";
import { notFound } from "next/navigation";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeTrangThaiDon } from "@/components/don-hang/badge-trang-thai";
import { formatDate, formatDateTime } from "@/lib/format";
import type { DonHang, KhachHang } from "@/types/database";

export default async function ChiTietKhachHang({ params }: { params: Promise<{ maKh: string }> }) {
  await requireNhanVien(["Quản lý", "CSKH-Điều phối", "Kế toán", "Kiểm soát"]);
  const { maKh } = await params;
  const supabase = await createClient();

  const { data: kh } = await supabase.from("khach_hang").select("*").eq("ma_kh", maKh).single();
  if (!kh) notFound();
  const khachHang = kh as KhachHang;

  const { data: donList } = await supabase
    .from("don_hang")
    .select("*")
    .eq("ma_kh", maKh)
    .order("ngay_tiep_nhan", { ascending: false });
  const danhSachDon = (donList as DonHang[]) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{khachHang.ma_kh}</p>
        <h1 className="text-2xl font-semibold">{khachHang.ho_ten}</h1>
      </div>

      <Card>
        <CardContent className="grid gap-3 py-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Điện thoại</p>
            <p className="font-medium">{khachHang.sdt}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nguồn tiếp cận</p>
            <p className="font-medium">{khachHang.nguon ?? "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Địa chỉ</p>
            <p className="font-medium">{khachHang.dia_chi}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ngày tạo</p>
            <p className="font-medium">{formatDateTime(khachHang.ngay_tao)}</p>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Lịch sử đơn hàng ({danhSachDon.length})
        </h2>
        {danhSachDon.length === 0 ? (
          <p className="text-sm text-muted-foreground">Khách hàng chưa có đơn hàng nào.</p>
        ) : (
          <div className="space-y-2">
            {danhSachDon.map((d) => (
              <Link key={d.ma_don} href={`/don-hang/${d.ma_don}`}>
                <Card className="hover:border-primary">
                  <CardContent className="flex items-center justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{d.ma_don} — {d.mo_ta_su_co}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(d.ngay_tiep_nhan)} · {d.dich_vu}</p>
                    </div>
                    <BadgeTrangThaiDon trangThai={d.trang_thai} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
