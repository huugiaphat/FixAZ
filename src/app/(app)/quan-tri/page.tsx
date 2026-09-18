import { PageHeading } from "@/components/page-heading";
import Link from "next/link";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FormNhanVienMoi } from "@/components/quan-tri/form-nhan-vien-moi";
import { FormSuaNhanVien } from "@/components/quan-tri/form-sua-nhan-vien";
import { NutXoaNhanVien } from "@/components/quan-tri/nut-xoa-nhan-vien";
import { NutDatLaiMatKhau } from "@/components/quan-tri/nut-dat-lai-mat-khau";
import { NutDoiTrangThaiNv } from "@/components/quan-tri/nut-doi-trang-thai-nv";
import { FormBangGiaMoi } from "@/components/quan-tri/form-bang-gia-moi";
import { FormDanhMucMoi } from "@/components/quan-tri/form-danh-muc-moi";
import { FormVatTuMoi } from "@/components/kho-vat-tu/form-vat-tu-moi";
import { FormXuatNhapKho } from "@/components/kho-vat-tu/form-xuat-nhap-kho";
import { formatVND } from "@/lib/format";
import type { NhanVien, BangGiaDichVu, DanhMuc, VatTuTinhToan } from "@/types/database";

export default async function TrangQuanTri() {
  const nv = await requireNhanVien(["Quản lý", "Admin", "Kiểm soát"]);
  const duocSua = (nv.vai_tro_app === "Quản lý" || nv.vai_tro_app === "Admin");
  const supabase = await createClient();

  const [{ data: nvList }, { data: bgList }, { data: dmList }, { data: vtList }] = await Promise.all([
    supabase.from("nhan_vien").select("*").order("ho_ten"),
    supabase.from("bang_gia_dich_vu").select("*").order("nhom_dich_vu"),
    supabase.from("danh_muc").select("*").order("loai_danh_muc").order("thu_tu"),
    supabase.from("v_vat_tu").select("*").order("ten"),
  ]);

  const danhSachNv = (nvList as NhanVien[]) ?? [];
  const danhSachBg = (bgList as BangGiaDichVu[]) ?? [];
  const danhSachDm = (dmList as DanhMuc[]) ?? [];
  const danhSachVt = (vtList as VatTuTinhToan[]) ?? [];
  const nhomDanhMuc = Object.groupBy(danhSachDm, (d) => d.loai_danh_muc);
  const cacLoaiDanhMuc = [...new Set(danhSachDm.map((d) => d.loai_danh_muc))];

  return (
    <div className="space-y-4">
      <PageHeading title="Quản trị" description="Nhân viên, bảng giá dịch vụ và danh mục dùng chung." />

      <Tabs defaultValue="nhan-vien">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="nhan-vien">Nhân viên</TabsTrigger>
          <TabsTrigger value="bang-gia">Bảng giá dịch vụ</TabsTrigger>
          <TabsTrigger value="kho-vat-tu">Kho vật tư</TabsTrigger>
          <TabsTrigger value="danh-muc">Danh mục dùng chung</TabsTrigger>
        </TabsList>

        <TabsContent value="nhan-vien" className="space-y-4 pt-4">
          {duocSua ? (
            <div className="flex justify-end">
              <FormNhanVienMoi />
            </div>
          ) : null}
          <Card className="overflow-hidden py-0">
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Kỹ năng / Khu vực</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    {duocSua ? <TableHead /> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {danhSachNv.map((n) => (
                    <TableRow key={n.ma_nv}>
                      <TableCell className="font-medium">{n.ho_ten}</TableCell>
                      <TableCell>{n.vai_tro_app}</TableCell>
                      <TableCell className="text-muted-foreground">{n.email}</TableCell>
                      <TableCell className="text-muted-foreground">{n.sdt || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{[...n.ky_nang, n.khu_vuc_phu_trach].filter(Boolean).join(" · ") || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={n.trang_thai === "Đang làm" ? "secondary" : "outline"}>{n.trang_thai}</Badge>
                      </TableCell>
                      {duocSua ? (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FormSuaNhanVien nhanVien={n} />
                            <NutDatLaiMatKhau maNv={n.ma_nv} hoTen={n.ho_ten} sdt={n.sdt} />
                            <NutDoiTrangThaiNv maNv={n.ma_nv} trangThai={n.trang_thai} />
                            <NutXoaNhanVien maNv={n.ma_nv} hoTen={n.ho_ten} />
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bang-gia" className="space-y-4 pt-4">
          {duocSua ? (
            <div className="flex justify-end">
              <FormBangGiaMoi />
            </div>
          ) : null}
          <Card className="overflow-hidden py-0">
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dịch vụ</TableHead>
                    <TableHead>ĐVT</TableHead>
                    <TableHead>Đơn giá</TableHead>
                    <TableHead>Nhóm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {danhSachBg.map((dv) => (
                    <TableRow key={dv.ma_dv}>
                      <TableCell className="font-medium">{dv.ten_dich_vu}</TableCell>
                      <TableCell>{dv.don_vi_tinh}</TableCell>
                      <TableCell className="text-muted-foreground">{dv.gia_tham_khao ?? "—"}</TableCell>
                      <TableCell>{dv.nhom_dich_vu}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">
            Bảng đơn giá khoán nội bộ — Điện / Nước / Nhà cửa.
          </p>
        </TabsContent>

        <TabsContent value="kho-vat-tu" className="space-y-4 pt-4">
          {duocSua ? (
            <div className="flex justify-end gap-2">
              <FormXuatNhapKho danhSachVatTu={danhSachVt} />
              <FormVatTuMoi />
            </div>
          ) : null}
          {danhSachVt.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có vật tư nào.</p>
          ) : (
            <Card className="overflow-hidden py-0">
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên vật tư</TableHead>
                      <TableHead>Quy cách</TableHead>
                      <TableHead>ĐVT</TableHead>
                      <TableHead>Giá vốn</TableHead>
                      <TableHead>Giá bán</TableHead>
                      <TableHead>Tồn kho</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {danhSachVt.map((vt) => {
                      const tonThap = vt.nguong_canh_bao_ton != null && vt.ton_kho < vt.nguong_canh_bao_ton;
                      return (
                        <TableRow key={vt.ma_vt}>
                          <TableCell>
                            <Link href={`/kho-vat-tu/${vt.ma_vt}`} className="font-medium text-primary hover:underline">
                              {vt.ten}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{vt.quy_cach ?? "—"}</TableCell>
                          <TableCell>{vt.don_vi_tinh}</TableCell>
                          <TableCell>{formatVND(vt.gia_von)}</TableCell>
                          <TableCell>{formatVND(vt.gia_ban)}</TableCell>
                          <TableCell>
                            {tonThap ? (
                              <Badge variant="destructive">{vt.ton_kho} (thấp)</Badge>
                            ) : (
                              <span>{vt.ton_kho}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="danh-muc" className="space-y-4 pt-4">
          {duocSua ? (
            <div className="flex justify-end">
              <FormDanhMucMoi loaiGoiY={cacLoaiDanhMuc} />
            </div>
          ) : null}
          <div className="space-y-4">
            {cacLoaiDanhMuc.map((loai) => (
              <Card key={loai}>
                <CardContent className="py-4">
                  <p className="mb-2 font-medium">{loai}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(nhomDanhMuc[loai] ?? []).map((d) => (
                      <Badge key={d.id} variant="secondary">{d.gia_tri}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
