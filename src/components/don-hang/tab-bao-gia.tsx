"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { baoGiaSchema, type BaoGiaFormValues, type BaoGiaFormInput } from "@/lib/schemas/bao-gia";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatVND, formatDateTime } from "@/lib/format";
import type { BaoGia, NhanVien, VaiTro } from "@/types/database";

export function TabBaoGia({ maDon, danhSach, vaiTro }: { maDon: string; danhSach: BaoGia[]; vaiTro: VaiTro }) {
  const router = useRouter();
  const [quanLyList, setQuanLyList] = useState<NhanVien[]>([]);
  const [dangXacNhan, setDangXacNhan] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("nhan_vien")
      .select("*")
      .eq("vai_tro_app", "Quản lý")
      .then(({ data }) => setQuanLyList((data as NhanVien[]) ?? []));
  }, [supabase]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BaoGiaFormInput, unknown, BaoGiaFormValues>({
    resolver: zodResolver(baoGiaSchema),
    defaultValues: { giam_gia: 0, tong_truoc_giam: 0 },
  });

  const duocTao = ["Quản lý", "CSKH-Điều phối", "Thợ"].includes(vaiTro);

  async function onSubmit(values: BaoGiaFormValues) {
    const { error } = await supabase.from("bao_gia").insert({
      ma_don: maDon,
      tong_truoc_giam: values.tong_truoc_giam,
      giam_gia: values.giam_gia,
      tong_sau_giam: values.tong_truoc_giam - values.giam_gia, // CSDL sẽ tự tính lại, gửi tạm để hợp lệ NOT NULL
      nguoi_duyet: values.nguoi_duyet || null,
      pham_vi_bao_gom: values.pham_vi_bao_gom || null,
      pham_vi_khong_bao_gom: values.pham_vi_khong_bao_gom || null,
    });
    if (error) {
      toast.error(`Không tạo được báo giá: ${error.message}`);
      return;
    }
    toast.success("Đã lập báo giá mới");
    reset();
    router.refresh();
  }

  async function xacNhanKhach(maBg: string) {
    setDangXacNhan(maBg);
    const { error } = await supabase
      .from("bao_gia")
      .update({ khach_xac_nhan: true, ngay_xac_nhan: new Date().toISOString() })
      .eq("ma_bg", maBg);
    setDangXacNhan(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Đã ghi nhận khách xác nhận báo giá");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có báo giá nào.</p>
      ) : (
        <div className="space-y-2">
          {danhSach.map((bg) => (
            <Card key={bg.ma_bg}>
              <CardContent className="space-y-1.5 py-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{bg.ma_bg} — Phiên bản {bg.phien_ban}</p>
                  {bg.khach_xac_nhan ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Khách đã xác nhận</Badge>
                  ) : (
                    <Badge variant="secondary">Chờ khách xác nhận</Badge>
                  )}
                </div>
                <p className="text-sm">
                  Trước giảm: {formatVND(bg.tong_truoc_giam)} · Giảm: {formatVND(bg.giam_gia)} · <span className="font-semibold">Sau giảm: {formatVND(bg.tong_sau_giam)}</span>
                </p>
                {bg.pham_vi_bao_gom ? <p className="text-sm text-muted-foreground">Bao gồm: {bg.pham_vi_bao_gom}</p> : null}
                {bg.pham_vi_khong_bao_gom ? <p className="text-sm text-muted-foreground">Không bao gồm: {bg.pham_vi_khong_bao_gom}</p> : null}
                {bg.ngay_xac_nhan ? <p className="text-xs text-muted-foreground">Xác nhận lúc {formatDateTime(bg.ngay_xac_nhan)}</p> : null}
                {!bg.khach_xac_nhan ? (
                  <Button size="sm" className="mt-2" disabled={dangXacNhan === bg.ma_bg} onClick={() => xacNhanKhach(bg.ma_bg)}>
                    Ghi nhận khách đã đồng ý
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {duocTao ? (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 font-medium">Lập báo giá mới</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tong_truoc_giam">Tổng tiền trước giảm *</Label>
                  <Input id="tong_truoc_giam" type="number" min={0} step={1000} {...register("tong_truoc_giam", { valueAsNumber: true })} />
                  {errors.tong_truoc_giam ? <p className="text-sm text-destructive">{errors.tong_truoc_giam.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="giam_gia">Số tiền giảm giá</Label>
                  <Input id="giam_gia" type="number" min={0} step={1000} {...register("giam_gia", { valueAsNumber: true })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Người duyệt giảm giá (nếu vượt hạn mức)</Label>
                <Select value={watch("nguoi_duyet")} onValueChange={(v) => setValue("nguoi_duyet", v ?? undefined)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn Quản lý duyệt (nếu cần)" />
                  </SelectTrigger>
                  <SelectContent>
                    {quanLyList.map((ql) => (
                      <SelectItem key={ql.ma_nv} value={ql.ma_nv}>{ql.ho_ten}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pham_vi_bao_gom">Phạm vi công việc bao gồm</Label>
                <Textarea id="pham_vi_bao_gom" rows={2} {...register("pham_vi_bao_gom")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pham_vi_khong_bao_gom">Phạm vi không bao gồm</Label>
                <Textarea id="pham_vi_khong_bao_gom" rows={2} {...register("pham_vi_khong_bao_gom")} />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Đang lưu…" : "Lưu báo giá"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
