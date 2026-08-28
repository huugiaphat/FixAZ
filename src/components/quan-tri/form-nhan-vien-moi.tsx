"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Copy } from "lucide-react";
import { nhanVienSchema, VAI_TRO, KY_NANG, type NhanVienFormValues } from "@/lib/schemas/nhan-vien";
import { taoNhanVien } from "@/app/(app)/quan-tri/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FormNhanVienMoi() {
  const [open, setOpen] = useState(false);
  const [ketQua, setKetQua] = useState<{ email: string; matKhau: string } | null>(null);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NhanVienFormValues>({ resolver: zodResolver(nhanVienSchema), defaultValues: { vai_tro_app: "Thợ" } });

  async function onSubmit(values: NhanVienFormValues) {
    const ketQuaTao = await taoNhanVien(values);
    if (!ketQuaTao.ok) {
      toast.error(`Không tạo được nhân viên: ${ketQuaTao.loi}`);
      return;
    }
    setKetQua({ email: values.email, matKhau: ketQuaTao.matKhauTam! });
    reset({ vai_tro_app: "Thợ" });
    router.refresh();
  }

  function dongVaReset() {
    setOpen(false);
    setKetQua(null);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dongVaReset())}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="h-4 w-4" /> Thêm nhân viên
      </DialogTrigger>
      <DialogContent>
        {ketQua ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Đã tạo tài khoản thành công</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Gửi thông tin đăng nhập tạm thời này cho nhân viên qua kênh riêng tư (không gửi qua nơi công khai). Nhân viên nên đổi mật khẩu sau lần đăng nhập đầu.
            </p>
            <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
              <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{ketQua.email}</span></p>
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">Mật khẩu tạm:</span>
                <span className="font-mono font-medium">{ketQua.matKhau}</span>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(ketQua.matKhau); toast.success("Đã sao chép mật khẩu"); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </p>
            </div>
            <Button className="w-full" onClick={dongVaReset}>Đóng</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Thêm nhân viên mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ho_ten">Họ tên *</Label>
                <Input id="ho_ten" {...register("ho_ten")} />
                {errors.ho_ten ? <p className="text-sm text-destructive">{errors.ho_ten.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email đăng nhập *</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chuc_vu">Chức vụ *</Label>
                  <Input id="chuc_vu" {...register("chuc_vu")} />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sdt">Số điện thoại</Label>
                  <Input id="sdt" {...register("sdt")} />
                </div>
                <div className="space-y-2">
                  <Label>Kỹ năng</Label>
                  <Select value={watch("ky_nang")} onValueChange={(v) => setValue("ky_nang", v as NhanVienFormValues["ky_nang"])}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Điện/Nước" /></SelectTrigger>
                    <SelectContent>
                      {KY_NANG.map((k) => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="khu_vuc_phu_trach">Khu vực phụ trách</Label>
                <Input id="khu_vuc_phu_trach" {...register("khu_vuc_phu_trach")} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Đang tạo…" : "Tạo tài khoản"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
