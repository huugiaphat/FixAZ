"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  thuChiNhieuDongSchema,
  NOI_DUNG_THU_NHAP_TAY,
  NOI_DUNG_CHI,
  PHUONG_THUC_THU_CHI,
  type ThuChiNhieuDongValues,
} from "@/lib/schemas/thu-chi";
import { createClient } from "@/lib/supabase/client";
import { formatVND } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChonDonHang } from "@/components/don-hang/chon-don-hang";
import type { NhanVien, ThuChi, ThuChiDong } from "@/types/database";

function ngayHomNay() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ngayCuaPhieu(value: string) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dongTrong(): ThuChiNhieuDongValues["dong"][number] {
  return { ten_hh_dv: "", don_gia: 0, so_luong: 1 };
}

function giaTriBanDau(maNv: string, phieu?: ThuChi): ThuChiNhieuDongValues {
  return {
    loai: phieu?.loai ?? "Thu",
    ma_don: phieu?.ma_don ?? undefined,
    ten_cong_trinh: phieu?.ten_cong_trinh ?? undefined,
    noi_dung_thu: phieu?.noi_dung_thu ?? undefined,
    noi_dung_chi: phieu?.noi_dung_chi ?? undefined,
    phuong_thuc: phieu?.phuong_thuc === "Chuyển khoản" ? "Chuyển khoản" : "Tiền mặt",
    nguoi_tao: phieu?.nguoi_tao ?? maNv,
    ngay: phieu ? ngayCuaPhieu(phieu.ngay) : ngayHomNay(),
    ghi_chu: phieu?.ghi_chu ?? undefined,
    dong: [dongTrong()],
  };
}

