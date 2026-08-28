"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { xuatNhapKhoSchema, type XuatNhapKhoFormValues, type XuatNhapKhoFormInput } from "@/lib/schemas/vat-tu";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight } from "lucide-react";
import type { VatTuTinhToan } from "@/types/database";

export function FormXuatNhapKho({ danhSachVatTu }: { danhSachVatTu: VatTuTinhToan[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<XuatNhapKhoFormInput, unknown, XuatNhapKhoFormValues>({
    resolver: zodResolver(xuatNhapKhoSchema),
    defaultValues: { loai: "Nhập" },
  });

  async function onSubmit(values: XuatNhapKhoFormValues) {
    const supabase = createClient();
    const { error } = await supabase.from("xuat_nhap_kho").insert({
      ma_vt: values.ma_vt,
      loai: values.loai,
      so_luong: values.so_luong,
      ma_don: values.ma_don || null,
    });
    if (error) {
      toast.error(`Không ghi nhận được: ${error.message}`);
      return;
    }
    toast.success(`Đã ghi nhận ${values.loai.toLowerCase()} kho`);
    reset({ loai: "Nhập" });
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="gap-2" />}>
        <ArrowLeftRight className="h-4 w-4" /> Nhập/Xuất kho
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ghi nhận nhập/xuất kho</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Vật tư *</Label>
            <Select value={watch("ma_vt")} onValueChange={(v) => setValue("ma_vt", v ?? "", { shouldValidate: true })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn vật tư" />
              </SelectTrigger>
              <SelectContent>
                {danhSachVatTu.map((vt) => (
                  <SelectItem key={vt.ma_vt} value={vt.ma_vt}>
                    {vt.ten} (tồn: {vt.ton_kho})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.ma_vt ? <p className="text-sm text-destructive">{errors.ma_vt.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Loại *</Label>
            <Select value={watch("loai")} onValueChange={(v) => setValue("loai", v as XuatNhapKhoFormValues["loai"])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nhập">Nhập kho</SelectItem>
                <SelectItem value="Xuất">Xuất kho</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="so_luong">Số lượng *</Label>
            <Input id="so_luong" type="number" min={0} step={1} {...register("so_luong", { valueAsNumber: true })} />
            {errors.so_luong ? <p className="text-sm text-destructive">{errors.so_luong.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ma_don">Mã đơn liên quan (nếu xuất cho 1 đơn cụ thể)</Label>
            <Input id="ma_don" placeholder="VD: SC-260827-001" {...register("ma_don")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Đang lưu…" : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
