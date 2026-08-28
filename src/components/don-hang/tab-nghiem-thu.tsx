"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { nghiemThuSchema, CHECKLIST_NGHIEM_THU, type NghiemThuFormValues, type NghiemThuFormInput } from "@/lib/schemas/nghiem-thu";
import { createClient } from "@/lib/supabase/client";
import { saveOrQueue } from "@/lib/offline/queue";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadAnh } from "@/components/upload-anh";
import { cn } from "@/lib/utils";
import type { NghiemThu } from "@/types/database";

export function TabNghiemThu({ maDon, danhSach }: { maDon: string; danhSach: NghiemThu[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [anh, setAnh] = useState<string[]>([]);
  const [dangXacNhan, setDangXacNhan] = useState<string | null>(null);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<NghiemThuFormInput, unknown, NghiemThuFormValues>({
    resolver: zodResolver(nghiemThuSchema),
    defaultValues: Object.fromEntries(CHECKLIST_NGHIEM_THU.map((c) => [c.key, false])),
  });

  async function onSubmit(values: NghiemThuFormValues) {
    if (anh.length === 0) {
      toast.error("Bắt buộc phải có ảnh sau khi sửa xong.");
      return;
    }
    const ketQua = await saveOrQueue({
      bang: "nghiem_thu",
      thao_tac: "insert",
      gia_tri: { ma_don: maDon, ...values, anh_sau_sua: anh },
      mo_ta: `Nghiệm thu đơn ${maDon}`,
    });
    if (ketQua.error) {
      toast.error(`Không lưu được nghiệm thu: ${ketQua.error}`);
      return;
    }
    toast.success(ketQua.queued ? "Đã lưu tạm — sẽ đồng bộ khi có mạng" : "Đã ghi nhận nghiệm thu");
    reset();
    setAnh([]);
    router.refresh();
  }

  async function xacNhanKhach(maNt: string) {
    setDangXacNhan(maNt);
    const { error } = await supabase.from("nghiem_thu").update({ khach_xac_nhan: true }).eq("ma_nt", maNt);
    setDangXacNhan(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Đã ghi nhận khách xác nhận nghiệm thu — có thể thu tiền.");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có nghiệm thu nào.</p>
      ) : (
        <div className="space-y-2">
          {danhSach.map((nt) => (
            <Card key={nt.ma_nt}>
              <CardContent className="space-y-2 py-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{nt.ma_nt}</p>
                  {nt.khach_xac_nhan ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Khách đã xác nhận</Badge>
                  ) : (
                    <Badge variant="secondary">Chờ khách xác nhận</Badge>
                  )}
                </div>
                <ul className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                  {CHECKLIST_NGHIEM_THU.map((c) => (
                    <li key={c.key} className={cn(nt[c.key as keyof NghiemThu] ? "text-emerald-700" : "")}>
                      {nt[c.key as keyof NghiemThu] ? "✓" : "✗"} {c.nhan}
                    </li>
                  ))}
                </ul>
                {nt.diem_danh_gia ? (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={cn("h-4 w-4", i <= nt.diem_danh_gia! ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                    ))}
                  </div>
                ) : null}
                {nt.y_kien_khach ? <p className="text-sm italic text-muted-foreground">&quot;{nt.y_kien_khach}&quot;</p> : null}
                {!nt.khach_xac_nhan ? (
                  <Button size="sm" disabled={dangXacNhan === nt.ma_nt} onClick={() => xacNhanKhach(nt.ma_nt)}>
                    Ghi nhận khách đã xác nhận
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <p className="mb-3 font-medium">Lập biên bản nghiệm thu</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CHECKLIST_NGHIEM_THU.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={!!watch(c.key)} onCheckedChange={(v) => setValue(c.key, v === true)} />
                  {c.nhan}
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Ảnh sau khi sửa xong *</Label>
              <UploadAnh urls={anh} onChange={setAnh} thuMuc="nghiem-thu" batBuoc />
            </div>
            <div className="space-y-2">
              <Label>Đánh giá của khách</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" onClick={() => setValue("diem_danh_gia", i)}>
                    <Star className={cn("h-7 w-7", (watch("diem_danh_gia") ?? 0) >= i ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="y_kien_khach">Ý kiến khách</Label>
              <Textarea id="y_kien_khach" rows={2} onChange={(e) => setValue("y_kien_khach", e.target.value)} />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Đang lưu…" : "Lưu nghiệm thu"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
