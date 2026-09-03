import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { ThanhNgang } from "@/components/dashboard/thanh-ngang";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatVND } from "@/lib/format";
import {
  doanhThuTheoThang,
  doanhThuTheoDichVu,
  demTheoTrangThai,
  demTheoUuTien,
  hieuSuatTheoTho,
  demTheoThanhToan,
  phanBoDanhGia,
} from "@/lib/dashboard-analytics";
import type { TongHopDashboard, ThuChiTongHop, DonHangTinhToan, NghiemThu, NhanVien } from "@/types/database";
import { UserPlus, ClipboardList, ClipboardCheck, Wallet, Coins, CalendarDays, CalendarRange } from "lucide-react";

const MAU_THANH_TRANG_THAI: Record<string, string> = {
  "Mới tiếp nhận": "bg-slate-400",
  "Đã điều phối": "bg-blue-500",
  "Đang khảo sát": "bg-indigo-500",
  "Chờ duyệt báo giá": "bg-amber-500",
  "Đang thi công": "bg-orange-500",
  "Chờ nghiệm thu": "bg-purple-500",
  "Đã nghiệm thu - chờ thu tiền": "bg-cyan-500",
  "Đã đóng": "bg-emerald-500",
  "Đã hủy": "bg-red-500",
};
const MAU_THANH_UU_TIEN: Record<string, string> = {
  "P1-Khẩn cấp": "bg-red-500",
  "P2-Trong ngày": "bg-amber-500",
  "P3-Đặt lịch": "bg-slate-400",
};
const MAU_PILL_THANH_TOAN: Record<string, string> = {
  "Đã thu đủ": "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  "Thu một phần": "bg-amber-100 text-amber-700 hover:bg-amber-100",
  "Chưa thu": "bg-red-100 text-red-700 hover:bg-red-100",
  "Chưa đến bước thanh toán": "bg-slate-100 text-slate-600 hover:bg-slate-100",
};

