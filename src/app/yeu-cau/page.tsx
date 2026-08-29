"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { yeuCauDichVuSchema, DICH_VU_YEU_CAU, ICON_DICH_VU, type YeuCauDichVuFormValues } from "@/lib/schemas/yeu-cau-dich-vu";
import { guiYeuCauDichVu } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TrangYeuCauDichVu() {
  const [ketQua, setKetQua] = useState<{ maYc: string } | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<YeuCauDichVuFormValues>({
    resolver: zodResolver(yeuCauDichVuSchema),
    defaultValues: { dich_vu: "Điện" },
  });

  async function onSubmit(values: YeuCauDichVuFormValues) {
    const ketQuaGui = await guiYeuCauDichVu(values);
    if (!ketQuaGui.ok) {
      alert(ketQuaGui.loi ?? "Không gửi được yêu cầu, vui lòng thử lại.");
      return;
    }
    setKetQua({ maYc: ketQuaGui.maYc! });
  }

  if (ketQua) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-600" />
            <p className="text-lg font-semibold">Đã gửi yêu cầu thành công!</p>
            <p className="text-sm text-muted-foreground">
              Mã yêu cầu <span className="font-mono font-medium text-foreground">{ketQua.maYc}</span>. Đội ngũ Hữu Gia Phát sẽ liên hệ lại với bạn trong thời gian sớm nhất.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center gap-2">
          <Image src="/logo.png" alt="Hữu Gia Phát" width={500} height={500} className="h-24 w-24 object-contain" priority />
          <CardDescription>Kính chào quý khách! Chúng tôi chuyên sửa chữa nhà cửa, điện nước,. Mời quý khách lựa chọn dịch vụ phù hợp!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Honeypot chống spam — ẩn khỏi người dùng thật bằng CSS, bot vẫn thấy và điền */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
              {...register("website")}
            />

            <div className="space-y-2">
              <Label htmlFor="ho_ten">Họ tên *</Label>
              <Input id="ho_ten" autoComplete="name" {...register("ho_ten")} />
              {errors.ho_ten ? <p className="text-sm text-destructive">{errors.ho_ten.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dia_chi">Địa chỉ *</Label>
              <Input id="dia_chi" autoComplete="street-address" {...register("dia_chi")} />
              {errors.dia_chi ? <p className="text-sm text-destructive">{errors.dia_chi.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sdt">Số điện thoại/Zalo *</Label>
              <Input id="sdt" type="tel" inputMode="tel" autoComplete="tel" {...register("sdt")} />
              {errors.sdt ? <p className="text-sm text-destructive">{errors.sdt.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Loại dịch vụ *</Label>
              <Select value={watch("dich_vu")} onValueChange={(v) => setValue("dich_vu", v as YeuCauDichVuFormValues["dich_vu"])}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DICH_VU_YEU_CAU.map((dv) => {
                    const Icon = ICON_DICH_VU[dv];
                    return (
                      <SelectItem key={dv} value={dv}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {dv}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="yeu_cau">Mô tả yêu cầu *</Label>
              <Textarea id="yeu_cau" rows={3} placeholder="VD: Ổ cắm điện phòng khách bị chập, có mùi khét" {...register("yeu_cau")} />
              {errors.yeu_cau ? <p className="text-sm text-destructive">{errors.yeu_cau.message}</p> : null}
            </div>
            <Button type="submit" className="w-full h-11 text-base" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi…" : "Yêu cầu thực hiện"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
