"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { chiTietDonSchema, type ChiTietDonFormValues, type ChiTietDonFormInput } from "@/lib/schemas/chi-tiet-don";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatVND } from "@/lib/format";
import type { ChiTietDonTinhToan, BangGiaDichVu, VaiTro } from "@/types/database";

export function TabChiTietDon({
  maDon,
  danhSach,
  bangGiaDichVu,
  vaiTro,
}: {
  maDon: string;
  danhSach: ChiTietDonTinhToan[];
  bangGiaDichVu: BangGiaDichVu[];
  vaiTro: VaiTro;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [dangXoa, setDangXoa] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChiTietDonFormInput, unknown, ChiTietDonFormValues>({
    resolver: zodResolver(chiTietDonSchema),
    defaultValues: { loai: "Dịch vụ", so_luong: 1, gia_ban: 0 },
  });

  const duocSua = ["Quản lý", "CSKH-Điều phối"].includes(vaiTro);
  const tongCong = danhSach.reduce((s, c) => s + c.thanh_tien, 0);

  function chonTuBangGia(maDv: string | null) {
    const dv = bangGiaDichVu.find((d) => d.ma_dv === maDv);
    if (!dv) return;
    setValue("ten_hang_muc", dv.ten_dich_vu);
    setValue("don_vi_tinh", dv.don_vi_tinh);
    setValue("ma_dv_vt", dv.ma_dv);
  }

  async function onSubmit(values: ChiTietDonFormValues) {
    const { error } = await supabase.from("chi_tiet_don").insert({ ma_don: maDon, ...values });
    if (error) {
      toast.error(`Không thêm được hạng mục: ${error.message}`);
      return;
    }
    toast.success("Đã thêm hạng mục");
    reset({ loai: "Dịch vụ", so_luong: 1, gia_ban: 0 });
    router.refresh();
  }

  async function xoa(maDong: string) {
    setDangXoa(maDong);
    const { error } = await supabase.from("chi_tiet_don").delete().eq("ma_dong", maDong);
    setDangXoa(null);
    if (error) toast.error(error.message);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      {danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có hạng mục nào được chốt.</p>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hạng mục</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>SL</TableHead>
                  <TableHead>Đơn giá</TableHead>
                  <TableHead>Thành tiền</TableHead>
                  {duocSua ? <TableHead /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSach.map((c) => (
                  <TableRow key={c.ma_dong}>
                    <TableCell className="font-medium">{c.ten_hang_muc}</TableCell>
                    <TableCell className="text-muted-foreground">{c.loai}</TableCell>
                    <TableCell>{c.so_luong} {c.don_vi_tinh}</TableCell>
                    <TableCell>{formatVND(c.gia_ban)}</TableCell>
                    <TableCell className="font-medium">{formatVND(c.thanh_tien)}</TableCell>
                    {duocSua ? (
                      <TableCell>
                        <Button size="icon-sm" variant="ghost" disabled={dangXoa === c.ma_dong} onClick={() => xoa(c.ma_dong)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">Tổng cộng</TableCell>
                  <TableCell className="font-semibold">{formatVND(tongCong)}</TableCell>
                  {duocSua ? <TableCell /> : null}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {duocSua ? (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 font-medium">Thêm hạng mục</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loại *</Label>
                  <Select value={watch("loai")} onValueChange={(v) => setValue("loai", v as ChiTietDonFormValues["loai"])}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dịch vụ">Dịch vụ</SelectItem>
                      <SelectItem value="Vật tư">Vật tư</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {watch("loai") === "Dịch vụ" && bangGiaDichVu.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Chọn nhanh từ bảng giá</Label>
                    <Select onValueChange={chonTuBangGia}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Tùy chọn" /></SelectTrigger>
                      <SelectContent>
                        {bangGiaDichVu.map((dv) => (
                          <SelectItem key={dv.ma_dv} value={dv.ma_dv}>{dv.ten_dich_vu}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ten_hang_muc">Tên hạng mục *</Label>
                <Input id="ten_hang_muc" {...register("ten_hang_muc")} />
                {errors.ten_hang_muc ? <p className="text-sm text-destructive">{errors.ten_hang_muc.message}</p> : null}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="so_luong">Số lượng *</Label>
                  <Input id="so_luong" type="number" min={0} step="any" {...register("so_luong", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="don_vi_tinh">ĐVT</Label>
                  <Input id="don_vi_tinh" {...register("don_vi_tinh")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gia_ban">Giá bán *</Label>
                  <Input id="gia_ban" type="number" min={0} step={1000} {...register("gia_ban", { valueAsNumber: true })} />
                  {errors.gia_ban ? <p className="text-sm text-destructive">{errors.gia_ban.message}</p> : null}
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Đang lưu…" : "Thêm hạng mục"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
