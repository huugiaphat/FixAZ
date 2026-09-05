"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { mauBaoGiaDongSchema, type MauBaoGiaDongFormValues } from "@/lib/schemas/mau-bao-gia";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export function FormThemDong({ maMbg }: { maMbg: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MauBaoGiaDongFormValues>({ resolver: zodResolver(mauBaoGiaDongSchema) });

  async function onSubmit(values: MauBaoGiaDongFormValues) {
    const supabase = createClient();
    const { error } = await supabase.from("mau_bao_gia_dong").insert({
      ma_mbg: maMbg,
      ten_hang_muc: values.ten_hang_muc,
      don_vi_tinh: values.don_vi_tinh || null,
      so_luong: values.so_luong,
      don_gia: values.don_gia,
    });
    if (error) {
      toast.error(`Không thêm được hạng mục: ${error.message}`);
      return;
    }
    toast.success("Đã thêm hạng mục");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
        <Plus className="h-4 w-4" /> Thêm hạng mục
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm hạng mục</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ten_hang_muc">Nội dung công việc *</Label>
            <Input id="ten_hang_muc" {...register("ten_hang_muc")} />
            {errors.ten_hang_muc ? <p className="text-sm text-destructive">{errors.ten_hang_muc.message}</p> : null}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="so_luong">Số lượng *</Label>
              <Input id="so_luong" type="number" min={0} step={1} {...register("so_luong", { valueAsNumber: true })} />
              {errors.so_luong ? <p className="text-sm text-destructive">{errors.so_luong.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="don_vi_tinh">ĐVT</Label>
              <Input id="don_vi_tinh" placeholder="cái, m, bộ…" {...register("don_vi_tinh")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="don_gia">Đơn giá *</Label>
              <Input id="don_gia" type="number" min={0} step={1000} {...register("don_gia", { valueAsNumber: true })} />
              {errors.don_gia ? <p className="text-sm text-destructive">{errors.don_gia.message}</p> : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Đang thêm…" : "Thêm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
