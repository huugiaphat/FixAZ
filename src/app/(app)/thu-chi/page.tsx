import { PageHeading } from "@/components/page-heading";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormThuChiMoi } from "@/components/thu-chi/form-thu-chi-moi";
import { FormSuaThuChi } from "@/components/thu-chi/form-sua-thu-chi";
import { NutXoaThuChi } from "@/components/thu-chi/nut-xoa-thu-chi";
import { BoLocThuChi } from "@/components/thu-chi/bo-loc-thu-chi";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatDateTime } from "@/lib/format";
import { NOI_DUNG_THU, NOI_DUNG_CHI } from "@/lib/schemas/thu-chi";
import type { NhanVien, ThuChi } from "@/types/database";

type ThuChiVoiDon = ThuChi & { don_hang: { mo_ta_su_co: string } | null; nhan_vien: { ho_ten: string } | null };

export default async function TrangThuChi({
  searchParams,
}: {
  searchParams: Promise<{ tu?: string; den?: string; loai?: string; ten_cong_trinh?: string; noi_dung?: string }>;
}) {
  const nv = await requireNhanVien(["Quản lý", "Admin", "Kế toán", "Kiểm soát"]);
  const { tu, den, loai, ten_cong_trinh: tenCongTrinh, noi_dung: noiDung } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("thu_chi")
    .select("*, don_hang(mo_ta_su_co), nhan_vien(ho_ten)")
    .order("ngay", { ascending: false })
    .limit(1000);
  if (tu) query = query.gte("ngay", tu);
  if (den) query = query.lte("ngay", `${den}T23:59:59`);
  if (loai === "Thu" || loai === "Chi") query = query.eq("loai", loai);
  // noi_dung_thu/noi_dung_chi là 2 cột enum khác kiểu — không thể gộp
  // .or() trên cả 2 vì Postgres sẽ cố ép giá trị sang CẢ 2 kiểu enum,
  // lỗi ngay ở kiểu không khớp dù không rơi vào nhánh đó. Phải xác định
  // đúng cột trước rồi lọc riêng.
  if (noiDung && noiDung !== "tat-ca") {
    if ((NOI_DUNG_THU as readonly string[]).includes(noiDung)) query = query.eq("noi_dung_thu", noiDung);
    else if ((NOI_DUNG_CHI as readonly string[]).includes(noiDung)) query = query.eq("noi_dung_chi", noiDung);
  }

  const { data, error } = await query;
  let danhSach = (data as ThuChiVoiDon[]) ?? [];

  const laQuanLy = (nv.vai_tro_app === "Quản lý" || nv.vai_tro_app === "Admin");
  const laAdmin = nv.vai_tro_app === "Admin";
  let nhanVienList: NhanVien[] = [];
  if (laQuanLy) {
    const { data: nvData } = await supabase.from("nhan_vien").select("*").eq("trang_thai", "Đang làm").order("ho_ten");
    nhanVienList = (nvData as NhanVien[]) ?? [];
  }

  if (tenCongTrinh) {
    const tuKhoa = tenCongTrinh.toLowerCase();
    danhSach = danhSach.filter((tc) => (tc.don_hang?.mo_ta_su_co ?? tc.ten_cong_trinh ?? "").toLowerCase().includes(tuKhoa));
  }

  const laTienMat = (tc: ThuChiVoiDon) => tc.phuong_thuc === "Tiền mặt";

  const tongThu = danhSach.filter((tc) => tc.loai === "Thu").reduce((s, tc) => s + tc.so_tien, 0);
  const tongChi = danhSach.filter((tc) => tc.loai === "Chi").reduce((s, tc) => s + tc.so_tien, 0);

  const tongThuTienMat = danhSach.filter((tc) => tc.loai === "Thu" && laTienMat(tc)).reduce((s, tc) => s + tc.so_tien, 0);
  const tongThuTaiKhoan = tongThu - tongThuTienMat;
  const tongChiTienMat = danhSach.filter((tc) => tc.loai === "Chi" && laTienMat(tc)).reduce((s, tc) => s + tc.so_tien, 0);
  const tongChiTaiKhoan = tongChi - tongChiTienMat;
  const soDuTienMat = tongThuTienMat - tongChiTienMat;
  const soDuTaiKhoan = tongThuTaiKhoan - tongChiTaiKhoan;

  return (
    <div className="space-y-4">
      <PageHeading title="Sổ thu chi" description="Ghi nhận thu chi và theo dõi dòng tiền theo công trình.">
        {nv.vai_tro_app !== "Kiểm soát" ? <FormThuChiMoi maNvHienTai={nv.ma_nv} /> : null}
      </PageHeading>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Tổng thu (đang lọc)</p>
            <p className="text-xl font-semibold text-emerald-600">{formatVND(tongThu)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tiền mặt {formatVND(tongThuTienMat)} · Tài khoản {formatVND(tongThuTaiKhoan)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Tổng chi (đang lọc)</p>
            <p className="text-xl font-semibold text-destructive">{formatVND(tongChi)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tiền mặt {formatVND(tongChiTienMat)} · Tài khoản {formatVND(tongChiTaiKhoan)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Số dư</p>
            <p className={`text-xl font-semibold ${tongThu - tongChi >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {formatVND(tongThu - tongChi)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tiền mặt {formatVND(soDuTienMat)} · Tài khoản {formatVND(soDuTaiKhoan)}
            </p>
          </CardContent>
        </Card>
      </div>

      <BoLocThuChi tu={tu} den={den} loai={loai} tenCongTrinh={tenCongTrinh} noiDung={noiDung} />

      {error ? (
        <p className="text-sm text-destructive">Lỗi tải dữ liệu: {error.message}</p>
      ) : danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có khoản thu chi nào.</p>
      ) : (
        <>
        <div className="grid gap-3 lg:hidden">
          {danhSach.map(tc => <article key={tc.ma_tc} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="secondary">{tc.loai} · {tc.noi_dung_thu ?? tc.noi_dung_chi}</Badge><span className={tc.loai === "Thu" ? "font-semibold tabular-nums text-emerald-600" : "font-semibold tabular-nums text-destructive"}>{tc.loai === "Thu" ? "+" : "−"}{formatVND(tc.so_tien)}</span></div>
            <h2 className="mt-3 font-semibold">{tc.don_hang?.mo_ta_su_co ?? tc.ten_cong_trinh ?? "Chưa gắn công trình"}</h2>
            {tc.ghi_chu && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{tc.ghi_chu}</p>}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3"><div className="space-y-1 text-xs text-muted-foreground"><p>{tc.nhan_vien?.ho_ten ?? tc.nguoi_tao} · {tc.phuong_thuc}</p><p>{formatDateTime(tc.ngay)}</p></div><div className="flex items-center gap-1">{laQuanLy && !tc.ma_thu ? <FormSuaThuChi phieu={tc} nhanVienList={nhanVienList} /> : null}{laAdmin && !tc.ma_thu ? <NutXoaThuChi maTc={tc.ma_tc} /> : null}</div></div>
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
                  {laQuanLy ? <TableHead className="w-10" /> : null}
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
                      {tc.don_hang?.mo_ta_su_co ?? tc.ten_cong_trinh ?? "—"}
                    </TableCell>
                    <TableCell>{tc.noi_dung_thu ?? tc.noi_dung_chi}</TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground">{tc.ghi_chu ?? "—"}</TableCell>
                    <TableCell className={tc.loai === "Thu" ? "text-emerald-600" : "text-destructive"}>
                      {tc.loai === "Thu" ? "+" : "-"}{formatVND(tc.so_tien)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tc.phuong_thuc}</TableCell>
                    <TableCell className="text-muted-foreground">{tc.nhan_vien?.ho_ten ?? tc.nguoi_tao}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(tc.ngay)}</TableCell>
                    {laQuanLy ? (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {tc.ma_thu ? null : <FormSuaThuChi phieu={tc} nhanVienList={nhanVienList} />}
                          {laAdmin && !tc.ma_thu ? <NutXoaThuChi maTc={tc.ma_tc} /> : null}
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
    </div>
  );
}
