"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { nhanVienSchema, VAI_TRO, KY_NANG, type NhanVienFormValues } from "@/lib/schemas/nhan-vien";
import { suaNhanVien } from "@/app/(app)/quan-tri/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { NhanVien } from "@/types/database";

export function FormSuaNhanVien({ nhanVien }: { nhanVien: NhanVien }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NhanVienFormValues>({
    resolver: zodResolver(nhanVienSchema),
    defaultValues: {
      ho_ten: nhanVien.ho_ten,
      email: nhanVien.email,
      chuc_vu: nhanVien.chuc_vu,
      vai_tro_app: nhanVien.vai_tro_app,
      sdt: nhanVien.sdt ?? "",
      ky_nang: nhanVien.ky_nang ?? [],
      khu_vuc_phu_trach: nhanVien.khu_vuc_phu_trach ?? "",
    },
  });

  async function onSubmit(values: NhanVienFormValues) {
    const ketQua = await suaNhanVien(nhanVien.ma_nv, values);
    if (!ketQua.ok) {
      toast.error(`Không lưu được: ${ketQua.loi}`);
      return;
    }
    toast.success("Đã cập nhật thông tin nhân viên");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" variant="ghost" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa thông tin nhân viên</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sua_ho_ten">Họ tên *</Label>
            <Input id="sua_ho_ten" {...register("ho_ten")} />
            {errors.ho_ten ? <p className="text-sm text-destructive">{errors.ho_ten.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sua_email">Email đăng nhập *</Label>
            <Input id="sua_email" type="email" {...register("email")} />
            {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sua_chuc_vu">Chức vụ *</Label>
              <Input id="sua_chuc_vu" {...register("chuc_vu")} />
              {errors.chuc_vu ? <p className="text-sm text-destructive">{errors.chuc_vu.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Vai trò *</Label>
              <Select value={watch("vai_tro_app")} onValueChange={(v) => setValue("vai_tro_app", v as NhanVienFormValues["vai_tro_app"])}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VAI_TRO.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sua_sdt">Số điện thoại *</Label>
            <Input id="sua_sdt" inputMode="tel" {...register("sdt")} />
            {errors.sdt ? <p className="text-sm text-destructive">{errors.sdt.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Kỹ năng</Label>
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
              {KY_NANG.map((k) => {
                const daChon = (watch("ky_nang") ?? []).includes(k);
                return (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={daChon}
                      onCheckedChange={(checked) => {
                        const hienTai = watch("ky_nang") ?? [];
                        setValue("ky_nang", checked ? [...hienTai, k] : hienTai.filter((x) => x !== k));
                      }}
                    />
                    {k}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sua_khu_vuc_phu_trach">Khu vực phụ trách</Label>
            <Input id="sua_khu_vuc_phu_trach" {...register("khu_vuc_phu_trach")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Đang lưu…" : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
