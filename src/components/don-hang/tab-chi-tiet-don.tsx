"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, ChevronsUpDown, X } from "lucide-react";
import { chiTietDonSchema, type ChiTietDonFormValues, type ChiTietDonFormInput } from "@/lib/schemas/chi-tiet-don";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { formatVND } from "@/lib/format";
import type { ChiTietDonTinhToan, BangGiaDichVu, VaiTro, VatTu } from "@/types/database";

interface HangMucDangChon {
  ma: string;
  ten: string;
  don_vi_tinh: string;
  so_luong: number;
  gia_ban: number;
}

export function TabChiTietDon({
  maDon,
  danhSach,
  bangGiaDichVu,
  vaiTro,
  laThoPhuTrach,
}: {
  maDon: string;
  danhSach: ChiTietDonTinhToan[];
  bangGiaDichVu: BangGiaDichVu[];
  vaiTro: VaiTro;
  /** Thợ đang được điều phối/phụ trách đơn này — cho phép tự thêm hạng mục */
  laThoPhuTrach?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [dangXoa, setDangXoa] = useState<string | null>(null);
  const [openChon, setOpenChon] = useState(false);
  const [vatTuList, setVatTuList] = useState<VatTu[]>([]);
  const [dsDangChon, setDsDangChon] = useState<HangMucDangChon[]>([]);
  const [dangThemNhieu, setDangThemNhieu] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChiTietDonFormInput, unknown, ChiTietDonFormValues>({
    resolver: zodResolver(chiTietDonSchema),
    defaultValues: { loai: "Dịch vụ", so_luong: 1, gia_ban: 0 },
  });

  const duocXoa = ["Quản lý", "CSKH-Điều phối"].includes(vaiTro);
  const duocTao = duocXoa || (vaiTro === "Thợ" && laThoPhuTrach);
  const tongCong = danhSach.reduce((s, c) => s + c.thanh_tien, 0);
  const loaiDangChon = watch("loai");

  useEffect(() => {
    if (loaiDangChon !== "Vật tư" || vatTuList.length > 0) return;
    supabase
      .from("vat_tu")
      .select("*")
      .eq("dang_hoat_dong", true)
      .order("ten")
      .then(({ data }) => setVatTuList((data as VatTu[]) ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaiDangChon]);

  useEffect(() => {
    setDsDangChon([]);
  }, [loaiDangChon]);

  const dsGoiY = loaiDangChon === "Vật tư"
    ? vatTuList.map((v) => ({ ma: v.ma_vt, ten: v.ten, don_vi_tinh: v.don_vi_tinh, gia_ban: v.gia_ban, giaGoiY: formatVND(v.gia_ban) }))
    : bangGiaDichVu.map((d) => ({ ma: d.ma_dv, ten: d.ten_dich_vu, don_vi_tinh: d.don_vi_tinh, gia_ban: 0, giaGoiY: d.gia_tham_khao ?? "Chưa có giá tham khảo" }));

  function toggleChon(item: { ma: string; ten: string; don_vi_tinh: string; gia_ban: number }) {
    setDsDangChon((ds) =>
      ds.some((d) => d.ma === item.ma)
        ? ds.filter((d) => d.ma !== item.ma)
        : [...ds, { ...item, so_luong: 1 }],
    );
  }

  function capNhatDongDangChon(ma: string, patch: Partial<HangMucDangChon>) {
    setDsDangChon((ds) => ds.map((d) => (d.ma === ma ? { ...d, ...patch } : d)));
  }

  async function themNhieuHangMuc() {
    if (dsDangChon.length === 0) return;
    setDangThemNhieu(true);
    const { error } = await supabase.from("chi_tiet_don").insert(
      dsDangChon.map((d) => ({
        ma_don: maDon,
        loai: loaiDangChon,
        ten_hang_muc: d.ten,
        don_vi_tinh: d.don_vi_tinh,
        so_luong: d.so_luong,
        gia_ban: d.gia_ban,
        ma_dv_vt: d.ma,
      })),
    );
    setDangThemNhieu(false);
    if (error) {
      toast.error(`Không thêm được: ${error.message}`);
      return;
    }
    toast.success(`Đã thêm ${dsDangChon.length} hạng mục`);
    setDsDangChon([]);
    router.refresh();
  }

  async function onSubmit(values: ChiTietDonFormValues) {
    const { error } = await supabase.from("chi_tiet_don").insert({ ma_don: maDon, ...values });
    if (error) {
      toast.error(`Không thêm được hạng mục: ${error.message}`);
      return;
    }
    toast.success("Đã thêm hạng mục");
    reset({ loai: "Dịch vụ", so_luong: 1, gia_ban: 0 });
    router.refresh();
  }

  async function xoa(maDong: string) {
    setDangXoa(maDong);
    const { error } = await supabase.from("chi_tiet_don").delete().eq("ma_dong", maDong);
    setDangXoa(null);
    if (error) toast.error(error.message);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      {danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có hạng mục nào được chốt.</p>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hạng mục</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>SL</TableHead>
                  <TableHead>Đơn giá</TableHead>
                  <TableHead>Thành tiền</TableHead>
                  {duocXoa ? <TableHead /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSach.map((c) => (
                  <TableRow key={c.ma_dong}>
                    <TableCell className="font-medium">{c.ten_hang_muc}</TableCell>
                    <TableCell className="text-muted-foreground">{c.loai}</TableCell>
                    <TableCell>{c.so_luong} {c.don_vi_tinh}</TableCell>
                    <TableCell>{formatVND(c.gia_ban)}</TableCell>
                    <TableCell className="font-medium">{formatVND(c.thanh_tien)}</TableCell>
                    {duocXoa ? (
                      <TableCell>
                        <Button size="icon-sm" variant="ghost" disabled={dangXoa === c.ma_dong} onClick={() => xoa(c.ma_dong)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">Tổng cộng</TableCell>
                  <TableCell className="font-semibold">{formatVND(tongCong)}</TableCell>
                  {duocXoa ? <TableCell /> : null}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {duocTao ? (
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <p className="font-medium">Thêm từ danh sách có sẵn</p>
              <div className="space-y-2">
                <Label>Loại *</Label>
                <Select value={watch("loai")} onValueChange={(v) => setValue("loai", v as ChiTietDonFormValues["loai"])}>
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
                  <PopoverTrigger render={<Button variant="outline" className="w-full justify-between font-normal" />}>
                    {dsDangChon.length > 0 ? `Đã chọn ${dsDangChon.length} ${loaiDangChon.toLowerCase()}` : `Chọn ${loaiDangChon.toLowerCase()} (có thể chọn nhiều)`}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0">
                    <Command>
                      <CommandInput placeholder={`Tìm ${loaiDangChon.toLowerCase()}…`} />
                      <CommandList>
                        <CommandEmpty>Không có {loaiDangChon.toLowerCase()} nào.</CommandEmpty>
                        <CommandGroup>
                          {dsGoiY.map((item) => {
                            const daChon = dsDangChon.some((d) => d.ma === item.ma);
                            return (
                              <CommandItem key={item.ma} value={item.ten} data-checked={daChon} onSelect={() => toggleChon(item)}>
                                <div>
                                  <p>{item.ten}</p>
                                  <p className="text-xs text-muted-foreground">{item.don_vi_tinh} · {item.giaGoiY}</p>
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
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={d.so_luong}
                        onChange={(e) => capNhatDongDangChon(d.ma, { so_luong: Number(e.target.value) })}
                        className="w-20"
                      />
                      <span className="text-muted-foreground">{d.don_vi_tinh}</span>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        value={d.gia_ban}
                        onChange={(e) => capNhatDongDangChon(d.ma, { gia_ban: Number(e.target.value) })}
                        className="w-28"
                      />
                      <Button size="icon-sm" variant="ghost" onClick={() => setDsDangChon((ds) => ds.filter((x) => x.ma !== d.ma))}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button className="w-full" disabled={dangThemNhieu} onClick={themNhieuHangMuc}>
                    {dangThemNhieu ? "Đang thêm…" : `Thêm ${dsDangChon.length} hạng mục`}
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="border-t pt-6">
            <p className="mb-3 font-medium">Hoặc nhập hạng mục khác (tùy chỉnh)</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ten_hang_muc">Tên hạng mục *</Label>
                <Input id="ten_hang_muc" {...register("ten_hang_muc")} />
                {errors.ten_hang_muc ? <p className="text-sm text-destructive">{errors.ten_hang_muc.message}</p> : null}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="so_luong">Số lượng *</Label>
                  <Input id="so_luong" type="number" min={0} step="any" {...register("so_luong", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="don_vi_tinh">ĐVT</Label>
                  <Input id="don_vi_tinh" {...register("don_vi_tinh")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gia_ban">Giá bán *</Label>
                  <Input id="gia_ban" type="number" min={0} step={1000} {...register("gia_ban", { valueAsNumber: true })} />
                  {errors.gia_ban ? <p className="text-sm text-destructive">{errors.gia_ban.message}</p> : null}
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Đang lưu…" : "Thêm hạng mục"}
              </Button>
            </form>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
