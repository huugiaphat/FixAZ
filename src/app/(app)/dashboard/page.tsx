import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatVND } from "@/lib/format";
import type { TongHopDashboard } from "@/types/database";
import {
  UserPlus,
  ClipboardList,
  ClipboardCheck,
  Wallet,
  Banknote,
  CircleDollarSign,
  Clock,
  ShieldCheck,
  MessageCircleWarning,
  TrendingUp,
  RotateCcw,
  PiggyBank,
} from "lucide-react";

export default async function TrangDashboard() {
  await requireNhanVien(["Quản lý"]);
  const supabase = await createClient();

  const [{ data: tongHop }, { data: khMoiThang }] = await Promise.all([
    supabase.from("v_tong_hop_dashboard").select("*").single(),
    supabase
      .from("khach_hang")
      .select("ma_kh", { count: "exact", head: true })
      .gte("ngay_tao", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  const d = tongHop as TongHopDashboard | null;
  const soKhachMoi = khMoiThang as unknown as { count: number } | null;

  if (!d) {
    return <p className="text-sm text-muted-foreground">Chưa có dữ liệu để hiển thị.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Số liệu tháng {new Date().getMonth() + 1}/{new Date().getFullYear()} — Mục 8 tài liệu yêu cầu. Ngưỡng màu bên dưới là gợi ý minh họa, công ty có thể yêu cầu tinh chỉnh khi có số liệu chính thức.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Kinh doanh</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={UserPlus} nhan="Khách hàng mới (tháng)" giaTri={String(soKhachMoi?.count ?? 0)} />
          <StatCard icon={ClipboardList} nhan="Đơn tạo mới (tháng)" giaTri={String(d.don_moi_thang)} />
          <StatCard icon={ClipboardCheck} nhan="Đơn hoàn thành (tháng)" giaTri={String(d.don_hoan_thanh_thang)} />
          <StatCard icon={Wallet} nhan="Doanh thu (tháng)" giaTri={formatVND(d.doanh_thu_thang)} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Tài chính</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={Banknote} nhan="Đã thu (tháng)" giaTri={formatVND(d.da_thu_thang)} />
          <StatCard
            icon={CircleDollarSign}
            nhan="Công nợ hiện tại"
            giaTri={formatVND(d.cong_no_hien_tai)}
            mucCanhBao={d.cong_no_hien_tai <= 0 ? "xanh" : d.cong_no_hien_tai < d.doanh_thu_thang * 0.2 ? "vang" : "do"}
          />
          <StatCard
            icon={PiggyBank}
            nhan="Biên lợi nhuận tạm tính"
            giaTri={`${d.bien_loi_nhuan}%`}
            mucCanhBao={d.bien_loi_nhuan >= 20 ? "xanh" : d.bien_loi_nhuan >= 10 ? "vang" : "do"}
            ghiChu="Xấp xỉ — chưa gồm chi phí nhân công/vận hành"
            phanTram={d.bien_loi_nhuan}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Vận hành & Chất lượng</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            icon={Clock}
            nhan="Đơn đang trễ hẹn"
            giaTri={String(d.don_tre)}
            mucCanhBao={d.don_tre === 0 ? "xanh" : d.don_tre <= 2 ? "vang" : "do"}
          />
          <StatCard
            icon={ShieldCheck}
            nhan="Bảo hành đang xử lý"
            giaTri={String(d.bao_hanh_dang_xu_ly)}
            mucCanhBao={d.bao_hanh_dang_xu_ly === 0 ? "xanh" : "vang"}
          />
          <StatCard
            icon={MessageCircleWarning}
            nhan="Khiếu nại đang xử lý"
            giaTri={String(d.khieu_nai_dang_xu_ly)}
            mucCanhBao={d.khieu_nai_dang_xu_ly === 0 ? "xanh" : d.khieu_nai_dang_xu_ly <= 2 ? "vang" : "do"}
          />
          <StatCard
            icon={TrendingUp}
            nhan="Tỷ lệ chuyển đổi báo giá"
            giaTri={`${d.ty_le_chuyen_doi}%`}
            mucCanhBao={d.ty_le_chuyen_doi >= 50 ? "xanh" : d.ty_le_chuyen_doi >= 30 ? "vang" : "do"}
            phanTram={d.ty_le_chuyen_doi}
          />
          <StatCard
            icon={RotateCcw}
            nhan="Tỷ lệ sửa lại"
            giaTri={`${d.ty_le_sua_lai}%`}
            mucCanhBao={d.ty_le_sua_lai <= 5 ? "xanh" : d.ty_le_sua_lai <= 15 ? "vang" : "do"}
            phanTram={d.ty_le_sua_lai}
          />
        </div>
      </section>
    </div>
  );
}
