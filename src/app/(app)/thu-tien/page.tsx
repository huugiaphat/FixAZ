import Link from "next/link";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatVND } from "@/lib/format";
import type { DonHangTinhToan, VaiTro } from "@/types/database";

// Danh sách nhanh các đơn còn công nợ để thu tiền — mở đơn để vào tab
// "Thu tiền" ghi nhận khoản thu đầy đủ.
export default async function TrangThuTienNhanh() {
  const nv = await requireNhanVien(["Quản lý", "Kế toán", "Thợ"]);
  const supabase = await createClient();

  let query = supabase.from("v_don_hang").select("*").gt("cong_no", 0).order("ngay_tiep_nhan", { ascending: false });
  if (nv.vai_tro_app === ("Thợ" as VaiTro)) query = query.eq("tho_phu_trach", nv.ma_nv);
  const { data } = await query;
  const danhSach = (data as DonHangTinhToan[]) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Thu tiền — Đơn còn công nợ</h1>
      {danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Không có đơn nào còn công nợ.</p>
      ) : (
        <div className="space-y-2">
          {danhSach.map((d) => (
            <Link key={d.ma_don} href={`/don-hang/${d.ma_don}?tab=thu-tien`}>
              <Card className="hover:border-primary">
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{d.ma_don} — {d.mo_ta_su_co}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(d.ngay_tiep_nhan)}</p>
                  </div>
                  <p className="font-semibold text-destructive">{formatVND(d.cong_no)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
