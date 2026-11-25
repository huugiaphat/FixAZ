"use client";

import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deXuatThanhToanSchema, NOI_DUNG_CHI, PHUONG_THUC_THU_CHI, type DeXuatThanhToanValues } from "@/lib/schemas/thu-chi";
import { formatVND } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChonDonHang } from "@/components/don-hang/chon-don-hang";

const macDinh: DeXuatThanhToanValues = {
  ma_don: "", ten_cong_trinh: "", noi_dung_chi: "Vật tư",
  phuong_thuc: "Tiền mặt", ghi_chu: "",
  dong: [{ ten_hh_dv: "", don_gia: 0, so_luong: 1 }],
};

export function FormDeXuatThanhToan({ maDx, banDau }: { maDx?: string; banDau?: DeXuatThanhToanValues }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, setValue, control, reset, formState: { errors, isSubmitting } } =
    useForm<DeXuatThanhToanValues>({ resolver: zodResolver(deXuatThanhToanSchema), defaultValues: banDau ?? macDinh });
  const { fields, append, remove } = useFieldArray({ control, name: "dong" });
  const dong = useWatch({ control, name: "dong" });
  const maDon = useWatch({ control, name: "ma_don" });
  const danhMuc = useWatch({ control, name: "noi_dung_chi" });
  const phuongThuc = useWatch({ control, name: "phuong_thuc" });
  const tong = (dong ?? []).reduce((sum, item) => sum + Math.round((Number(item?.don_gia) || 0) * (Number(item?.so_luong) || 0)), 0);

  async function luu(values: DeXuatThanhToanValues) {
    const { data, error } = await createClient().rpc("f_luu_de_xuat_thanh_toan", {
      p_ma_don: values.ma_don || null,
      p_ten_cong_trinh: values.ten_cong_trinh || null,
      p_noi_dung_chi: values.noi_dung_chi,
      p_phuong_thuc: values.phuong_thuc,
      p_ghi_chu: values.ghi_chu || null,
      p_dong: values.dong,
      p_ma_dx: maDx ?? null,
    });
    if (error) { toast.error(`Không lưu được đề xuất: ${error.message}`); return; }
    toast.success(maDx ? "Đã cập nhật đề xuất" : "Đã gửi đề xuất chờ Admin duyệt");
    if (!maDx) reset(macDinh);
    setOpen(false);
    router.refresh();
    if (!maDx && typeof data === "string") router.push(`/de-xuat-thanh-toan/${encodeURIComponent(data)}`);
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger render={<Button variant={maDx ? "outline" : "default"} />}>
      {maDx ? "Sửa đề xuất" : <><Plus className="size-4" /> Đề xuất thanh toán</>}
    </DialogTrigger>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
      <DialogHeader><DialogTitle>{maDx ? `Sửa đề xuất ${maDx}` : "Đề xuất thanh toán"}</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit(luu)} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Danh mục chi *</Label>
            <Select value={danhMuc} onValueChange={v => setValue("noi_dung_chi", v as DeXuatThanhToanValues["noi_dung_chi"], { shouldValidate: true })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{NOI_DUNG_CHI.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
            {errors.noi_dung_chi && <p className="text-sm text-destructive">{errors.noi_dung_chi.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Phương thức *</Label>
            <Select value={phuongThuc} onValueChange={v => setValue("phuong_thuc", v as DeXuatThanhToanValues["phuong_thuc"], { shouldValidate: true })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{PHUONG_THUC_THU_CHI.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Tên công trình</Label>
          <ChonDonHang value={maDon} onChange={v => setValue("ma_don", v)} placeholder="Chọn đơn hàng (không bắt buộc)…" />
          <Input placeholder="Hoặc nhập tên công trình/chi phí khác" {...register("ten_cong_trinh")} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div><Label>Chi tiết HH/DV *</Label><p className="text-xs text-muted-foreground">Thành tiền = Đơn giá × Số lượng</p></div>
          <Button type="button" variant="outline" size="sm" disabled={fields.length >= 50}
            onClick={() => append({ ten_hh_dv: "", don_gia: 0, so_luong: 1 })}><Plus className="size-4" /> Thêm dòng</Button>
        </div>
        <div className="space-y-3">
          {fields.map((field, index) => {
            const thanhTien = Math.round((Number(dong?.[index]?.don_gia) || 0) * (Number(dong?.[index]?.so_luong) || 0));
            return <div key={field.id} className="rounded-xl border p-3">
              <div className="mb-3 flex items-center justify-between"><span className="font-medium">Dòng {index + 1}</span>
                <Button type="button" variant="ghost" size="icon-sm" disabled={fields.length === 1}
                  aria-label={`Xóa dòng ${index + 1}`} onClick={() => remove(index)}><Trash2 className="size-4" /></Button></div>
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
                <div className="space-y-1"><Label>Tên HH/DV</Label><Input {...register(`dong.${index}.ten_hh_dv`)} />{errors.dong?.[index]?.ten_hh_dv && <p className="text-xs text-destructive">{errors.dong[index].ten_hh_dv.message}</p>}</div>
                <div className="space-y-1"><Label>Đơn giá</Label><Input type="number" min="0" step="any" {...register(`dong.${index}.don_gia`, { valueAsNumber: true })} />{errors.dong?.[index]?.don_gia && <p className="text-xs text-destructive">{errors.dong[index].don_gia.message}</p>}</div>
                <div className="space-y-1"><Label>Số lượng</Label><Input type="number" min="0" step="any" {...register(`dong.${index}.so_luong`, { valueAsNumber: true })} />{errors.dong?.[index]?.so_luong && <p className="text-xs text-destructive">{errors.dong[index].so_luong.message}</p>}</div>
                <div className="space-y-1"><Label>Thành tiền</Label><div className="flex h-11 items-center rounded-lg border px-3 font-semibold tabular-nums">{formatVND(thanhTien)}</div></div>
              </div>
            </div>;
          })}
        </div>
        <p className="text-right text-lg font-semibold">Tổng đề xuất: {formatVND(tong)}</p>
        <div className="space-y-2"><Label>Mô tả chung</Label><Textarea rows={2} {...register("ghi_chu")} /></div>
        <DialogFooter><Button type="submit" disabled={isSubmitting || tong <= 0}>{isSubmitting ? "Đang lưu…" : maDx ? "Lưu thay đổi" : "Gửi đề xuất"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
