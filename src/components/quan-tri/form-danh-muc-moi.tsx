"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { danhMucSchema, type DanhMucFormValues } from "@/lib/schemas/danh-muc";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export function FormDanhMucMoi({ loaiGoiY }: { loaiGoiY?: string[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DanhMucFormValues>({ resolver: zodResolver(danhMucSchema) });

  async function onSubmit(values: DanhMucFormValues) {
    const supabase = createClient();
    const { error } = await supabase.from("danh_muc").insert(values);
    if (error) {
      toast.error(`Không tạo được: ${error.message}`);
      return;
    }
    toast.success("Đã thêm giá trị danh mục");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-2" />}>
        <Plus className="h-4 w-4" /> Thêm giá trị
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Thêm giá trị danh mục dùng chung</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loai_danh_muc">Loại danh mục *</Label>
            <Input id="loai_danh_muc" list="loai-danh-muc-goi-y" {...register("loai_danh_muc")} />
            <datalist id="loai-danh-muc-goi-y">
              {(loaiGoiY ?? []).map((l) => <option key={l} value={l} />)}
            </datalist>
            {errors.loai_danh_muc ? <p className="text-sm text-destructive">{errors.loai_danh_muc.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gia_tri">Giá trị *</Label>
            <Input id="gia_tri" {...register("gia_tri")} />
            {errors.gia_tri ? <p className="text-sm text-destructive">{errors.gia_tri.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mo_ta">Mô tả</Label>
            <Input id="mo_ta" {...register("mo_ta")} />
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
