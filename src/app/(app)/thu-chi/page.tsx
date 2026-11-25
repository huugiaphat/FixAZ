import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormThuChiMoi } from "@/components/thu-chi/form-thu-chi-moi";
import { FormDeXuatThanhToan } from "@/components/thu-chi/form-de-xuat-thanh-toan";
import { FormSuaThuChi } from "@/components/thu-chi/form-sua-thu-chi";
import { ThaoTacDeXuat } from "@/components/thu-chi/thao-tac-de-xuat";
import { NutDuyetThuChi } from "@/components/thu-chi/nut-duyet-thu-chi";
import { BoLocThuChi } from "@/components/thu-chi/bo-loc-thu-chi";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatDateTime } from "@/lib/format";
import { NOI_DUNG_THU, NOI_DUNG_CHI } from "@/lib/schemas/thu-chi";
import type { DeXuatThanhToan, NhanVien, ThuChi } from "@/types/database";

type ThuChiDanhSach = ThuChi & {
  ten_cong_trinh_hien_thi: string | null;
  ho_ten_nguoi_thu_chi: string | null;
  duyet_du_lieu_cu: boolean;
  ma_dx: string | null;
};

type TongHopThuChi = {
  tong_thu: number;
  tong_chi: number;
  thu_tien_mat: number;
  chi_tien_mat: number;
};

type TongHopChoDuyet = {
  cho_duyet_thu: number;
  cho_duyet_chi: number;
  so_phieu_cho_duyet: number;
  so_de_xuat_cho_duyet: number;
};

const SO_PHIEU_MOI_TRANG = 25;
const MUI_GIO = "+07:00";

function thangHienTai() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit" }).format(new Date());
}

function doiThang(thang: string, soThang: number) {
  const [nam, thangSo] = thang.split("-").map(Number);
  const ngay = new Date(Date.UTC(nam, thangSo - 1 + soThang, 1));
  return `${ngay.getUTCFullYear()}-${String(ngay.getUTCMonth() + 1).padStart(2, "0")}`;
}

function linkTrang(params: Record<string, string | undefined>, trang: number) {
  const query = new URLSearchParams();
  for (const [ten, giaTri] of Object.entries(params)) if (giaTri) query.set(ten, giaTri);
  query.set("trang", String(trang));
  return `/thu-chi?${query.toString()}`;
}

