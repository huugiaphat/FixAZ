"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { bangGiaDichVuSchema, type BangGiaDichVuFormValues } from "@/lib/schemas/danh-muc";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FormBangGiaMoi() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BangGiaDichVuFormValues>({ resolver: zodResolver(bangGiaDichVuSchema), defaultValues: { nhom_dich_vu: "Điện" } });

  async function onSubmit(values: BangGiaDichVuFormValues) {
    const supabase = createClient();
    const { error } = await supabase.from("bang_gia_dich_vu").insert(values);
    if (error) {
      toast.error(`Không tạo được: ${error.message}`);
      return;
    }
    toast.success("Đã thêm dịch vụ");
    reset({ nhom_dich_vu: "Điện" });
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-2" />}>
        <Plus className="h-4 w-4" /> Thêm dịch vụ
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Thêm dịch vụ vào bảng giá</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ten_dich_vu">Tên dịch vụ *</Label>
            <Input id="ten_dich_vu" {...register("ten_dich_vu")} />
            {errors.ten_dich_vu ? <p className="text-sm text-destructive">{errors.ten_dich_vu.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nhóm dịch vụ *</Label>
              <Select value={watch("nhom_dich_vu")} onValueChange={(v) => setValue("nhom_dich_vu", v as BangGiaDichVuFormValues["nhom_dich_vu"])}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Điện">Điện</SelectItem>
                  <SelectItem value="Nước">Nước</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="don_vi_tinh">Đơn vị tính *</Label>
              <Input id="don_vi_tinh" {...register("don_vi_tinh")} />
              {errors.don_vi_tinh ? <p className="text-sm text-destructive">{errors.don_vi_tinh.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gia_tham_khao">Giá tham khảo</Label>
            <Input id="gia_tham_khao" placeholder="VD: 100.000 - 300.000 đ" {...register("gia_tham_khao")} />
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
