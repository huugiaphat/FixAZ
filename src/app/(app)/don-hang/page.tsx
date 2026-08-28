import Link from "next/link";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeTrangThaiDon, BadgeUuTien } from "@/components/don-hang/badge-trang-thai";
import { formatDate } from "@/lib/format";
import { Plus } from "lucide-react";
import type { DonHang } from "@/types/database";

export default async function TrangDonHang() {
  const nv = await requireNhanVien(["Quản lý", "CSKH-Điều phối", "Thợ", "Kế toán"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("don_hang")
    .select("*")
    .order("ngay_tiep_nhan", { ascending: false })
    .limit(100);
  const danhSach = (data as DonHang[]) ?? [];

  const duocTao = nv.vai_tro_app === "Quản lý" || nv.vai_tro_app === "CSKH-Điều phối";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Đơn hàng</h1>
        {duocTao ? (
          <Button render={<Link href="/don-hang/moi" />} className="gap-2">
            <Plus className="h-4 w-4" /> Tạo đơn mới
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive">Lỗi tải dữ liệu: {error.message}</p>
      ) : danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {nv.vai_tro_app === "Thợ" ? "Bạn chưa được điều phối đơn nào." : "Chưa có đơn hàng nào."}
        </p>
      ) : (
        <div className="space-y-2">
          {danhSach.map((d) => (
            <Link key={d.ma_don} href={`/don-hang/${d.ma_don}`}>
              <Card className="hover:border-primary">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{d.ma_don} — {d.mo_ta_su_co}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(d.ngay_tiep_nhan)} · {d.dich_vu}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BadgeUuTien uuTien={d.uu_tien} />
                    <BadgeTrangThaiDon trangThai={d.trang_thai} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
