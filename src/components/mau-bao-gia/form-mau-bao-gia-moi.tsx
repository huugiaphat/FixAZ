"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { mauBaoGiaSchema, type MauBaoGiaFormValues } from "@/lib/schemas/mau-bao-gia";
import { DICH_VU } from "@/lib/schemas/don-hang";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FormMauBaoGiaMoi() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MauBaoGiaFormValues>({ resolver: zodResolver(mauBaoGiaSchema) });

  async function onSubmit(values: MauBaoGiaFormValues) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("mau_bao_gia")
      .insert({
        ten_khach_hang: values.ten_khach_hang,
        sdt: values.sdt || null,
        dia_chi: values.dia_chi || null,
        dich_vu: values.dich_vu || null,
        ghi_chu: values.ghi_chu || null,
      })
      .select("ma_mbg")
      .single();
    if (error || !data) {
      toast.error(`Không tạo được mẫu báo giá: ${error?.message}`);
      return;
    }
    toast.success("Đã tạo mẫu báo giá");
    reset();
    setOpen(false);
    router.push(`/mau-bao-gia/${data.ma_mbg}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="h-4 w-4" /> Tạo mẫu báo giá
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo mẫu báo giá</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ten_khach_hang">Tên khách hàng *</Label>
            <Input id="ten_khach_hang" {...register("ten_khach_hang")} />
            {errors.ten_khach_hang ? <p className="text-sm text-destructive">{errors.ten_khach_hang.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sdt">Số điện thoại</Label>
              <Input id="sdt" {...register("sdt")} />
            </div>
            <div className="space-y-2">
              <Label>Dịch vụ</Label>
              <Select value={watch("dich_vu")} onValueChange={(v) => setValue("dich_vu", v as MauBaoGiaFormValues["dich_vu"])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  {DICH_VU.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dia_chi">Địa chỉ</Label>
            <Input id="dia_chi" {...register("dia_chi")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ghi_chu">Ghi chú</Label>
            <Textarea id="ghi_chu" rows={2} placeholder="Điều khoản, lưu ý gửi khách…" {...register("ghi_chu")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Đang tạo…" : "Tạo và thêm hạng mục"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