function FormThuChiNhieuDong({
  maNvHienTai,
  phieu,
  nhanVienListBanDau,
}: {
  maNvHienTai: string;
  phieu?: ThuChi;
  nhanVienListBanDau?: NhanVien[];
}) {
  const [open, setOpen] = useState(false);
  const [dangTaiDong, setDangTaiDong] = useState(false);
  const [loiTaiDong, setLoiTaiDong] = useState<string | null>(null);
  const [nhanVienList, setNhanVienList] = useState<NhanVien[]>(nhanVienListBanDau ?? []);
  const router = useRouter();
  const { register, handleSubmit, setValue, reset, control, formState: { errors, isSubmitting } } = useForm<ThuChiNhieuDongValues>({
    resolver: zodResolver(thuChiNhieuDongSchema),
    defaultValues: giaTriBanDau(maNvHienTai, phieu),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "dong" });
  const dong = useWatch({ control, name: "dong" });
  const loai = useWatch({ control, name: "loai" });
  const maDon = useWatch({ control, name: "ma_don" });
  const noiDungThu = useWatch({ control, name: "noi_dung_thu" });
  const noiDungChi = useWatch({ control, name: "noi_dung_chi" });
  const phuongThuc = useWatch({ control, name: "phuong_thuc" });
  const nguoiTao = useWatch({ control, name: "nguoi_tao" });
  const tong = (dong ?? []).reduce((sum, item) => {
    const thanhTien = Number(item?.don_gia) * Number(item?.so_luong);
    return sum + (Number.isFinite(thanhTien) ? Math.round(thanhTien) : 0);
  }, 0);

  useEffect(() => {
    if (nhanVienListBanDau) return;
    createClient().from("nhan_vien").select("*").eq("trang_thai", "Đang làm").order("ho_ten")
      .then(({ data }) => setNhanVienList((data as NhanVien[]) ?? []));
  }, [nhanVienListBanDau]);

  useEffect(() => {
    if (!open || !phieu) return;
    let huy = false;
    createClient().from("thu_chi_dong").select("*").eq("ma_tc", phieu.ma_tc).order("thu_tu")
      .then(({ data, error }) => {
        if (huy) return;
        setDangTaiDong(false);
        if (error || !data?.length) {
          setLoiTaiDong(error?.message ?? "Không tìm thấy các dòng HH/DV của phiếu.");
          return;
        }
        const chiTiet = data as ThuChiDong[];
        reset({ ...giaTriBanDau(maNvHienTai, phieu), dong: chiTiet.map((item) => ({
          ten_hh_dv: item.ten_hh_dv,
          don_gia: item.don_gia,
          so_luong: item.so_luong,
        })) });
      });
    return () => { huy = true; };
  }, [open, phieu, maNvHienTai, reset]);

  async function onSubmit(values: ThuChiNhieuDongValues) {
    const [nam, thang, ngay] = values.ngay.split("-").map(Number);
    const gioGoc = phieu ? new Date(phieu.ngay) : new Date();
    const ngayThucTe = new Date(nam, thang - 1, ngay, gioGoc.getHours(), gioGoc.getMinutes(), gioGoc.getSeconds());
    const { error } = await createClient().rpc("f_luu_phieu_thu_chi_nhieu_dong", {
      p_loai: values.loai,
      p_ma_don: values.ma_don || null,
      p_ten_cong_trinh: values.ten_cong_trinh || null,
      p_noi_dung_thu: values.loai === "Thu" ? values.noi_dung_thu : null,
      p_noi_dung_chi: values.loai === "Chi" ? values.noi_dung_chi : null,
      p_phuong_thuc: values.phuong_thuc,
      p_nguoi_tao: values.nguoi_tao,
      p_ngay: ngayThucTe.toISOString(),
      p_ghi_chu: values.ghi_chu || null,
      p_dong: values.dong,
      p_ma_tc: phieu?.ma_tc ?? null,
      p_da_duyet: phieu?.da_duyet ?? null,
    });
    if (error) {
      toast.error(`Không lưu được phiếu: ${error.message}`);
      return;
    }
    toast.success(phieu ? "Đã cập nhật phiếu thu chi" : `Đã tạo phiếu với ${values.dong.length} dòng HH/DV`);
    if (!phieu) reset(giaTriBanDau(maNvHienTai));
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
      setOpen(next);
      if (next && phieu) { setDangTaiDong(true); setLoiTaiDong(null); }
    }}>
      {phieu ? (
        <DialogTrigger render={<Button variant="ghost" size="icon" aria-label={`Sửa phiếu ${phieu.ma_tc}`} />}><Pencil className="h-4 w-4" /></DialogTrigger>
      ) : (
        <DialogTrigger render={<Button className="gap-2" />}><Plus className="h-4 w-4" /> Thêm thu chi</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader><DialogTitle>{phieu ? `Sửa phiếu ${phieu.ma_tc}` : "Thêm khoản thu chi"}</DialogTitle></DialogHeader>
        {loiTaiDong ? <p className="text-sm text-destructive">Lỗi tải chi tiết: {loiTaiDong}</p> : null}
        {dangTaiDong ? <p className="text-sm text-muted-foreground">Đang tải chi tiết phiếu…</p> : null}
        {(!phieu || (!dangTaiDong && !loiTaiDong)) ? <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Loại *</Label>
              <Select value={loai} onValueChange={(v) => {
                setValue("loai", v as ThuChiNhieuDongValues["loai"], { shouldValidate: true });
                setValue("noi_dung_thu", undefined);
                setValue("noi_dung_chi", undefined);
              }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Thu">Thu</SelectItem><SelectItem value="Chi">Chi</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Danh mục {loai === "Thu" ? "thu" : "chi"} *</Label>
              {loai === "Thu" ? (
                <Select value={noiDungThu} onValueChange={(v) => setValue("noi_dung_thu", v as ThuChiNhieuDongValues["noi_dung_thu"], { shouldValidate: true })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Chọn danh mục thu" /></SelectTrigger>
                  <SelectContent>{NOI_DUNG_THU_NHAP_TAY.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Select value={noiDungChi} onValueChange={(v) => setValue("noi_dung_chi", v as ThuChiNhieuDongValues["noi_dung_chi"], { shouldValidate: true })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Chọn danh mục chi" /></SelectTrigger>
                  <SelectContent>{NOI_DUNG_CHI.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              )}
              {errors.noi_dung_thu ? <p className="text-sm text-destructive">{errors.noi_dung_thu.message}</p> : null}
              {errors.noi_dung_chi ? <p className="text-sm text-destructive">{errors.noi_dung_chi.message}</p> : null}
              {loai === "Thu" ? <p className="text-xs text-muted-foreground">Khoản khách thanh toán trong đơn hàng đã tự đồng bộ từ tab Thu tiền, không nhập lại ở đây.</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tên công trình</Label>
            <ChonDonHang value={maDon} onChange={(maDonMoi) => setValue("ma_don", maDonMoi)} placeholder="Chọn đơn hàng có sẵn (không bắt buộc)…" />
            <Input placeholder="Hoặc nhập tên công trình khác" {...register("ten_cong_trinh")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Phương thức *</Label>
              <Select value={phuongThuc} onValueChange={(v) => setValue("phuong_thuc", v as ThuChiNhieuDongValues["phuong_thuc"], { shouldValidate: true })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{PHUONG_THUC_THU_CHI.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Người thu chi *</Label>
              <Select value={nguoiTao} onValueChange={(v) => setValue("nguoi_tao", v ?? "", { shouldValidate: true })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Chọn người thu chi">{(v: string) => {
                  const n = nhanVienList.find((x) => x.ma_nv === v);
                  return n ? `${n.ho_ten}${n.ma_nv === maNvHienTai ? " (Tôi)" : ""}` : v;
                }}</SelectValue></SelectTrigger>
                <SelectContent>{nhanVienList.map((n) => <SelectItem key={n.ma_nv} value={n.ma_nv}>{n.ho_ten}{n.ma_nv === maNvHienTai ? " (Tôi)" : ""}</SelectItem>)}</SelectContent>
              </Select>
              {errors.nguoi_tao ? <p className="text-sm text-destructive">{errors.nguoi_tao.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ngay-thu-chi">Ngày thu chi *</Label>
              <Input id="ngay-thu-chi" type="date" {...register("ngay")} />
              {errors.ngay ? <p className="text-sm text-destructive">{errors.ngay.message}</p> : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><Label>Chi tiết HH/DV *</Label><p className="text-xs text-muted-foreground">Thành tiền = Đơn giá × Số lượng</p></div>
              <Button type="button" variant="outline" size="sm" disabled={fields.length >= 50} onClick={() => append(dongTrong())}><Plus className="h-4 w-4" /> Thêm dòng</Button>
            </div>
            {fields.map((field, index) => {
              const gia = Number(dong?.[index]?.don_gia);
              const luong = Number(dong?.[index]?.so_luong);
              const thanhTien = Number.isFinite(gia * luong) ? Math.round(gia * luong) : 0;
              return <div key={field.id} className="space-y-3 rounded-xl border bg-muted/30 p-3">
                <div className="flex items-center justify-between"><p className="font-medium">Dòng {index + 1}</p><Button type="button" variant="ghost" size="icon-sm" disabled={fields.length === 1} aria-label={`Xóa dòng ${index + 1}`} onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button></div>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="space-y-1"><Label htmlFor={`ten-hh-dv-${index}`}>Tên HH/DV</Label><Input id={`ten-hh-dv-${index}`} placeholder="Tên hàng hóa hoặc dịch vụ" {...register(`dong.${index}.ten_hh_dv`)} />{errors.dong?.[index]?.ten_hh_dv ? <p className="text-xs text-destructive">{errors.dong[index].ten_hh_dv.message}</p> : null}</div>
                  <div className="space-y-1"><Label htmlFor={`don-gia-${index}`}>Đơn giá</Label><Input id={`don-gia-${index}`} type="number" min="0" step="any" {...register(`dong.${index}.don_gia`, { valueAsNumber: true })} />{errors.dong?.[index]?.don_gia ? <p className="text-xs text-destructive">{errors.dong[index].don_gia.message}</p> : null}</div>
                  <div className="space-y-1"><Label htmlFor={`so-luong-${index}`}>Số lượng</Label><Input id={`so-luong-${index}`} type="number" min="0" step="any" {...register(`dong.${index}.so_luong`, { valueAsNumber: true })} />{errors.dong?.[index]?.so_luong ? <p className="text-xs text-destructive">{errors.dong[index].so_luong.message}</p> : null}</div>
                  <div className="space-y-1"><Label>Thành tiền</Label><div className="flex h-11 items-center rounded-lg border bg-background px-3 font-semibold tabular-nums">{formatVND(thanhTien)}</div></div>
                </div>
              </div>;
            })}
            {errors.dong?.root ? <p className="text-sm text-destructive">{errors.dong.root.message}</p> : null}
            <p className="text-right text-lg font-semibold">Tổng phiếu: {formatVND(tong)}</p>
          </div>

          <div className="space-y-2"><Label htmlFor="ghi-chu-thu-chi">Mô tả chung</Label><Textarea id="ghi-chu-thu-chi" rows={2} {...register("ghi_chu")} /></div>
          <DialogFooter><Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">{isSubmitting ? "Đang lưu…" : phieu ? "Lưu thay đổi" : `Lưu ${fields.length} dòng`}</Button></DialogFooter>
        </form> : null}
      </DialogContent>
    </Dialog>
  );
}

export function FormThuChiMoi({ maNvHienTai }: { maNvHienTai: string }) {
  return <FormThuChiNhieuDong maNvHienTai={maNvHienTai} />;
}

export function FormSuaThuChiNhieuDong({ phieu, maNvHienTai, nhanVienList }: { phieu: ThuChi; maNvHienTai: string; nhanVienList: NhanVien[] }) {
  return <FormThuChiNhieuDong maNvHienTai={maNvHienTai} phieu={phieu} nhanVienListBanDau={nhanVienList} />;
}
