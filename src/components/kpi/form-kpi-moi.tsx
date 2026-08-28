"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { kpiSchema, type KpiFormValues, type KpiFormInput } from "@/lib/schemas/kpi";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { NhanVien } from "@/types/database";

function thangHienTai() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function FormKpiMoi() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const [nhanVienList, setNhanVienList] = useState<NhanVien[]>([]);

  useEffect(() => {
    if (!open) return;
    supabase.from("nhan_vien").select("*").then(({ data }) => setNhanVienList((data as NhanVien[]) ?? []));
  }, [open, supabase]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KpiFormInput, unknown, KpiFormValues>({
    resolver: zodResolver(kpiSchema),
    defaultValues: { thang: thangHienTai() },
  });

  async function onSubmit(values: KpiFormValues) {
    const { error } = await supabase.from("kpi_nhan_vien").upsert(values, { onConflict: "ma_nv,thang" });
    if (error) {
      toast.error(`Không lưu được KPI: ${error.message}`);
      return;
    }
    toast.success("Đã chấm KPI");
    reset({ thang: thangHienTai() });
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="h-4 w-4" /> Chấm KPI
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chấm điểm KPI hàng tháng</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nhân viên *</Label>
            <Select value={watch("ma_nv")} onValueChange={(v) => setValue("ma_nv", v ?? "", { shouldValidate: true })}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Chọn nhân viên" /></SelectTrigger>
              <SelectContent>
                {nhanVienList.map((nv) => (
                  <SelectItem key={nv.ma_nv} value={nv.ma_nv}>{nv.ho_ten} — {nv.vai_tro_app}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.ma_nv ? <p className="text-sm text-destructive">{errors.ma_nv.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thang">Tháng *</Label>
              <Input id="thang" type="month" {...register("thang")} />
              {errors.thang ? <p className="text-sm text-destructive">{errors.thang.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="diem_tong">Điểm tổng (0-100) *</Label>
              <Input id="diem_tong" type="number" min={0} max={100} {...register("diem_tong", { valueAsNumber: true })} />
              {errors.diem_tong ? <p className="text-sm text-destructive">{errors.diem_tong.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chi_tiet_diem">Chi tiết chấm điểm</Label>
            <Textarea id="chi_tiet_diem" rows={3} {...register("chi_tiet_diem")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Đang lưu…" : "Lưu KPI"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
