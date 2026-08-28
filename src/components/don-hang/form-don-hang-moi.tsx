"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { donHangSchema, DICH_VU, UU_TIEN, type DonHangFormValues } from "@/lib/schemas/don-hang";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ChonKhachHang } from "@/components/khach-hang/chon-khach-hang";
import { UploadAnh } from "@/components/upload-anh";

export function FormDonHangMoi() {
  const router = useRouter();
  const [anhHienTrang, setAnhHienTrang] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DonHangFormValues>({
    resolver: zodResolver(donHangSchema),
    defaultValues: { uu_tien: "P2-Trong ngày" },
  });

  async function onSubmit(values: DonHangFormValues) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("don_hang")
      .insert({ ...values, anh_hien_trang: anhHienTrang })
      .select("ma_don")
      .single();

    if (error) {
      toast.error(`Không tạo được đơn hàng: ${error.message}`);
      return;
    }
    toast.success(`Đã tạo đơn ${data.ma_don}`);
    router.push(`/don-hang/${data.ma_don}`);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Khách hàng *</Label>
            <ChonKhachHang value={watch("ma_kh")} onChange={(maKh) => setValue("ma_kh", maKh, { shouldValidate: true })} />
            {errors.ma_kh ? <p className="text-sm text-destructive">{errors.ma_kh.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loại dịch vụ *</Label>
              <Select value={watch("dich_vu")} onValueChange={(v) => setValue("dich_vu", v as DonHangFormValues["dich_vu"], { shouldValidate: true })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  {DICH_VU.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.dich_vu ? <p className="text-sm text-destructive">{errors.dich_vu.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Mức ưu tiên *</Label>
              <Select value={watch("uu_tien")} onValueChange={(v) => setValue("uu_tien", v as DonHangFormValues["uu_tien"])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn mức ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  {UU_TIEN.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mo_ta_su_co">Mô tả sự cố *</Label>
            <Textarea id="mo_ta_su_co" rows={3} {...register("mo_ta_su_co")} />
            {errors.mo_ta_su_co ? <p className="text-sm text-destructive">{errors.mo_ta_su_co.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="khung_gio_mong_muon">Khung giờ mong muốn</Label>
            <Input id="khung_gio_mong_muon" placeholder="VD: 14h-17h hôm nay" {...register("khung_gio_mong_muon")} />
          </div>

          <div className="space-y-2">
            <Label>Ảnh hiện trạng</Label>
            <UploadAnh urls={anhHienTrang} onChange={setAnhHienTrang} thuMuc="hien-trang" />
          </div>

          <Button type="submit" disabled={isSubmitting} className="h-11 w-full text-base">
            {isSubmitting ? "Đang tạo…" : "Tạo đơn hàng"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
