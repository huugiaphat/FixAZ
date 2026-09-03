"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function BoLocThuChi({ tu, den, loai }: { tu?: string; den?: string; loai?: string }) {
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
      <Button type="submit" variant="outline">Lọc</Button>
    </form>
  );
}