export default async function TrangThuChi({
  searchParams,
}: {
  searchParams: Promise<{ thang?: string; tu?: string; den?: string; loai?: string; ten_cong_trinh?: string; noi_dung?: string; trang_thai?: string; trang?: string }>;
}) {
  const nv = await requireNhanVien(["Quản lý", "Admin", "Kế toán", "Kiểm soát"]);
  const { thang: thangParam, tu, den, loai, ten_cong_trinh: tenCongTrinh, noi_dung: noiDung, trang_thai: trangThai, trang: trangParam } = await searchParams;
  const thang = /^\d{4}-(0[1-9]|1[0-2])$/.test(thangParam ?? "") ? thangParam! : thangHienTai();
  const laNgay = (giaTri?: string) => giaTri && /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(giaTri) ? giaTri : undefined;
  const tuNgay = laNgay(tu);
  const denNgay = laNgay(den);
  const tuThoiDiem = `${tuNgay ?? `${thang}-01`}T00:00:00${MUI_GIO}`;
  const denThoiDiem = `${denNgay ? new Date(Date.parse(`${denNgay}T00:00:00${MUI_GIO}`) + 86_400_000).toISOString() : `${doiThang(thang, 1)}-01T00:00:00${MUI_GIO}`}`;
  const loaiLoc = loai === "Thu" || loai === "Chi" ? loai : undefined;
  const noiDungLoc = noiDung && ([...NOI_DUNG_THU, ...NOI_DUNG_CHI] as readonly string[]).includes(noiDung) ? noiDung : undefined;
  const trangThaiLoc = ["cho-duyet", "da-duyet", "tu-dong-bo"].includes(trangThai ?? "") ? trangThai : undefined;
  const congTrinhLoc = tenCongTrinh?.trim() || undefined;
  const trang = Math.max(1, Math.min(100_000, Number.parseInt(trangParam ?? "1", 10) || 1));
  const supabase = await createClient();

  let query = supabase
    .from("v_thu_chi_danh_sach")
    .select("*", { count: "exact" })
    .order("ngay", { ascending: false })
    .order("ma_tc", { ascending: false })
    .gte("ngay", tuThoiDiem)
    .lt("ngay", denThoiDiem);
  if (loaiLoc) query = query.eq("loai", loaiLoc);
  if (noiDungLoc) {
    if ((NOI_DUNG_THU as readonly string[]).includes(noiDungLoc)) query = query.eq("noi_dung_thu", noiDungLoc);
    else if ((NOI_DUNG_CHI as readonly string[]).includes(noiDungLoc)) query = query.eq("noi_dung_chi", noiDungLoc);
  }
  if (congTrinhLoc) query = query.ilike("ten_cong_trinh_hien_thi", `%${congTrinhLoc}%`);
  if (trangThaiLoc === "cho-duyet") query = query.is("ma_thu", null).eq("da_duyet", false);
  if (trangThaiLoc === "da-duyet") query = query.is("ma_thu", null).eq("da_duyet", true);
  if (trangThaiLoc === "tu-dong-bo") query = query.not("ma_thu", "is", null);
  query = query.range((trang - 1) * SO_PHIEU_MOI_TRANG, trang * SO_PHIEU_MOI_TRANG - 1);

  const [
    { data, count, error },
    { data: tongData, error: tongError },
    { data: choDuyetData, error: choDuyetError },
    { data: dxData, count: dxCount, error: dxError },
  ] = await Promise.all([
    query,
    supabase.rpc("f_tong_hop_thu_chi_loc", {
      p_tu: tuThoiDiem,
      p_den: denThoiDiem,
      p_loai: loaiLoc ?? null,
      p_noi_dung: noiDungLoc ?? null,
      p_cong_trinh: congTrinhLoc ?? null,
      p_trang_thai: trangThaiLoc ?? null,
    }).single(),
    supabase.rpc("f_tong_hop_phieu_cho_duyet").single(),
    supabase.from("de_xuat_thanh_toan").select("*", { count: "exact" })
      .eq("trang_thai", "Chờ duyệt").order("created_at", { ascending: false }).limit(50),
  ]);
  const danhSach = (data as ThuChiDanhSach[]) ?? [];
  const deXuatChoDuyet = (dxData as DeXuatThanhToan[]) ?? [];
  const tong = tongData as TongHopThuChi | null;
  const choDuyet = choDuyetData as TongHopChoDuyet | null;
  const soTrang = Math.max(1, Math.ceil((count ?? 0) / SO_PHIEU_MOI_TRANG));

  const laAdmin = nv.vai_tro_app === "Admin";
  const coTheThaoTac = ["Quản lý", "Admin", "Kế toán"].includes(nv.vai_tro_app);
  let nhanVienList: NhanVien[] = [];
  if (coTheThaoTac) {
    const { data: nvData } = await supabase.from("nhan_vien").select("*").eq("trang_thai", "Đang làm").order("ho_ten");
    nhanVienList = (nvData as NhanVien[]) ?? [];
  }

  const tongThu = Number(tong?.tong_thu ?? 0);
  const tongChi = Number(tong?.tong_chi ?? 0);
  const tongThuTienMat = Number(tong?.thu_tien_mat ?? 0);
  const tongThuTaiKhoan = tongThu - tongThuTienMat;
  const tongChiTienMat = Number(tong?.chi_tien_mat ?? 0);
  const tongChiTaiKhoan = tongChi - tongChiTienMat;
  const soDuTienMat = tongThuTienMat - tongChiTienMat;
  const soDuTaiKhoan = tongThuTaiKhoan - tongChiTaiKhoan;

  const coTheSua = (tc: ThuChiDanhSach) =>
    coTheThaoTac && !tc.ma_thu && !tc.ma_dx && (laAdmin || (!tc.da_duyet && tc.nguoi_lap === nv.ma_nv));
  const coTheDuyet = (tc: ThuChiDanhSach) => laAdmin && !tc.ma_thu && !tc.ma_dx;
  const trangThaiDuyet = (tc: ThuChiDanhSach) => tc.ma_thu ? "Tự đồng bộ" : tc.duyet_du_lieu_cu ? "Đã duyệt · dữ liệu cũ" : tc.da_duyet ? "Đã duyệt" : "Chờ duyệt";
  const paramsLoc = { thang, tu: tuNgay, den: denNgay, loai: loaiLoc, ten_cong_trinh: congTrinhLoc, noi_dung: noiDungLoc, trang_thai: trangThaiLoc };

  return (
    <div className="space-y-4">
      <PageHeading title="Sổ thu chi" description="Ghi nhận thu chi và theo dõi dòng tiền theo công trình.">
        {nv.vai_tro_app !== "Kiểm soát" ? <FormThuChiMoi maNvHienTai={nv.ma_nv} /> : null}
        <FormDeXuatThanhToan />
      </PageHeading>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={linkTrang({ thang: doiThang(thang, -1) }, 1)} className="rounded-md border px-3 py-1.5 hover:bg-muted">← Tháng trước</Link>
        <span className="font-medium">{tuNgay || denNgay ? "Khoảng ngày đã chọn" : `Tháng ${thang.slice(5, 7)}/${thang.slice(0, 4)}`}</span>
        <Link href={linkTrang({ thang: doiThang(thang, 1) }, 1)} className="rounded-md border px-3 py-1.5 hover:bg-muted">Tháng sau →</Link>
      </div>

      {tong ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Tổng thu đã hạch toán (đang lọc)</p>
            <p className="text-xl font-semibold text-emerald-600">{formatVND(tongThu)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tiền mặt {formatVND(tongThuTienMat)} · Tài khoản {formatVND(tongThuTaiKhoan)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Tổng chi đã hạch toán (đang lọc)</p>
            <p className="text-xl font-semibold text-destructive">{formatVND(tongChi)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tiền mặt {formatVND(tongChiTienMat)} · Tài khoản {formatVND(tongChiTaiKhoan)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Số dư đã hạch toán</p>
            <p className={`text-xl font-semibold ${tongThu - tongChi >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {formatVND(tongThu - tongChi)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tiền mặt {formatVND(soDuTienMat)} · Tài khoản {formatVND(soDuTaiKhoan)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Tất cả phiếu chờ duyệt · {choDuyet ? Number(choDuyet.so_phieu_cho_duyet) : "—"} phiếu</p>
            {choDuyetError ? <p className="text-sm text-destructive">Không tính được: {choDuyetError.message}</p> : <>
              <p className="text-sm font-medium">Thu {formatVND(Number(choDuyet?.cho_duyet_thu ?? 0))}</p>
              <p className="text-sm font-medium">Chi {formatVND(Number(choDuyet?.cho_duyet_chi ?? 0))}</p>
              <p className="mt-1 text-xs text-muted-foreground">Gồm {Number(choDuyet?.so_de_xuat_cho_duyet ?? 0)} đề xuất thanh toán · Không phụ thuộc bộ lọc</p>
            </>}
          </CardContent>
        </Card>
      </div> : null}

      <BoLocThuChi thang={thang} tu={tuNgay} den={denNgay} loai={loaiLoc} tenCongTrinh={congTrinhLoc} noiDung={noiDungLoc} trangThai={trangThaiLoc} />

      <section className="space-y-3" aria-label="Đề xuất thanh toán chờ duyệt">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Đề xuất thanh toán chờ duyệt</h2>
          <Link href="/de-xuat-thanh-toan" className="text-sm text-primary hover:underline">Xem tất cả đề xuất →</Link>
        </div>
        {dxError && <p className="text-sm text-destructive">Không tải được đề xuất: {dxError.message}</p>}
        {!dxError && deXuatChoDuyet.length === 0 && <p className="text-sm text-muted-foreground">Không có đề xuất chờ duyệt.</p>}
        {!dxError && (dxCount ?? 0) > deXuatChoDuyet.length && <p className="text-sm text-muted-foreground">Đang hiện {deXuatChoDuyet.length}/{dxCount} đề xuất; mở danh sách để xem tất cả.</p>}
        {deXuatChoDuyet.map(dx => <Card key={dx.ma_dx}><CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div><Link href={`/de-xuat-thanh-toan/${encodeURIComponent(dx.ma_dx)}`} className="font-semibold text-primary hover:underline">{dx.ma_dx}</Link>
            <p className="text-xs text-muted-foreground">Chi · {dx.noi_dung_chi} · {dx.ten_cong_trinh ?? dx.ma_don ?? "Không gắn công trình"}</p></div>
          <div className="flex flex-wrap items-center gap-3"><strong className="tabular-nums text-destructive">{formatVND(dx.tong_tien)}</strong>
            {laAdmin && <ThaoTacDeXuat maDx={dx.ma_dx} laAdmin nguoiLap={false} />}</div>
        </CardContent></Card>)}
      </section>

      {tongError ? <p className="text-sm text-destructive">Lỗi tính tổng thu chi: {tongError.message}</p> : null}
      {!error ? <p className="text-sm text-muted-foreground">{count ?? 0} phiếu phù hợp · Trang {Math.min(trang, soTrang)}/{soTrang}. Số tiền phía trên tính trên toàn bộ kết quả đang lọc.</p> : null}

      {error ? (
        <p className="text-sm text-destructive">Lỗi tải dữ liệu: {error.message}</p>
      ) : danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có khoản thu chi nào.</p>
      ) : (
        <>
        <div className="grid gap-3 lg:hidden">
          {danhSach.map(tc => <article key={tc.ma_tc} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="secondary">{tc.loai} · {tc.noi_dung_thu ?? tc.noi_dung_chi}</Badge><span className={tc.loai === "Thu" ? "font-semibold tabular-nums text-emerald-600" : "font-semibold tabular-nums text-destructive"}>{tc.loai === "Thu" ? "+" : "−"}{formatVND(tc.so_tien)}</span></div>
            <h2 className="mt-3 font-semibold">{tc.ten_cong_trinh_hien_thi ?? "Chưa gắn công trình"}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2"><Badge variant="secondary" title={tc.duyet_luc ? `${tc.duyet_du_lieu_cu ? "Chuyển dữ liệu cũ lúc" : "Duyệt lúc"} ${formatDateTime(tc.duyet_luc)}` : undefined}>{trangThaiDuyet(tc)}</Badge>{tc.ma_dx && <Link href={`/de-xuat-thanh-toan/${encodeURIComponent(tc.ma_dx)}`} className="text-sm text-primary hover:underline">{tc.ma_dx}</Link>}</div>
            {tc.ghi_chu && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{tc.ghi_chu}</p>}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3"><div className="space-y-1 text-xs text-muted-foreground"><p>{tc.ho_ten_nguoi_thu_chi ?? tc.nguoi_tao} · {tc.phuong_thuc}</p><p>{formatDateTime(tc.ngay)}</p></div><div className="flex items-center gap-1">{coTheSua(tc) ? <FormSuaThuChi phieu={tc} nhanVienList={nhanVienList} /> : null}{coTheDuyet(tc) ? <NutDuyetThuChi maTc={tc.ma_tc} daDuyet={tc.da_duyet} /> : null}</div></div>
          </article>)}
        </div>
        <Card className="hidden overflow-hidden py-0 lg:flex">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Tên công trình</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Người thu chi</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Duyệt phiếu</TableHead>
                  {coTheThaoTac ? <TableHead>Thao tác</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSach.map((tc) => (
                  <TableRow key={tc.ma_tc}>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={tc.loai === "Thu" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-red-100 text-red-700 hover:bg-red-100"}
                      >
                        {tc.loai}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-56 truncate">
                      {tc.ten_cong_trinh_hien_thi ?? "—"}
                    </TableCell>
                    <TableCell>{tc.noi_dung_thu ?? tc.noi_dung_chi}</TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground">{tc.ghi_chu ?? "—"}</TableCell>
                    <TableCell className={tc.loai === "Thu" ? "text-emerald-600" : "text-destructive"}>
                      {tc.loai === "Thu" ? "+" : "-"}{formatVND(tc.so_tien)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tc.phuong_thuc}</TableCell>
                    <TableCell className="text-muted-foreground">{tc.ho_ten_nguoi_thu_chi ?? tc.nguoi_tao}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(tc.ngay)}</TableCell>
                    <TableCell><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary" title={tc.duyet_luc ? `${tc.duyet_du_lieu_cu ? "Chuyển dữ liệu cũ lúc" : "Duyệt lúc"} ${formatDateTime(tc.duyet_luc)}` : undefined}>{trangThaiDuyet(tc)}</Badge>{tc.ma_dx && <Link href={`/de-xuat-thanh-toan/${encodeURIComponent(tc.ma_dx)}`} className="text-sm text-primary hover:underline">{tc.ma_dx}</Link>}</div></TableCell>
                    {coTheThaoTac ? (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {coTheSua(tc) ? <FormSuaThuChi phieu={tc} nhanVienList={nhanVienList} /> : null}
                          {coTheDuyet(tc) ? <NutDuyetThuChi maTc={tc.ma_tc} daDuyet={tc.da_duyet} /> : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </>
      )}
      {!error && soTrang > 1 ? (
        <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Phân trang sổ thu chi">
          {trang > 1 ? <Link href={linkTrang(paramsLoc, trang - 1)} className="rounded-md border px-3 py-2 hover:bg-muted">← Trang trước</Link> : <span />}
          <span>Trang {Math.min(trang, soTrang)} / {soTrang}</span>
          {trang < soTrang ? <Link href={linkTrang(paramsLoc, trang + 1)} className="rounded-md border px-3 py-2 hover:bg-muted">Trang sau →</Link> : <span />}
        </nav>
      ) : null}
    </div>
  );
}
