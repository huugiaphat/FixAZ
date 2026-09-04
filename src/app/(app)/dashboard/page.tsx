import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { BieuDoCotNhom } from "@/components/dashboard/bieu-do-cot-nhom";
import { DanhSachGiaTri } from "@/components/dashboard/danh-sach-gia-tri";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatVND } from "@/lib/format";
import {
  congTrinhTheoThang,
  doanhThuTheoThang,
  doanhThuTheoDichVu,
  demTheoTrangThai,
  demTheoUuTien,
  hieuSuatTheoTho,
  demTheoThanhToan,
  phanBoDanhGia,
  chiTietTheoNoiDungChi,
  chiTietTheoNoiDungThu,
} from "@/lib/dashboard-analytics";
import type { ThuChiTongHop, DonHangTinhToan, NghiemThu, NhanVien, ThuChi } from "@/types/database";
import { CalendarDays, CalendarRange, Coins } from "lucide-react";

const MAU_PILL_THANH_TOAN: Record<string, string> = {
  "Đã thu đủ": "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  "Thu một phần": "bg-amber-100 text-amber-700 hover:bg-amber-100",
  "Chưa thu": "bg-red-100 text-red-700 hover:bg-red-100",
  "Chưa đến bước thanh toán": "bg-slate-100 text-slate-600 hover:bg-slate-100",
};

const CHUOI_CONG_TRINH = [
  { nhan: "Khách mới", mau: "bg-blue-500" },
  { nhan: "CT mới", mau: "bg-orange-500" },
  { nhan: "CT hoàn thành", mau: "bg-slate-400" },
];

export default async function TrangDashboard() {
  await requireNhanVien(["Quản lý"]);
  const supabase = await createClient();

  const now = new Date();
  const dauThang = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const baThangTruoc = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();

  const [{ data: khachHang3Thang }, { data: thuChi }, { data: allDon }, { data: allNghiemThu }, { data: allNv }, { data: thuChiThang }] =
    await Promise.all([
      supabase.from("khach_hang").select("ngay_tao").gte("ngay_tao", baThangTruoc),
      supabase.from("v_thu_chi_tong_hop").select("*").single(),
      supabase.from("v_don_hang").select("*").order("ngay_tiep_nhan", { ascending: false }).limit(1000),
      supabase.from("nghiem_thu").select("ma_don, diem_danh_gia"),
      supabase.from("nhan_vien").select("ma_nv, ho_ten"),
      supabase.from("thu_chi").select("loai, noi_dung_thu, noi_dung_chi, so_tien").gte("ngay", dauThang),
    ]);

  const khachHangList = (khachHang3Thang as { ngay_tao: string }[]) ?? [];
  const tc = thuChi as ThuChiTongHop | null;
  const donList = (allDon as DonHangTinhToan[]) ?? [];
  const nghiemThuList = (allNghiemThu as Pick<NghiemThu, "ma_don" | "diem_danh_gia">[]) ?? [];
  const nvMap = new Map(((allNv as Pick<NhanVien, "ma_nv" | "ho_ten">[]) ?? []).map((n) => [n.ma_nv, n.ho_ten]));
  const thuChiThangList = (thuChiThang as Pick<ThuChi, "loai" | "noi_dung_thu" | "noi_dung_chi" | "so_tien">[]) ?? [];

  const theoCongTrinh = congTrinhTheoThang(khachHangList, donList, 3);
  const theoThang = doanhThuTheoThang(donList, 6);
  const theoDichVu = doanhThuTheoDichVu(donList);
  const theoTrangThai = demTheoTrangThai(donList);
  const theoUuTien = demTheoUuTien(donList);
  const hieuSuatTho = hieuSuatTheoTho(donList, nghiemThuList as NghiemThu[]);
  const tongDoanhThuTho = hieuSuatTho.reduce((s, t) => s + t.doanhThu, 0);
  const thanhToan = demTheoThanhToan(donList);
  const tongDonThanhToan = Object.values(thanhToan).reduce((s, v) => s + v, 0);
  const danhGia = phanBoDanhGia(nghiemThuList as NghiemThu[]);
  const chiTietChi = chiTietTheoNoiDungChi(thuChiThangList);
  const chiTietThu = chiTietTheoNoiDungThu(thuChiThangList);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Số liệu tháng {now.getMonth() + 1}/{now.getFullYear()}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Công Trình</h2>
        <Card className="max-w-xl">
          <CardContent className="pt-6">
            <p className="mb-3 text-xs text-muted-foreground">Khách mới · CT mới · CT hoàn thành — 3 tháng gần nhất</p>
            <BieuDoCotNhom
              diem={theoCongTrinh.map((t) => ({ nhan: t.nhan, giaTri: [t.khachMoi, t.ctMoi, t.ctHoanThanh] }))}
              chuoi={CHUOI_CONG_TRINH}
            />
          </CardContent>
        </Card>
      </section>

      {tc ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Thu chi</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:max-w-xl">
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
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Chi tiết thu chi</h2>
        <div className="grid gap-3 lg:grid-cols-2 lg:max-w-xl">
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Chi tiết chi</p>
              <p className="mb-1 text-xs text-muted-foreground">Theo nội dung chi — tháng này</p>
              <DanhSachGiaTri items={chiTietChi.map((t) => ({ nhan: t.nhan, hienThi: formatVND(t.soTien) }))} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Chi tiết thu</p>
              <p className="mb-1 text-xs text-muted-foreground">Theo nội dung thu — tháng này</p>
              <DanhSachGiaTri items={chiTietThu.map((t) => ({ nhan: t.nhan, hienThi: formatVND(t.soTien) }))} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Doanh thu</h2>
        <div className="grid gap-3 lg:grid-cols-2 lg:max-w-xl">
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Doanh thu theo tháng</p>
              <p className="mb-1 text-xs text-muted-foreground">6 tháng gần nhất — tính theo ngày đóng đơn</p>
              <DanhSachGiaTri items={theoThang.map((t) => ({ nhan: t.nhan, hienThi: formatVND(t.doanhThu) }))} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Doanh thu theo loại dịch vụ</p>
              <p className="mb-1 text-xs text-muted-foreground">Trên các đơn đã đóng</p>
              <DanhSachGiaTri items={theoDichVu.map((t) => ({ nhan: t.nhan, hienThi: formatVND(t.doanhThu) }))} />
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
              <p className="mb-1 text-xs text-muted-foreground">Toàn bộ {donList.length} đơn trong hệ thống</p>
              <DanhSachGiaTri items={theoTrangThai.map((t) => ({ nhan: t.nhan, hienThi: `${t.soLuong} đơn` }))} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Đơn theo mức ưu tiên</p>
              <p className="mb-1 text-xs text-muted-foreground">Toàn bộ {donList.length} đơn trong hệ thống</p>
              <DanhSachGiaTri items={theoUuTien.map((t) => ({ nhan: t.nhan, hienThi: `${t.soLuong} đơn` }))} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Đội thợ</h2>
        {hieuSuatTho.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có đơn hoàn thành để tính hiệu suất.</p>
        ) : (
          <Card className="max-w-xl overflow-hidden py-0">
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
              <p className="mb-1 text-xs text-muted-foreground">Trên các lượt nghiệm thu có chấm điểm</p>
              <DanhSachGiaTri items={danhGia.map((d2) => ({ nhan: d2.nhan, hienThi: `${d2.soLuong}` }))} />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
