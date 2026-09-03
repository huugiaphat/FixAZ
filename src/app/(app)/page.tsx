import Link from "next/link";
import { ChevronRight, ClipboardList, ClipboardCheck, Wallet, CalendarRange } from "lucide-react";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dieuHuongTheoVaiTro } from "@/lib/nav-config";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeTrangThaiDon } from "@/components/don-hang/badge-trang-thai";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDate, formatVND } from "@/lib/format";
import type { DonHang, TongHopDashboard, ThuChiTongHop } from "@/types/database";

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

  let tongHop: TongHopDashboard | null = null;
  let thuChi: ThuChiTongHop | null = null;
  if (nv.vai_tro_app === "Quản lý") {
    const [{ data: d1 }, { data: d2 }] = await Promise.all([
      supabase.from("v_tong_hop_dashboard").select("*").single(),
      supabase.from("v_thu_chi_tong_hop").select("*").single(),
    ]);
    tongHop = d1 as TongHopDashboard | null;
    thuChi = d2 as ThuChiTongHop | null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Xin chào, {nv.ho_ten} 👋</h1>
        <p className="text-muted-foreground">{nv.vai_tro_app} — {nv.chuc_vu}</p>
      </div>

      {tongHop ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Tổng quan nhanh (tháng {new Date().getMonth() + 1})</h2>
            <Link href="/dashboard" className="flex items-center text-sm font-medium text-primary hover:underline">
              Xem đầy đủ <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={ClipboardList} nhan="Đơn tạo mới" giaTri={String(tongHop.don_moi_thang)} />
            <StatCard icon={ClipboardCheck} nhan="Đơn hoàn thành" giaTri={String(tongHop.don_hoan_thanh_thang)} />
            <StatCard icon={Wallet} nhan="Doanh thu" giaTri={formatVND(tongHop.doanh_thu_thang)} />
            {thuChi ? (
              <StatCard
                icon={CalendarRange}
                nhan="Thu chi tháng này"
                giaTri={formatVND(thuChi.thu_thang_nay - thuChi.chi_thang_nay)}
                mucCanhBao={thuChi.thu_thang_nay - thuChi.chi_thang_nay >= 0 ? "xanh" : "do"}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Truy cập nhanh</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {mucNhanh.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.href} href={m.href}>
                <Card className="h-full transition-colors hover:border-primary hover:bg-primary/5">
                  <CardContent className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                    <Icon className="h-7 w-7 text-primary" />
                    <span className="text-sm font-medium">{m.nhan}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

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
    </div>
  );
}
