import type { DonHangTinhToan, NghiemThu, ThuChi, TrangThaiDon, UuTien, DichVu } from "@/types/database";

const TRANG_THAI_DA_TINH_TIEN = new Set<TrangThaiDon>(["Đã nghiệm thu - chờ thu tiền", "Đã đóng"]);

export interface DiemThang {
  nhan: string;
  doanhThu: number;
}

/** Doanh thu theo tháng đóng đơn, N tháng gần nhất (kể cả tháng 0đ) — chỉ tính đơn "Đã đóng". */
export function doanhThuTheoThang(danhSach: DonHangTinhToan[], soThang: number): DiemThang[] {
  const now = new Date();
  const thang: DiemThang[] = [];
  for (let i = soThang - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    thang.push({ nhan: `Th.${String(d.getMonth() + 1).padStart(2, "0")}`, doanhThu: 0 });
  }
  for (const don of danhSach) {
    if (don.trang_thai !== "Đã đóng" || !don.ngay_dong_don) continue;
    const ngayDong = new Date(don.ngay_dong_don);
    const soThangCach =
      (now.getFullYear() - ngayDong.getFullYear()) * 12 + (now.getMonth() - ngayDong.getMonth());
    const idx = soThang - 1 - soThangCach;
    if (idx >= 0 && idx < thang.length) thang[idx].doanhThu += don.tong_tien;
  }
  return thang;
}

export interface DiemDichVu {
  nhan: string;
  doanhThu: number;
}

/** Doanh thu theo loại dịch vụ — chỉ tính đơn "Đã đóng". */
export function doanhThuTheoDichVu(danhSach: DonHangTinhToan[]): DiemDichVu[] {
  const map = new Map<DichVu, number>();
  for (const don of danhSach) {
    if (don.trang_thai !== "Đã đóng") continue;
    map.set(don.dich_vu, (map.get(don.dich_vu) ?? 0) + don.tong_tien);
  }
  return [...map.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([nhan, doanhThu]) => ({ nhan, doanhThu }));
}

export interface DemTheoNhan {
  nhan: string;
  soLuong: number;
}

