"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronsUpDown, X } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { UploadAnh } from "@/components/upload-anh";
import { formatVND } from "@/lib/format";
import type { PhatSinh, BangGiaDichVu, VatTu } from "@/types/database";

interface HangMucPhatSinhDangChon {
  ma: string;
  ten: string;
  gia: number;
}

export function TabPhatSinh({ maDon, danhSach, bangGiaDichVu }: { maDon: string; danhSach: PhatSinh[]; bangGiaDichVu: BangGiaDichVu[] }) {
  const router = useRouter();
  const [anh, setAnh] = useState<string[]>([]);
  const [dangXacNhan, setDangXacNhan] = useState<string | null>(null);
  const [openChon, setOpenChon] = useState(false);
  const [vatTuList, setVatTuList] = useState<VatTu[]>([]);
  const [dsDangChon, setDsDangChon] = useState<HangMucPhatSinhDangChon[]>([]);
  const [dangThemNhieu, setDangThemNhieu] = useState(false);
  const [loaiLoc, setLoaiLoc] = useState<"Dịch vụ" | "Vật tư">("Dịch vụ");
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("vat_tu")
      .select("*")
      .eq("dang_hoat_dong", true)
      .order("ten")
      .then(({ data }) => setVatTuList((data as VatTu[]) ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setDsDangChon([]);
  }, [loaiLoc]);

  const dsGoiY = loaiLoc === "Vật tư"
    ? vatTuList.map((v) => ({ ma: v.ma_vt, ten: v.ten, gia: v.gia_ban, giaGoiY: formatVND(v.gia_ban) }))
    : bangGiaDichVu.map((d) => ({ ma: d.ma_dv, ten: d.ten_dich_vu, gia: 0, giaGoiY: d.gia_tham_khao ?? "Chưa có giá tham khảo" }));

  function toggleChon(item: { ma: string; ten: string; gia: number }) {
    setDsDangChon((ds) => (ds.some((d) => d.ma === item.ma) ? ds.filter((d) => d.ma !== item.ma) : [...ds, { ma: item.ma, ten: item.ten, gia: item.gia }]));
  }

  function capNhatDongDangChon(ma: string, gia: number) {
    setDsDangChon((ds) => ds.map((d) => (d.ma === ma ? { ...d, gia } : d)));
  }

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

  async function themNhieuPhatSinh() {
    const nguyenNhan = watch("nguyen_nhan");
    if (!nguyenNhan || nguyenNhan.trim().length < 3) {
      toast.error("Vui lòng nhập nguyên nhân trước khi ghi nhận.");
      return;
    }
    setDangThemNhieu(true);
    const ketQuaList = await Promise.all(
      dsDangChon.map((d) =>
        saveOrQueue({
          bang: "phat_sinh",
          thao_tac: "insert",
          gia_tri: {
            ma_don: maDon,
            hang_muc: d.ten,
            nguyen_nhan: nguyenNhan,
            gia: d.gia,
            anh_phat_sinh: anh,
            truong_hop_khan_cap: watch("truong_hop_khan_cap") ?? false,
          },
          mo_ta: `Phát sinh đơn ${maDon}: ${d.ten}`,
        }),
      ),
    );
    setDangThemNhieu(false);
    const loi = ketQuaList.find((k) => k.error);
    if (loi) {
      toast.error(`Không ghi nhận được: ${loi.error}`);
      return;
    }
    toast.success(ketQuaList.some((k) => k.queued) ? "Đã lưu tạm — sẽ đồng bộ khi có mạng" : `Đã ghi nhận ${dsDangChon.length} phát sinh`);
    reset();
    setAnh([]);
    setDsDangChon([]);
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
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <p className="font-medium">Ghi nhận phát sinh mới</p>
            <div className="space-y-2">
              <Label htmlFor="nguyen_nhan">Nguyên nhân *</Label>
              <Textarea id="nguyen_nhan" rows={2} {...register("nguyen_nhan")} />
              {errors.nguyen_nhan ? <p className="text-sm text-destructive">{errors.nguyen_nhan.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Ảnh minh chứng</Label>
              <UploadAnh urls={anh} onChange={setAnh} thuMuc="phat-sinh" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={watch("truong_hop_khan_cap") ?? false} onCheckedChange={(v) => setValue("truong_hop_khan_cap", v === true)} />
              Trường hợp khẩn cấp an toàn (ngoại lệ nguyên tắc 2/3 — không cần chờ khách xác nhận trước khi làm)
            </label>
          </div>

          <div className="space-y-4 border-t pt-6">
            <p className="font-medium">Thêm từ danh sách có sẵn</p>
            <div className="space-y-2">
              <Label>Loại *</Label>
              <Select value={loaiLoc} onValueChange={(v) => setLoaiLoc(v as "Dịch vụ" | "Vật tư")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dịch vụ">Dịch vụ</SelectItem>
                  <SelectItem value="Vật tư">Vật tư</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tên hạng mục</Label>
              <Popover open={openChon} onOpenChange={setOpenChon}>
                <PopoverTrigger render={<Button type="button" variant="outline" className="w-full justify-between font-normal" />}>
                  {dsDangChon.length > 0 ? `Đã chọn ${dsDangChon.length} ${loaiLoc.toLowerCase()}` : `Chọn ${loaiLoc.toLowerCase()} (có thể chọn nhiều)`}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0">
                  <Command>
                    <CommandInput placeholder={`Tìm ${loaiLoc.toLowerCase()}…`} />
                    <CommandList>
                      <CommandEmpty>Không có {loaiLoc.toLowerCase()} nào.</CommandEmpty>
                      <CommandGroup>
                        {dsGoiY.map((item) => {
                          const daChon = dsDangChon.some((d) => d.ma === item.ma);
                          return (
                            <CommandItem key={item.ma} value={item.ten} data-checked={daChon} onSelect={() => toggleChon(item)}>
                              <div>
                                <p>{item.ten}</p>
                                <p className="text-xs text-muted-foreground">{item.giaGoiY}</p>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {dsDangChon.length > 0 ? (
              <div className="space-y-2 rounded-lg border p-3">
                {dsDangChon.map((d) => (
                  <div key={d.ma} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="flex-1 min-w-32 truncate">{d.ten}</span>
                    <Label htmlFor={`gia_${d.ma}`} className="text-muted-foreground">Chi phí:</Label>
                    <Input
                      id={`gia_${d.ma}`}
                      type="number"
                      min={0}
                      step={1000}
                      value={d.gia}
                      onChange={(e) => capNhatDongDangChon(d.ma, Number(e.target.value))}
                      className="w-32"
                    />
                    <Button size="icon-sm" variant="ghost" onClick={() => setDsDangChon((ds) => ds.filter((x) => x.ma !== d.ma))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" disabled={dangThemNhieu} className="w-full" onClick={themNhieuPhatSinh}>
                  {dangThemNhieu ? "Đang lưu…" : `Ghi nhận ${dsDangChon.length} phát sinh`}
                </Button>
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border-t pt-6">
            <p className="font-medium">Hoặc nhập hạng mục khác (tùy chỉnh)</p>
            <div className="space-y-2">
              <Label htmlFor="hang_muc">Tên hạng mục *</Label>
              <Input id="hang_muc" {...register("hang_muc")} />
              {errors.hang_muc ? <p className="text-sm text-destructive">{errors.hang_muc.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gia">Chi phí đề xuất *</Label>
              <Input id="gia" type="number" min={0} step={1000} {...register("gia", { valueAsNumber: true })} />
              {errors.gia ? <p className="text-sm text-destructive">{errors.gia.message}</p> : null}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Đang lưu…" : "Ghi nhận phát sinh"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
