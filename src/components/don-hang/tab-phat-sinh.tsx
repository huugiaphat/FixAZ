"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { phatSinhSchema, type PhatSinhFormValues, type PhatSinhFormInput } from "@/lib/schemas/phat-sinh";
import { createClient } from "@/lib/supabase/client";
import { saveOrQueue } from "@/lib/offline/queue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadAnh } from "@/components/upload-anh";
import { formatVND } from "@/lib/format";
import type { PhatSinh } from "@/types/database";

export function TabPhatSinh({ maDon, danhSach }: { maDon: string; danhSach: PhatSinh[] }) {
  const router = useRouter();
  const [anh, setAnh] = useState<string[]>([]);
  const [dangXacNhan, setDangXacNhan] = useState<string | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PhatSinhFormInput, unknown, PhatSinhFormValues>({
    resolver: zodResolver(phatSinhSchema),
    defaultValues: { truong_hop_khan_cap: false },
  });

  async function onSubmit(values: PhatSinhFormValues) {
    const ketQua = await saveOrQueue({
      bang: "phat_sinh",
      thao_tac: "insert",
      gia_tri: { ma_don: maDon, ...values, anh_phat_sinh: anh },
      mo_ta: `Phát sinh đơn ${maDon}: ${values.hang_muc}`,
    });
    if (ketQua.error) {
      toast.error(`Không ghi nhận được phát sinh: ${ketQua.error}`);
      return;
    }
    toast.success(ketQua.queued ? "Đã lưu tạm — sẽ đồng bộ khi có mạng" : "Đã ghi nhận phát sinh");
    reset();
    setAnh([]);
    router.refresh();
  }

  async function xacNhanKhach(maPs: string) {
    setDangXacNhan(maPs);
    const { error } = await supabase
      .from("phat_sinh")
      .update({ khach_xac_nhan: true, ngay_xac_nhan: new Date().toISOString() })
      .eq("ma_ps", maPs);
    setDangXacNhan(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Đã ghi nhận khách xác nhận phát sinh");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có phát sinh nào.</p>
      ) : (
        <div className="space-y-2">
          {danhSach.map((ps) => (
            <Card key={ps.ma_ps}>
              <CardContent className="space-y-1.5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{ps.hang_muc} — {formatVND(ps.gia)}</p>
                  <div className="flex gap-1.5">
                    {ps.truong_hop_khan_cap ? <Badge variant="destructive">Khẩn cấp an toàn</Badge> : null}
                    {ps.khach_xac_nhan ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Đã xác nhận</Badge>
                    ) : (
                      <Badge variant="secondary">Chờ xác nhận</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{ps.nguyen_nhan}</p>
                {!ps.khach_xac_nhan ? (
                  <Button size="sm" className="mt-1" disabled={dangXacNhan === ps.ma_ps} onClick={() => xacNhanKhach(ps.ma_ps)}>
                    Ghi nhận khách đã đồng ý
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <p className="mb-3 font-medium">Ghi nhận phát sinh mới</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hang_muc">Hạng mục phát sinh *</Label>
              <Input id="hang_muc" {...register("hang_muc")} />
              {errors.hang_muc ? <p className="text-sm text-destructive">{errors.hang_muc.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nguyen_nhan">Nguyên nhân *</Label>
              <Textarea id="nguyen_nhan" rows={2} {...register("nguyen_nhan")} />
              {errors.nguyen_nhan ? <p className="text-sm text-destructive">{errors.nguyen_nhan.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gia">Chi phí đề xuất *</Label>
              <Input id="gia" type="number" min={0} step={1000} {...register("gia", { valueAsNumber: true })} />
              {errors.gia ? <p className="text-sm text-destructive">{errors.gia.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Ảnh minh chứng</Label>
              <UploadAnh urls={anh} onChange={setAnh} thuMuc="phat-sinh" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={watch("truong_hop_khan_cap") ?? false} onCheckedChange={(v) => setValue("truong_hop_khan_cap", v === true)} />
              Trường hợp khẩn cấp an toàn (ngoại lệ nguyên tắc 2/3 — không cần chờ khách xác nhận trước khi làm)
            </label>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Đang lưu…" : "Ghi nhận phát sinh"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
