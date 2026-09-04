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
import type { NhanVien, BangGiaDichVu, DanhMuc } from "@/types/database";

export default async function TrangQuanTri() {
  const nv = await requireNhanVien(["Quản lý", "Kiểm soát"]);
  const duocSua = nv.vai_tro_app === "Quản lý";
  const supabase = await createClient();

  const [{ data: nvList }, { data: bgList }, { data: dmList }] = await Promise.all([
    supabase.from("nhan_vien").select("*").order("ho_ten"),
    supabase.from("bang_gia_dich_vu").select("*").order("nhom_dich_vu"),
    supabase.from("danh_muc").select("*").order("loai_danh_muc").order("thu_tu"),
  ]);

  const danhSachNv = (nvList as NhanVien[]) ?? [];
  const danhSachBg = (bgList as BangGiaDichVu[]) ?? [];
  const danhSachDm = (dmList as DanhMuc[]) ?? [];
  const nhomDanhMuc = Object.groupBy(danhSachDm, (d) => d.loai_danh_muc);
  const cacLoaiDanhMuc = [...new Set(danhSachDm.map((d) => d.loai_danh_muc))];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Quản trị</h1>

      <Tabs defaultValue="nhan-vien">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="nhan-vien">Nhân viên</TabsTrigger>
          <TabsTrigger value="bang-gia">Bảng giá dịch vụ</TabsTrigger>
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
                    <TableHead>Nhóm</TableHead>
                    <TableHead>ĐVT</TableHead>
                    <TableHead>Giá tham khảo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {danhSachBg.map((dv) => (
                    <TableRow key={dv.ma_dv}>
                      <TableCell className="font-medium">{dv.ten_dich_vu}</TableCell>
                      <TableCell>{dv.nhom_dich_vu}</TableCell>
                      <TableCell>{dv.don_vi_tinh}</TableCell>
                      <TableCell className="text-muted-foreground">{dv.gia_tham_khao ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">
            Lưu ý: giá hiện là khung minh họa — cập nhật số liệu chính thức trước khi vận hành thật (Mục 12 tài liệu yêu cầu).
          </p>
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
