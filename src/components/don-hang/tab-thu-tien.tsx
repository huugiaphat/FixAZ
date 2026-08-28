"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { thuTienSchema, PHUONG_THUC_THU, type ThuTienFormValues, type ThuTienFormInput } from "@/lib/schemas/thu-tien";
import { createClient } from "@/lib/supabase/client";
import { saveOrQueue } from "@/lib/offline/queue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatVND, formatDateTime } from "@/lib/format";
import type { ThuTien, VaiTro } from "@/types/database";

export function TabThuTien({
  maDon,
  danhSach,
  congNo,
  vaiTro,
}: {
  maDon: string;
  danhSach: ThuTien[];
  congNo: number;
  vaiTro: VaiTro;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [dangXuLy, setDangXuLy] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ThuTienFormInput, unknown, ThuTienFormValues>({
    resolver: zodResolver(thuTienSchema),
    defaultValues: { phuong_thuc: "Tiền mặt" },
  });

  const duocThu = ["Quản lý", "Kế toán", "Thợ"].includes(vaiTro);
  const duocDoiSoat = ["Quản lý", "Kế toán"].includes(vaiTro);

  async function onSubmit(values: ThuTienFormValues) {
    const ketQua = await saveOrQueue({
      bang: "thu_tien",
      thao_tac: "insert",
      gia_tri: {
        ma_don: maDon,
        so_tien: values.so_tien,
        phuong_thuc: values.phuong_thuc,
        ma_giao_dich: values.ma_giao_dich || null,
      },
      mo_ta: `Thu tiền đơn ${maDon}: ${values.so_tien.toLocaleString("vi-VN")} đ`,
    });
    if (ketQua.error) {
      toast.error(`Không ghi nhận được khoản thu: ${ketQua.error}`);
      return;
    }
    toast.success(ketQua.queued ? "Đã lưu tạm — sẽ đồng bộ khi có mạng" : "Đã ghi nhận khoản thu");
    reset();
    router.refresh();
  }

  async function danhDauDaNop(maThu: string) {
    setDangXuLy(maThu);
    const { error } = await supabase.from("thu_tien").update({ da_nop_ve_cong_ty: true }).eq("ma_thu", maThu);
    setDangXuLy(null);
    if (error) toast.error(error.message);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">Công nợ hiện tại</p>
          <p className={congNo > 0 ? "text-xl font-semibold text-destructive" : "text-xl font-semibold text-emerald-600"}>
            {formatVND(congNo)}
          </p>
        </CardContent>
      </Card>

      {danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có khoản thu nào.</p>
      ) : (
        <div className="space-y-2">
          {danhSach.map((t) => (
            <Card key={t.ma_thu}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4">
                <div>
                  <p className="font-medium">{formatVND(t.so_tien)} — {t.phuong_thuc}</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(t.ngay_thu)} {t.ma_giao_dich ? `· ${t.ma_giao_dich}` : ""}</p>
                </div>
                {t.phuong_thuc === "Tiền mặt" ? (
                  t.da_nop_ve_cong_ty ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Đã nộp về công ty</Badge>
                  ) : duocDoiSoat ? (
                    <Button size="sm" variant="outline" disabled={dangXuLy === t.ma_thu} onClick={() => danhDauDaNop(t.ma_thu)}>
                      Đánh dấu đã nộp
                    </Button>
                  ) : (
                    <Badge variant="secondary">Chưa nộp về công ty</Badge>
                  )
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {duocThu ? (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 font-medium">Ghi nhận khoản thu</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="so_tien">Số tiền *</Label>
                <Input id="so_tien" type="number" min={0} step={1000} {...register("so_tien", { valueAsNumber: true })} />
                {errors.so_tien ? <p className="text-sm text-destructive">{errors.so_tien.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label>Hình thức *</Label>
                <Select value={watch("phuong_thuc")} onValueChange={(v) => setValue("phuong_thuc", v as ThuTienFormValues["phuong_thuc"])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHUONG_THUC_THU.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {watch("phuong_thuc") !== "Tiền mặt" ? (
                <div className="space-y-2">
                  <Label htmlFor="ma_giao_dich">Mã giao dịch *</Label>
                  <Input id="ma_giao_dich" {...register("ma_giao_dich")} />
                  {errors.ma_giao_dich ? <p className="text-sm text-destructive">{errors.ma_giao_dich.message}</p> : null}
                </div>
              ) : null}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Đang lưu…" : "Ghi nhận khoản thu"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
