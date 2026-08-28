"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { vatTuSchema, type VatTuFormValues, type VatTuFormInput } from "@/lib/schemas/vat-tu";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export function FormVatTuMoi() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VatTuFormInput, unknown, VatTuFormValues>({ resolver: zodResolver(vatTuSchema) });

  async function onSubmit(values: VatTuFormValues) {
    const supabase = createClient();
    const { error } = await supabase.from("vat_tu").insert(values);
    if (error) {
      toast.error(`Không tạo được vật tư: ${error.message}`);
      return;
    }
    toast.success("Đã thêm vật tư mới");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="h-4 w-4" /> Thêm vật tư
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm vật tư mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ten">Tên vật tư *</Label>
            <Input id="ten" {...register("ten")} />
            {errors.ten ? <p className="text-sm text-destructive">{errors.ten.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="quy_cach">Quy cách</Label>
            <Input id="quy_cach" {...register("quy_cach")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="don_vi_tinh">Đơn vị tính *</Label>
              <Input id="don_vi_tinh" {...register("don_vi_tinh")} />
              {errors.don_vi_tinh ? <p className="text-sm text-destructive">{errors.don_vi_tinh.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nguong_canh_bao_ton">Ngưỡng cảnh báo tồn</Label>
              <Input id="nguong_canh_bao_ton" type="number" min={0} {...register("nguong_canh_bao_ton", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gia_von">Giá vốn *</Label>
              <Input id="gia_von" type="number" min={0} step={1000} {...register("gia_von", { valueAsNumber: true })} />
              {errors.gia_von ? <p className="text-sm text-destructive">{errors.gia_von.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gia_ban">Giá bán *</Label>
              <Input id="gia_ban" type="number" min={0} step={1000} {...register("gia_ban", { valueAsNumber: true })} />
              {errors.gia_ban ? <p className="text-sm text-destructive">{errors.gia_ban.message}</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Đang lưu…" : "Lưu vật tư"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
