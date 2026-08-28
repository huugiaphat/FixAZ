"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { baoHanhSchema, type BaoHanhFormValues } from "@/lib/schemas/bao-hanh";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ChonDonHang } from "@/components/don-hang/chon-don-hang";

export function FormBaoHanhMoi() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BaoHanhFormValues>({ resolver: zodResolver(baoHanhSchema) });

  async function onSubmit(values: BaoHanhFormValues) {
    const supabase = createClient();
    const { error } = await supabase.from("bao_hanh").insert(values);
    if (error) {
      toast.error(`Không tạo được yêu cầu bảo hành: ${error.message}`);
      return;
    }
    toast.success("Đã ghi nhận yêu cầu bảo hành");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="h-4 w-4" /> Ghi nhận bảo hành
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ghi nhận yêu cầu bảo hành</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Đơn hàng cũ *</Label>
            <ChonDonHang
              value={watch("ma_don_cu")}
              onChange={(v) => setValue("ma_don_cu", v, { shouldValidate: true })}
              chiTrangThai="Đã đóng"
              placeholder="Tìm đơn đã đóng theo mã/mô tả…"
            />
            {errors.ma_don_cu ? <p className="text-sm text-destructive">{errors.ma_don_cu.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="noi_dung">Nội dung yêu cầu *</Label>
            <Textarea id="noi_dung" rows={3} {...register("noi_dung")} />
            {errors.noi_dung ? <p className="text-sm text-destructive">{errors.noi_dung.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pham_vi">Phạm vi</Label>
            <Textarea id="pham_vi" rows={2} {...register("pham_vi")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Đang lưu…" : "Lưu yêu cầu bảo hành"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