export function demTheoTrangThai(danhSach: DonHangTinhToan[]): DemTheoNhan[] {
  const map = new Map<string, number>();
  for (const don of danhSach) map.set(don.trang_thai, (map.get(don.trang_thai) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([nhan, soLuong]) => ({ nhan, soLuong }));
}

const THU_TU_UU_TIEN: UuTien[] = ["P1-Khẩn cấp", "P2-Trong ngày", "P3-Đặt lịch"];

export function demTheoUuTien(danhSach: DonHangTinhToan[]): DemTheoNhan[] {
  const map = new Map<UuTien, number>();
  for (const don of danhSach) map.set(don.uu_tien, (map.get(don.uu_tien) ?? 0) + 1);
  return THU_TU_UU_TIEN.filter((u) => map.has(u)).map((nhan) => ({ nhan, soLuong: map.get(nhan)! }));
}

export interface HieuSuatTho {
  maNv: string;
  soDon: number;
  doanhThu: number;
  danhGiaTb: number | null;
}

/** Hiệu suất từng thợ — số đơn hoàn thành ("Đã đóng") + doanh thu tạo ra + đánh giá TB (từ nghiệm thu). */
export function hieuSuatTheoTho(danhSach: DonHangTinhToan[], nghiemThuList: NghiemThu[]): HieuSuatTho[] {
  const diemTheoDon = new Map<string, number[]>();
  for (const nt of nghiemThuList) {
    if (nt.diem_danh_gia == null) continue;
    const ds = diemTheoDon.get(nt.ma_don) ?? [];
    ds.push(nt.diem_danh_gia);
    diemTheoDon.set(nt.ma_don, ds);
  }

  const map = new Map<string, { soDon: number; doanhThu: number; diem: number[] }>();
  for (const don of danhSach) {
    if (don.trang_thai !== "Đã đóng" || !don.tho_phu_trach) continue;
    const hien = map.get(don.tho_phu_trach) ?? { soDon: 0, doanhThu: 0, diem: [] };
    hien.soDon += 1;
    hien.doanhThu += don.tong_tien;
    hien.diem.push(...(diemTheoDon.get(don.ma_don) ?? []));
    map.set(don.tho_phu_trach, hien);
  }

  return [...map.entries()]
    .map(([maNv, v]) => ({
      maNv,
      soDon: v.soDon,
      doanhThu: v.doanhThu,
      danhGiaTb: v.diem.length > 0 ? v.diem.reduce((s, x) => s + x, 0) / v.diem.length : null,
    }))
    .sort((a, b) => b.doanhThu - a.doanhThu);
}

export type TrangThaiThanhToan = "Đã thu đủ" | "Thu một phần" | "Chưa thu" | "Chưa đến bước thanh toán";

/** Phân loại thanh toán trên toàn bộ đơn (trừ đơn đã hủy). */
export function demTheoThanhToan(danhSach: DonHangTinhToan[]): Record<TrangThaiThanhToan, number> {
  const ketQua: Record<TrangThaiThanhToan, number> = {
    "Đã thu đủ": 0,
    "Thu một phần": 0,
    "Chưa thu": 0,
    "Chưa đến bước thanh toán": 0,
  };
  for (const don of danhSach) {
    if (don.trang_thai === "Đã hủy") continue;
    if (!TRANG_THAI_DA_TINH_TIEN.has(don.trang_thai)) {
      ketQua["Chưa đến bước thanh toán"] += 1;
      continue;
    }
    if (don.cong_no <= 0 && don.tong_tien > 0) ketQua["Đã thu đủ"] += 1;
    else if (don.da_thu > 0) ketQua["Thu một phần"] += 1;
    else ketQua["Chưa thu"] += 1;
  }
  return ketQua;
}

/** Phân bố đánh giá 1-5 sao trên toàn bộ lượt nghiệm thu có chấm điểm. */
export function phanBoDanhGia(nghiemThuList: NghiemThu[]): DemTheoNhan[] {
  const dem = [0, 0, 0, 0, 0];
  for (const nt of nghiemThuList) {
    if (nt.diem_danh_gia == null) continue;
    dem[nt.diem_danh_gia - 1] += 1;
  }
  return [5, 4, 3, 2, 1].map((sao) => ({ nhan: `${sao} ★`, soLuong: dem[sao - 1] }));
}

export interface DiemNoiDung {
  nhan: string;
  soTien: number;
}

type ThuChiRutGon = Pick<ThuChi, "loai" | "noi_dung_thu" | "noi_dung_chi" | "so_tien">;

/** Chi tiết chi theo từng "nội dung chi" (Vật tư, Công cụ, Lương...). */
export function chiTietTheoNoiDungChi(danhSach: ThuChiRutGon[]): DiemNoiDung[] {
  const map = new Map<string, number>();
  for (const tc of danhSach) {
    if (tc.loai !== "Chi" || !tc.noi_dung_chi) continue;
    map.set(tc.noi_dung_chi, (map.get(tc.noi_dung_chi) ?? 0) + tc.so_tien);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([nhan, soTien]) => ({ nhan, soTien }));
}

/** Chi tiết thu theo từng "nội dung thu" (Tạm ứng, Thanh toán, Thu khác, Sửa nhanh). */
export function chiTietTheoNoiDungThu(danhSach: ThuChiRutGon[]): DiemNoiDung[] {
  const map = new Map<string, number>();
  for (const tc of danhSach) {
    if (tc.loai !== "Thu" || !tc.noi_dung_thu) continue;
    map.set(tc.noi_dung_thu, (map.get(tc.noi_dung_thu) ?? 0) + tc.so_tien);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([nhan, soTien]) => ({ nhan, soTien }));
}
