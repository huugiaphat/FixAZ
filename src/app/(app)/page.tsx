import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dieuHuongTheoVaiTro, NHOM_DIEU_HUONG, MO_TA_MODULE } from "@/lib/nav-config";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeTrangThaiDon } from "@/components/don-hang/badge-trang-thai";
import { formatDate } from "@/lib/format";
import type { DonHang } from "@/types/database";

export default async function TrangChu() {
  const nv = await requireNhanVien();
  const supabase = await createClient();
  const mucNhanh = dieuHuongTheoVaiTro(nv.vai_tro_app).filter((m) => m.href !== "/");

  let donCuaToi: DonHang[] = [];
  if (nv.vai_tro_app === "Thợ") {
    const { data } = await supabase
      .from("don_hang")
      .select("*")
      .eq("tho_phu_trach", nv.ma_nv)
      .not("trang_thai", "in", '("Đã đóng","Đã hủy")')
      .order("ngay_tiep_nhan", { ascending: false })
      .limit(10);
    donCuaToi = (data as DonHang[]) ?? [];
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-l-4 border-primary bg-card p-5 sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Không gian làm việc</p>
        <h1 className="text-2xl font-semibold">Xin chào, {nv.ho_ten}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{nv.vai_tro_app} · Chọn công việc để bắt đầu ngày làm việc.</p>
      </div>

      {nv.vai_tro_app === "Thợ" ? (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Đơn của tôi đang xử lý</h2>
          {donCuaToi.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hiện chưa có đơn nào được điều phối cho bạn.</p>
          ) : (
            <div className="space-y-2">
              {donCuaToi.map((d) => (
                <Link key={d.ma_don} href={`/don-hang/${d.ma_don}`}>
                  <Card className="hover:border-primary">
                    <CardContent className="flex items-center justify-between gap-3 py-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{d.ma_don} — {d.mo_ta_su_co}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(d.ngay_tiep_nhan)} · {d.uu_tien}</p>
                      </div>
                      <BadgeTrangThaiDon trangThai={d.trang_thai} />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}
      {NHOM_DIEU_HUONG.map(nhom => {
        const muc = nhom.duongDan.flatMap(href => mucNhanh.filter(m => m.href === href));
        if (!muc.length) return null;
        return <section key={nhom.nhan} className="space-y-3">
          <h2 className="text-base font-semibold">{nhom.nhan}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {muc.map(m => { const Icon = m.icon; return <Link key={m.href} href={m.href} className="group flex items-start gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <span className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="size-5" /></span>
              <div className="min-w-0 flex-1"><p className="font-semibold">{m.nhan}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{MO_TA_MODULE[m.href]}</p></div>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
            </Link>; })}
          </div>
        </section>;
      })}


    </div>
  );
}
