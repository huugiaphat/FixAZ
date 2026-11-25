import Link from "next/link";
import styles from "./dashboard.module.css";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BieuDoCotNhom } from "@/components/dashboard/bieu-do-cot-nhom";
import { BieuDoDongTien } from "@/components/dashboard/bieu-do-dong-tien";
import { DanhSachGiaTri } from "@/components/dashboard/danh-sach-gia-tri";
import { Card, CardContent } from "@/components/ui/card";
import { formatVND } from "@/lib/format";
import {
  congTrinhTheoThang,
  demTheoTrangThai,
  demTheoUuTien,
  chiTietTheoNoiDungChi,
  chiTietTheoNoiDungThu,
} from "@/lib/dashboard-analytics";
import type { DonHangTinhToan, ThuChi } from "@/types/database";

const CHUOI_CONG_TRINH = [
  { nhan: "Khách mới", mau: "bg-blue-500" },
  { nhan: "CT mới", mau: "bg-orange-500" },
  { nhan: "CT hoàn thành", mau: "bg-slate-400" },
];

function thangVietNam() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const lay = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${lay("year")}-${lay("month")}`;
}

function doiThang(thang: string, soThang: number) {
  const [nam, thangSo] = thang.split("-").map(Number);
  const ngay = new Date(Date.UTC(nam, thangSo - 1 + soThang, 1));
  return `${ngay.getUTCFullYear()}-${String(ngay.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function TrangDashboard() {
  await requireNhanVien(["Quản lý", "Admin", "Kiểm soát"]);
  const supabase = await createClient();

  const thangNay = thangVietNam();
  const dauThang = `${thangNay}-01T00:00:00+07:00`;
  const dauThangSau = `${doiThang(thangNay, 1)}-01T00:00:00+07:00`;
  const baThangTruoc = `${doiThang(thangNay, -2)}-01T00:00:00+07:00`;

  type ThuChiThang = Pick<ThuChi, "loai" | "noi_dung_thu" | "noi_dung_chi" | "so_tien">;
  async function docThuChiThang(): Promise<{ rows: ThuChiThang[]; error: string | null }> {
    const rows: ThuChiThang[] = [];
    for (let batDau = 0; ; batDau += 1000) {
      const { data, error } = await supabase.from("thu_chi")
        .select("loai, noi_dung_thu, noi_dung_chi, so_tien")
        .gte("ngay", dauThang).lt("ngay", dauThangSau)
        .or("da_duyet.eq.true,ma_thu.not.is.null")
        .order("ngay", { ascending: false }).order("ma_tc", { ascending: false })
        .range(batDau, batDau + 999);
      if (error) return { rows: [], error: error.message };
      const trang = (data as unknown as ThuChiThang[]) ?? [];
      rows.push(...trang);
      if (trang.length < 1000) break;
    }
    return { rows, error: null };
  }

  const [{ data: khachHang3Thang }, { data: allDon }, { data: dongTienData, error: dongTienError }, thuChiThangResult] =
    await Promise.all([
      supabase.from("khach_hang").select("ngay_tao").gte("ngay_tao", baThangTruoc),
      supabase.from("v_don_hang").select("*").order("ngay_tiep_nhan", { ascending: false }).limit(1000),
      supabase.from("v_bao_cao_thang").select("thang, tong_thu, tong_chi")
        .gte("thang", doiThang(thangNay, -5)).lte("thang", thangNay),
      docThuChiThang(),
    ]);

  const khachHangList = (khachHang3Thang as { ngay_tao: string }[]) ?? [];
  const donList = (allDon as DonHangTinhToan[]) ?? [];
  const thuChiThangList = thuChiThangResult.rows;
  const dongTienMap = new Map(((dongTienData as { thang: string; tong_thu: number; tong_chi: number }[]) ?? []).map((d) => [d.thang, d]));
  const dongTienSauThang = Array.from({ length: 6 }, (_, i) => {
    const thang = doiThang(thangNay, i - 5);
    const d = dongTienMap.get(thang);
    return { thang, thu: Number(d?.tong_thu ?? 0), chi: Number(d?.tong_chi ?? 0) };
  });
  const dongTienThangNay = dongTienSauThang[5];

  const theoCongTrinh = congTrinhTheoThang(khachHangList, donList, 3);
  const theoTrangThai = demTheoTrangThai(donList);
  const theoUuTien = demTheoUuTien(donList);
  const chiTietChi = chiTietTheoNoiDungChi(thuChiThangList);
  const chiTietThu = chiTietTheoNoiDungThu(thuChiThangList);

  return (
    <div className={styles.dashboard}>
      <div className={styles.heading}>
        <div><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-600">Hữu Gia Phát · Điều hành</p>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan hoạt động · Tháng {Number(thangNay.slice(5))}/{thangNay.slice(0, 4)}
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
          <div className="col-span-2 flex items-center justify-between rounded-xl border bg-card p-4">
            <div>
              <p className="text-sm font-medium">Đã hủy</p>
              <p className="text-xs text-muted-foreground">Không tính vào doanh thu/thanh toán</p>
            </div>
            <p className="text-2xl font-semibold tabular-nums text-slate-500">
              {donList.filter(d => d.trang_thai === "Đã hủy").length}
              <span className="ml-2 text-xs font-normal text-muted-foreground">đơn</span>
            </p>
          </div>
          <p className="col-span-2 text-xs text-muted-foreground">Tổng hợp từ {donList.length} đơn gần nhất, tối đa 1.000 đơn.</p>
        </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Chênh lệch dòng tiền</h2>
          <span className="text-xs text-muted-foreground">6 tháng gần nhất · Thu chi đã hạch toán</span>
        </div>
        <Card><CardContent className="space-y-5 pt-6">
          {dongTienError ? <p className="text-sm text-destructive">Không tải được dòng tiền: {dongTienError.message}</p>
            : <>
              <div className="grid gap-4 border-b pb-5 sm:grid-cols-3">
                <div className="border-l-2 border-emerald-500 pl-3"><p className="text-xs text-muted-foreground">Thu tháng này</p><p className="text-lg font-semibold tabular-nums text-emerald-700">{formatVND(dongTienThangNay.thu)}</p></div>
                <div className="border-l-2 border-rose-500 pl-3"><p className="text-xs text-muted-foreground">Chi tháng này</p><p className="text-lg font-semibold tabular-nums text-rose-700">{formatVND(dongTienThangNay.chi)}</p></div>
                <div className="border-l-2 border-blue-600 pl-3"><p className="text-xs text-muted-foreground">Chênh lệch tháng này</p><p className={`text-lg font-semibold tabular-nums ${dongTienThangNay.thu - dongTienThangNay.chi < 0 ? "text-amber-700" : "text-blue-700"}`}>{formatVND(dongTienThangNay.thu - dongTienThangNay.chi)}</p></div>
              </div>
              <BieuDoDongTien duLieu={dongTienSauThang} />
            </>}
        </CardContent></Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Chi tiết thu chi</h2>
        {thuChiThangResult.error ? <p className="text-sm text-destructive">Không tải được chi tiết thu chi: {thuChiThangResult.error}</p> : <div className="grid gap-3 lg:grid-cols-2 ">
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
        </div>}
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
    </div>
  );
}
