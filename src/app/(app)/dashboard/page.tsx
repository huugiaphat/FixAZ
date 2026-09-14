import Link from "next/link";
import styles from "./dashboard.module.css";
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
  thuChiTheoCongTrinh,
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
  await requireNhanVien(["Quản lý", "Kiểm soát"]);
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
      supabase.from("thu_chi").select("loai, noi_dung_thu, noi_dung_chi, so_tien, ten_cong_trinh, don_hang(mo_ta_su_co)").gte("ngay", dauThang),
    ]);

  const khachHangList = (khachHang3Thang as { ngay_tao: string }[]) ?? [];
  const tc = thuChi as ThuChiTongHop | null;
  const donList = (allDon as DonHangTinhToan[]) ?? [];
  const nghiemThuList = (allNghiemThu as Pick<NghiemThu, "ma_don" | "diem_danh_gia">[]) ?? [];
  const nvMap = new Map(((allNv as Pick<NhanVien, "ma_nv" | "ho_ten">[]) ?? []).map((n) => [n.ma_nv, n.ho_ten]));
  type ThuChiThang = Pick<ThuChi, "loai" | "noi_dung_thu" | "noi_dung_chi" | "so_tien" | "ten_cong_trinh"> & { don_hang: { mo_ta_su_co: string } | null };
  const thuChiThangList = (thuChiThang as unknown as ThuChiThang[]) ?? [];

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
  const thuChiCongTrinh = thuChiTheoCongTrinh(thuChiThangList);

  return (
    <div className={styles.dashboard}>
      <div className={styles.heading}>
        <div><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-600">Hữu Gia Phát · Điều hành</p>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan hoạt động · Tháng {now.getMonth() + 1}/{now.getFullYear()}
        </p></div>
        <Link href="/thu-chi" className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">Mở sổ thu chi →</Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Công Trình</h2>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-xs text-muted-foreground">Khách mới · CT mới · CT hoàn thành — 3 tháng gần nhất</p>
            <BieuDoCotNhom
              diem={theoCongTrinh.map((t) => ({ nhan: t.nhan, giaTri: [t.khachMoi, t.ctMoi, t.ctHoanThanh] }))}
              chuoi={CHUOI_CONG_TRINH}
            />
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          {[
            { nhan: "Đang xử lý", so: donList.filter(d => !["Đã đóng", "Đã hủy"].includes(d.trang_thai)).length, ghiChu: "Đơn chưa đóng hoặc hủy", mau: "text-blue-600" },
            { nhan: "Đã hoàn thành", so: donList.filter(d => d.trang_thai === "Đã đóng").length, ghiChu: "Đơn đã đóng", mau: "text-emerald-600" },
            { nhan: "Khẩn cấp", so: donList.filter(d => d.uu_tien === "P1-Khẩn cấp" && !["Đã đóng", "Đã hủy"].includes(d.trang_thai)).length, ghiChu: "Đang cần ưu tiên xử lý", mau: "text-rose-600" },
            { nhan: "Chờ thu tiền", so: donList.filter(d => d.trang_thai === "Đã nghiệm thu - chờ thu tiền").length, ghiChu: "Đã nghiệm thu", mau: "text-amber-600" },
          ].map(m => <div key={m.nhan} className="rounded-xl border bg-card p-4"><p className="text-sm font-medium">{m.nhan}</p><p className={`my-2 text-4xl font-semibold tabular-nums ${m.mau}`}>{m.so}<span className="ml-2 text-xs font-normal text-muted-foreground">đơn</span></p><p className="text-xs text-muted-foreground">{m.ghiChu}</p></div>)}
          <p className="col-span-2 text-xs text-muted-foreground">Tổng hợp từ {donList.length} đơn gần nhất, tối đa 1.000 đơn.</p>
        </div>
        </div>
      </section>

      {tc ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Thu chi</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 ">
            <StatCard
              icon={CalendarDays}
              nhan="Chênh lệch hôm nay"
              giaTri={formatVND(tc.thu_hom_nay - tc.chi_hom_nay)}
              mucCanhBao={tc.thu_hom_nay - tc.chi_hom_nay >= 0 ? "xanh" : "do"}
              ghiChu={`Thu ${formatVND(tc.thu_hom_nay)} · Chi ${formatVND(tc.chi_hom_nay)}`}
            />
            <StatCard
              icon={CalendarRange}
              nhan="Chênh lệch tháng này"
              giaTri={formatVND(tc.thu_thang_nay - tc.chi_thang_nay)}
              mucCanhBao={tc.thu_thang_nay - tc.chi_thang_nay >= 0 ? "xanh" : "do"}
              ghiChu={`Thu ${formatVND(tc.thu_thang_nay)} · Chi ${formatVND(tc.chi_thang_nay)}`}
            />
            <StatCard
              icon={Coins}
              nhan="Chênh lệch năm nay"
              giaTri={formatVND(tc.thu_nam_nay - tc.chi_nam_nay)}
              mucCanhBao={tc.thu_nam_nay - tc.chi_nam_nay >= 0 ? "xanh" : "do"}
              ghiChu={`Thu ${formatVND(tc.thu_nam_nay)} · Chi ${formatVND(tc.chi_nam_nay)}`}
            />
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Chi tiết thu chi</h2>
        <div className="grid gap-3 lg:grid-cols-2 ">
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Chi tiết chi</p>
              <p className="mb-1 text-xs text-muted-foreground">Theo danh mục chi — tháng này</p>
              <DanhSachGiaTri mau="bg-rose-500" items={chiTietChi.map((t) => ({ nhan: t.nhan, hienThi: formatVND(t.soTien), giaTri: t.soTien }))} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Chi tiết thu</p>
              <p className="mb-1 text-xs text-muted-foreground">Theo danh mục thu — tháng này</p>
              <DanhSachGiaTri mau="bg-emerald-500" items={chiTietThu.map((t) => ({ nhan: t.nhan, hienThi: formatVND(t.soTien), giaTri: t.soTien }))} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2"><h2 className="text-lg font-semibold tracking-tight">Thu chi công trình</h2><span className="text-xs text-muted-foreground">Tháng này · {thuChiCongTrinh.length} công trình</span></div>
        <p className="text-xs text-muted-foreground">Lợi nhuận ở đây = tổng thu − tổng chi đã ghi sổ trong tháng; chưa phản ánh toàn bộ vòng đời công trình.</p>
        {thuChiCongTrinh.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có khoản thu chi nào trong tháng.</p>
        ) : (
          <Card className="overflow-hidden py-0">
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên công trình</TableHead>
                    <TableHead className="text-right">Tổng thu</TableHead>
                    <TableHead className="text-right">Tổng chi</TableHead>
                    <TableHead className="text-right">Lợi nhuận</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {thuChiCongTrinh.map((ct) => (
                    <TableRow key={ct.tenCongTrinh}>
                      <TableCell className="min-w-48 max-w-96 whitespace-normal font-medium">{ct.tenCongTrinh}</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600">{formatVND(ct.tongThu)}</TableCell>
                      <TableCell className="text-right tabular-nums text-destructive">{formatVND(ct.tongChi)}</TableCell>
                      <TableCell className={`text-right tabular-nums font-semibold ${ct.loiNhuan >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                        {formatVND(ct.loiNhuan)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Doanh thu</h2>
        <div className="grid gap-3 lg:grid-cols-2 ">
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Doanh thu theo tháng</p>
              <p className="mb-1 text-xs text-muted-foreground">6 tháng gần nhất — tính theo ngày đóng đơn</p>
              <DanhSachGiaTri items={theoThang.map((t) => ({ nhan: t.nhan, hienThi: formatVND(t.doanhThu), giaTri: t.doanhThu }))} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Doanh thu theo loại dịch vụ</p>
              <p className="mb-1 text-xs text-muted-foreground">Trên các đơn đã đóng</p>
              <DanhSachGiaTri items={theoDichVu.map((t) => ({ nhan: t.nhan, hienThi: formatVND(t.doanhThu), giaTri: t.doanhThu }))} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Vận hành</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Đơn theo trạng thái</p>
              <p className="mb-1 text-xs text-muted-foreground">Trong {donList.length} đơn gần nhất (tối đa 1.000)</p>
              <DanhSachGiaTri items={theoTrangThai.map((t) => ({ nhan: t.nhan, hienThi: `${t.soLuong} đơn`, giaTri: t.soLuong }))} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="font-medium">Đơn theo mức ưu tiên</p>
              <p className="mb-1 text-xs text-muted-foreground">Trong {donList.length} đơn gần nhất (tối đa 1.000)</p>
              <DanhSachGiaTri items={theoUuTien.map((t) => ({ nhan: t.nhan, hienThi: `${t.soLuong} đơn`, giaTri: t.soLuong }))} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Đội thợ</h2>
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
        <h2 className="text-lg font-semibold tracking-tight">Thanh toán & Chất lượng</h2>
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
              <DanhSachGiaTri items={danhGia.map((d2) => ({ nhan: d2.nhan, hienThi: `${d2.soLuong} lượt`, giaTri: d2.soLuong }))} />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
