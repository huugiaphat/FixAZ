"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { khieuNaiSchema, MUC_DO_KHIEU_NAI, type KhieuNaiFormValues } from "@/lib/schemas/khieu-nai";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChonDonHang } from "@/components/don-hang/chon-don-hang";

export function FormKhieuNaiMoi() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KhieuNaiFormValues>({ resolver: zodResolver(khieuNaiSchema), defaultValues: { muc_do: "Trung bình" } });

  async function onSubmit(values: KhieuNaiFormValues) {
    const supabase = createClient();
    const { error } = await supabase.from("khieu_nai").insert({
      ma_don: values.ma_don,
      noi_dung: values.noi_dung,
      muc_do: values.muc_do,
      han_xu_ly: values.han_xu_ly || null,
    });
    if (error) {
      toast.error(`Không tạo được khiếu nại: ${error.message}`);
      return;
    }
    toast.success("Đã ghi nhận khiếu nại");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="h-4 w-4" /> Ghi nhận khiếu nại
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ghi nhận khiếu nại mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Đơn hàng liên quan *</Label>
            <ChonDonHang value={watch("ma_don")} onChange={(v) => setValue("ma_don", v, { shouldValidate: true })} />
            {errors.ma_don ? <p className="text-sm text-destructive">{errors.ma_don.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="noi_dung">Nội dung khiếu nại *</Label>
            <Textarea id="noi_dung" rows={3} {...register("noi_dung")} />
            {errors.noi_dung ? <p className="text-sm text-destructive">{errors.noi_dung.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mức độ *</Label>
              <Select value={watch("muc_do")} onValueChange={(v) => setValue("muc_do", v as KhieuNaiFormValues["muc_do"])}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MUC_DO_KHIEU_NAI.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="han_xu_ly">Hạn xử lý</Label>
              <Input id="han_xu_ly" type="date" {...register("han_xu_ly")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Đang lưu…" : "Lưu khiếu nại"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
