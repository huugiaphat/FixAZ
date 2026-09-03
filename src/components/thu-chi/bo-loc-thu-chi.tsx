"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectLabel, SelectGroup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { NOI_DUNG_THU, NOI_DUNG_CHI } from "@/lib/schemas/thu-chi";

export function BoLocThuChi({
  tu,
  den,
  loai,
  tenCongTrinh,
  noiDung,
}: {
  tu?: string;
  den?: string;
  loai?: string;
  tenCongTrinh?: string;
  noiDung?: string;
}) {
  return (
    <form className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="tu">Từ ngày</Label>
        <Input id="tu" name="tu" type="date" defaultValue={tu} className="w-40" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="den">Đến ngày</Label>
        <Input id="den" name="den" type="date" defaultValue={den} className="w-40" />
      </div>
      <div className="space-y-1.5">
        <Label>Loại</Label>
        <Select name="loai" defaultValue={loai ?? "tat-ca"}>
          <SelectTrigger className="w-36">
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
          className="w-52"
          autoComplete="off"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Nội dung</Label>
        <Select name="noi_dung" defaultValue={noiDung ?? "tat-ca"}>
          <SelectTrigger className="w-44">
            <SelectValue>{(v: string) => ([...NOI_DUNG_THU, ...NOI_DUNG_CHI] as string[]).includes(v) ? v : "Tất cả"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tat-ca">Tất cả</SelectItem>
            <SelectGroup>
              <SelectLabel>Nội dung thu</SelectLabel>
              {NOI_DUNG_THU.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Nội dung chi</SelectLabel>
              {NOI_DUNG_CHI.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" variant="outline">Lọc</Button>
    </form>
  );
}