export default async function TrangDashboard() {
  await requireNhanVien(["Quản lý"]);
  const supabase = await createClient();

  const [{ data: tongHop }, { data: khMoiThang }, { data: thuChi }, { data: allDon }, { data: allNghiemThu }, { data: allNv }] =
    await Promise.all([
      supabase.from("v_tong_hop_dashboard").select("*").single(),
      supabase
        .from("khach_hang")
        .select("ma_kh", { count: "exact", head: true })
        .gte("ngay_tao", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase.from("v_thu_chi_tong_hop").select("*").single(),
      supabase.from("v_don_hang").select("*").order("ngay_tiep_nhan", { ascending: false }).limit(1000),
      supabase.from("nghiem_thu").select("ma_don, diem_danh_gia"),
      supabase.from("nhan_vien").select("ma_nv, ho_ten"),
    ]);

  const d = tongHop as TongHopDashboard | null;
  const soKhachMoi = khMoiThang as unknown as { count: number } | null;
  const tc = thuChi as ThuChiTongHop | null;
  const donList = (allDon as DonHangTinhToan[]) ?? [];
  const nghiemThuList = (allNghiemThu as Pick<NghiemThu, "ma_don" | "diem_danh_gia">[]) ?? [];
  const nvMap = new Map(((allNv as Pick<NhanVien, "ma_nv" | "ho_ten">[]) ?? []).map((n) => [n.ma_nv, n.ho_ten]));

  if (!d) {
    return <p className="text-sm text-muted-foreground">Chưa có dữ liệu để hiển thị.</p>;
  }

  const theoThang = doanhThuTheoThang(donList, 6);
  const theoDichVu = doanhThuTheoDichVu(donList);
  const theoTrangThai = demTheoTrangThai(donList);
  const theoUuTien = demTheoUuTien(donList);
  const hieuSuatTho = hieuSuatTheoTho(donList, nghiemThuList as NghiemThu[]);
  const tongDoanhThuTho = hieuSuatTho.reduce((s, t) => s + t.doanhThu, 0);
  const thanhToan = demTheoThanhToan(donList);
  const tongDonThanhToan = Object.values(thanhToan).reduce((s, v) => s + v, 0);
  const danhGia = phanBoDanhGia(nghiemThuList as NghiemThu[]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Số liệu tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
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

      {tc ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Thu chi</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard
              icon={CalendarDays}
              nhan="Thu chi hôm nay"
              giaTri={formatVND(tc.thu_hom_nay - tc.chi_hom_nay)}
              mucCanhBao={tc.thu_hom_nay - tc.chi_hom_nay >= 0 ? "xanh" : "do"}
              ghiChu={`Thu ${formatVND(tc.thu_hom_nay)} · Chi ${formatVND(tc.chi_hom_nay)}`}
            />
            <StatCard
              icon={CalendarRange}
              nhan="Thu chi tháng này"
              giaTri={formatVND(tc.thu_thang_nay - tc.chi_thang_nay)}
              mucCanhBao={tc.thu_thang_nay - tc.chi_thang_nay >= 0 ? "xanh" : "do"}
              ghiChu={`Thu ${formatVND(tc.thu_thang_nay)} · Chi ${formatVND(tc.chi_thang_nay)}`}
            />
            <StatCard
              icon={Coins}
              nhan="Thu chi năm nay"
              giaTri={formatVND(tc.thu_nam_nay - tc.chi_nam_nay)}
              mucCanhBao={tc.thu_nam_nay - tc.chi_nam_nay >= 0 ? "xanh" : "do"}
              ghiChu={`Thu ${formatVND(tc.thu_nam_nay)} · Chi ${formatVND(tc.chi_nam_nay)}`}
            />
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Doanh thu</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Doanh thu theo tháng</p>
              <p className="mb-3 text-xs text-muted-foreground">6 tháng gần nhất — tính theo ngày đóng đơn</p>
              <ThanhNgang items={theoThang.map((t) => ({ nhan: t.nhan, giaTri: t.doanhThu, hienThi: formatVND(t.doanhThu) }))} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Doanh thu theo loại dịch vụ</p>
              <p className="mb-3 text-xs text-muted-foreground">Trên các đơn đã đóng</p>
              <ThanhNgang items={theoDichVu.map((t) => ({ nhan: t.nhan, giaTri: t.doanhThu, hienThi: formatVND(t.doanhThu) }))} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Vận hành</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Đơn theo trạng thái</p>
              <p className="mb-3 text-xs text-muted-foreground">Toàn bộ {donList.length} đơn trong hệ thống</p>
              <ThanhNgang
                items={theoTrangThai.map((t) => ({
                  nhan: t.nhan,
                  giaTri: t.soLuong,
                  hienThi: `${t.soLuong} đơn`,
                  mauThanh: MAU_THANH_TRANG_THAI[t.nhan],
                }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Đơn theo mức ưu tiên</p>
              <p className="mb-3 text-xs text-muted-foreground">Toàn bộ {donList.length} đơn trong hệ thống</p>
              <ThanhNgang
                items={theoUuTien.map((t) => ({
                  nhan: t.nhan,
                  giaTri: t.soLuong,
                  hienThi: `${t.soLuong} đơn`,
                  mauThanh: MAU_THANH_UU_TIEN[t.nhan],
                }))}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Đội thợ</h2>
        {hieuSuatTho.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có đơn hoàn thành để tính hiệu suất.</p>
        ) : (
          <Card className="overflow-hidden py-0">
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kỹ thuật viên</TableHead>
                    <TableHead>Số đơn</TableHead>
                    <TableHead>Doanh thu</TableHead>
                    <TableHead>Tỷ trọng</TableHead>
                    <TableHead>Đánh giá TB</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hieuSuatTho.map((t) => (
                    <TableRow key={t.maNv}>
                      <TableCell className="font-medium">{nvMap.get(t.maNv) ?? t.maNv}</TableCell>
                      <TableCell>{t.soDon}</TableCell>
                      <TableCell>{formatVND(t.doanhThu)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {tongDoanhThuTho > 0 ? Math.round((t.doanhThu / tongDoanhThuTho) * 100) : 0}%
                      </TableCell>
                      <TableCell>{t.danhGiaTb != null ? `${"★".repeat(Math.round(t.danhGiaTb))}${"☆".repeat(5 - Math.round(t.danhGiaTb))} ${t.danhGiaTb.toFixed(1)}` : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Thanh toán & Chất lượng</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Trạng thái thanh toán</p>
              <p className="mb-3 text-xs text-muted-foreground">Trên {tongDonThanhToan} đơn (không tính đơn đã hủy)</p>
              <div className="space-y-2.5">
                {(Object.entries(thanhToan) as [string, number][]).map(([nhan, soLuong]) => (
                  <div key={nhan} className="flex items-center justify-between text-sm">
                    <Badge variant="secondary" className={MAU_PILL_THANH_TOAN[nhan]}>
                      {nhan}
                    </Badge>
                    <span className="tabular-nums font-medium">{soLuong} đơn</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Phân bố đánh giá</p>
              <p className="mb-3 text-xs text-muted-foreground">Trên các lượt nghiệm thu có chấm điểm</p>
              <ThanhNgang items={danhGia.map((d2) => ({ nhan: d2.nhan, giaTri: d2.soLuong, hienThi: `${d2.soLuong}` }))} />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
