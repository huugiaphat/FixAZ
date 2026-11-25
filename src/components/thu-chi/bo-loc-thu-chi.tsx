"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectLabel, SelectGroup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { NOI_DUNG_THU, NOI_DUNG_CHI } from "@/lib/schemas/thu-chi";
import Link from "next/link";

export function BoLocThuChi({
  thang,
  tu,
  den,
  loai,
  tenCongTrinh,
  noiDung,
  trangThai,
}: {
  thang: string;
  tu?: string;
  den?: string;
  loai?: string;
  tenCongTrinh?: string;
  noiDung?: string;
  trangThai?: string;
}) {
  return (
    <form className="grid grid-cols-1 items-end gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-1.5">
        <Label htmlFor="thang">Tháng</Label>
        <Input id="thang" name="thang" type="month" defaultValue={thang} className="w-full" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tu">Từ ngày</Label>
        <Input id="tu" name="tu" type="date" defaultValue={tu} className="w-full" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="den">Đến ngày</Label>
        <Input id="den" name="den" type="date" defaultValue={den} className="w-full" />
      </div>
      <div className="space-y-1.5">
        <Label>Loại</Label>
        <Select name="loai" defaultValue={loai ?? "tat-ca"}>
          <SelectTrigger className="w-full">
            <SelectValue>{(v: string) => (v === "Thu" || v === "Chi" ? v : "Tất cả")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tat-ca">Tất cả</SelectItem>
            <SelectItem value="Thu">Thu</SelectItem>
            <SelectItem value="Chi">Chi</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ten_cong_trinh">Tên công trình</Label>
        <Input
          id="ten_cong_trinh"
          name="ten_cong_trinh"
          defaultValue={tenCongTrinh}
          placeholder="Tìm theo tên công trình…"
          className="w-full"
          autoComplete="off"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Danh mục</Label>
        <Select name="noi_dung" defaultValue={noiDung ?? "tat-ca"}>
          <SelectTrigger className="w-full">
            <SelectValue>{(v: string) => ([...NOI_DUNG_THU, ...NOI_DUNG_CHI] as string[]).includes(v) ? v : "Tất cả"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tat-ca">Tất cả</SelectItem>
            <SelectGroup>
              <SelectLabel>Danh mục thu</SelectLabel>
              {NOI_DUNG_THU.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Danh mục chi</SelectLabel>
              {NOI_DUNG_CHI.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Trạng thái</Label>
        <Select name="trang_thai" defaultValue={trangThai ?? "tat-ca"}>
          <SelectTrigger className="w-full">
            <SelectValue>{(v: string) => ({ "cho-duyet": "Chờ duyệt", "da-duyet": "Đã duyệt", "tu-dong-bo": "Tự đồng bộ" } as Record<string, string>)[v] ?? "Tất cả"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tat-ca">Tất cả</SelectItem>
            <SelectItem value="cho-duyet">Chờ duyệt</SelectItem>
            <SelectItem value="da-duyet">Đã duyệt</SelectItem>
            <SelectItem value="tu-dong-bo">Tự đồng bộ</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="outline">Lọc</Button>
        <Link href={`/thu-chi?thang=${thang}`} className="text-sm text-muted-foreground underline-offset-4 hover:underline">Xóa lọc</Link>
      </div>
    </form>
  );
}
