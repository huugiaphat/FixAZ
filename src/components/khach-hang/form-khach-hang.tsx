"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { khachHangSchema, NGUON_KHACH_HANG, type KhachHangFormValues } from "@/lib/schemas/khach-hang";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FormKhachHangMoi() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KhachHangFormValues>({ resolver: zodResolver(khachHangSchema) });

  async function onSubmit(values: KhachHangFormValues) {
    const supabase = createClient();
    const { error } = await supabase.from("khach_hang").insert(values);
    if (error) {
      toast.error(`Không tạo được khách hàng: ${error.message}`);
      return;
    }
    toast.success("Đã tạo khách hàng mới");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="h-4 w-4" /> Thêm khách hàng
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm khách hàng mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ho_ten">Họ tên *</Label>
            <Input id="ho_ten" {...register("ho_ten")} />
            {errors.ho_ten ? <p className="text-sm text-destructive">{errors.ho_ten.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sdt">Số điện thoại *</Label>
            <Input id="sdt" inputMode="tel" {...register("sdt")} />
            {errors.sdt ? <p className="text-sm text-destructive">{errors.sdt.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dia_chi">Địa chỉ *</Label>
            <Textarea id="dia_chi" rows={2} {...register("dia_chi")} />
            {errors.dia_chi ? <p className="text-sm text-destructive">{errors.dia_chi.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Nguồn tiếp cận</Label>
            <Select value={watch("nguon")} onValueChange={(v) => setValue("nguon", v as KhachHangFormValues["nguon"])}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn nguồn (tùy chọn)" />
              </SelectTrigger>
              <SelectContent>
                {NGUON_KHACH_HANG.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Đang lưu…" : "Lưu khách hàng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
