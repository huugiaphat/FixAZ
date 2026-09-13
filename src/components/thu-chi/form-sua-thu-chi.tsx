"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { thuChiSchema, NOI_DUNG_THU_NHAP_TAY, NOI_DUNG_CHI, PHUONG_THUC_THU_CHI, type ThuChiFormValues } from "@/lib/schemas/thu-chi";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChonDonHang } from "@/components/don-hang/chon-don-hang";
import type { NhanVien, ThuChi } from "@/types/database";

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function FormSuaThuChi({ phieu, nhanVienList }: { phieu: ThuChi; nhanVienList: NhanVien[] }) {
  const [open, setOpen] = useState(false);
  const [gioGoc] = useState(() => new Date(phieu.ngay));
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ThuChiFormValues>({
    resolver: zodResolver(thuChiSchema),
    defaultValues: {
      loai: phieu.loai,
      ma_don: phieu.ma_don ?? undefined,
      ten_cong_trinh: phieu.ten_cong_trinh ?? undefined,
      noi_dung_thu: phieu.noi_dung_thu ?? undefined,
      noi_dung_chi: phieu.noi_dung_chi ?? undefined,
      so_tien: phieu.so_tien,
      phuong_thuc: phieu.phuong_thuc,
      nguoi_tao: phieu.nguoi_tao,
      ngay: toDateInputValue(gioGoc),
      ghi_chu: phieu.ghi_chu ?? undefined,
    },
  });

  const loai = watch("loai");

  async function onSubmit(values: ThuChiFormValues) {
    const supabase = createClient();
    const [nam, thang, ngay] = values.ngay.split("-").map(Number);
    const ngayThucTe = new Date(nam, thang - 1, ngay, gioGoc.getHours(), gioGoc.getMinutes(), gioGoc.getSeconds());

    const { error } = await supabase
      .from("thu_chi")
      .update({
        loai: values.loai,
        ma_don: values.ma_don || null,
        ten_cong_trinh: values.ten_cong_trinh || null,
        noi_dung_thu: values.loai === "Thu" ? values.noi_dung_thu : null,
        noi_dung_chi: values.loai === "Chi" ? values.noi_dung_chi : null,
        so_tien: values.so_tien,
        phuong_thuc: values.phuong_thuc,
        nguoi_tao: values.nguoi_tao,
        ngay: ngayThucTe.toISOString(),
        ghi_chu: values.ghi_chu || null,
      })
      .eq("ma_tc", phieu.ma_tc);
    if (error) {
      toast.error(`Không cập nhật được: ${error.message}`);
      return;
    }
    toast.success("Đã cập nhật phiếu thu chi");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Sửa phiếu thu chi" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa phiếu {phieu.ma_tc}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Loại *</Label>
            <Select
              value={loai}
              onValueChange={(v) => {
                setValue("loai", v as ThuChiFormValues["loai"]);
                setValue("noi_dung_thu", undefined);
                setValue("noi_dung_chi", undefined);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Thu">Thu</SelectItem>
                <SelectItem value="Chi">Chi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tên công trình</Label>
            <ChonDonHang
              value={watch("ma_don")}
              onChange={(maDon) => setValue("ma_don", maDon)}
              placeholder="Chọn đơn hàng có sẵn (không bắt buộc)…"
            />
            <Input placeholder="Hoặc nhập tên công trình khác (VD: Lương tháng 9, Chi phí văn phòng…)" {...register("ten_cong_trinh")} />
          </div>

          <div className="space-y-2">
            <Label>Danh mục {loai === "Thu" ? "thu" : "chi"} *</Label>
            {loai === "Thu" ? (
              <Select value={watch("noi_dung_thu")} onValueChange={(v) => setValue("noi_dung_thu", v as ThuChiFormValues["noi_dung_thu"], { shouldValidate: true })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn danh mục thu" />
                </SelectTrigger>
                <SelectContent>
                  {NOI_DUNG_THU_NHAP_TAY.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={watch("noi_dung_chi")} onValueChange={(v) => setValue("noi_dung_chi", v as ThuChiFormValues["noi_dung_chi"], { shouldValidate: true })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn danh mục chi" />
                </SelectTrigger>
                <SelectContent>
                  {NOI_DUNG_CHI.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.noi_dung_thu ? <p className="text-sm text-destructive">{errors.noi_dung_thu.message}</p> : null}
            {errors.noi_dung_chi ? <p className="text-sm text-destructive">{errors.noi_dung_chi.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="so_tien">Số tiền *</Label>
              <Input id="so_tien" type="number" min={0} step={1000} {...register("so_tien", { valueAsNumber: true })} />
              {errors.so_tien ? <p className="text-sm text-destructive">{errors.so_tien.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Phương thức *</Label>
              <Select value={watch("phuong_thuc")} onValueChange={(v) => setValue("phuong_thuc", v as ThuChiFormValues["phuong_thuc"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHUONG_THUC_THU_CHI.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Người thu chi *</Label>
              <Select value={watch("nguoi_tao")} onValueChange={(v) => setValue("nguoi_tao", v ?? "", { shouldValidate: true })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn người thu chi">
                    {(v: string) => nhanVienList.find((x) => x.ma_nv === v)?.ho_ten ?? v}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {nhanVienList.map((n) => (
                    <SelectItem key={n.ma_nv} value={n.ma_nv}>{n.ho_ten}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nguoi_tao ? <p className="text-sm text-destructive">{errors.nguoi_tao.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ngay">Ngày thu chi *</Label>
              <Input id="ngay" type="date" {...register("ngay")} />
              {errors.ngay ? <p className="text-sm text-destructive">{errors.ngay.message}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ghi_chu">Mô tả</Label>
            <Textarea id="ghi_chu" rows={2} {...register("ghi_chu")} />
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
