import Link from "next/link";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeTrangThaiDon } from "@/components/don-hang/badge-trang-thai";
import { formatDate } from "@/lib/format";
import type { DonHang } from "@/types/database";

// Danh sách nhanh các đơn của Thợ cần nghiệm thu — mở đơn để vào tab
// "Nghiệm thu" lập biên bản đầy đủ (checklist 6 mục + ảnh + đánh giá).
export default async function TrangNghiemThuNhanh() {
  const nv = await requireNhanVien(["Thợ", "Kiểm soát"]);
  const supabase = await createClient();

  let query = supabase
    .from("don_hang")
    .select("*")
    .in("trang_thai", ["Đang thi công", "Chờ nghiệm thu"])
    .order("ngay_tiep_nhan", { ascending: false });
  if (nv.vai_tro_app === "Thợ") query = query.eq("tho_phu_trach", nv.ma_nv);
  const { data } = await query;
  const danhSach = (data as DonHang[]) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nghiệm thu</h1>
      {danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Không có đơn nào đang chờ nghiệm thu.</p>
      ) : (
        <div className="space-y-2">
          {danhSach.map((d) => (
            <Link key={d.ma_don} href={`/don-hang/${d.ma_don}?tab=nghiem-thu`}>
              <Card className="hover:border-primary">
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{d.ma_don} — {d.mo_ta_su_co}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(d.ngay_tiep_nhan)}</p>
                  </div>
                  <BadgeTrangThaiDon trangThai={d.trang_thai} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
