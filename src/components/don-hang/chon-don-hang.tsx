"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { DonHang } from "@/types/database";

export function ChonDonHang({
  value,
  onChange,
  chiTrangThai,
  placeholder,
}: {
  value?: string;
  onChange: (maDon: string) => void;
  chiTrangThai?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tuKhoa, setTuKhoa] = useState("");
  const [ketQua, setKetQua] = useState<DonHang[]>([]);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    const timer = setTimeout(async () => {
      let query = supabase.from("don_hang").select("*").order("ngay_tiep_nhan", { ascending: false }).limit(20);
      if (chiTrangThai) query = query.eq("trang_thai", chiTrangThai);
      if (tuKhoa) query = query.or(`ma_don.ilike.%${tuKhoa}%,mo_ta_su_co.ilike.%${tuKhoa}%`);
      const { data } = await query;
      setKetQua((data as DonHang[]) ?? []);
    }, 250);
    return () => clearTimeout(timer);
  }, [tuKhoa, open, chiTrangThai]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" className="w-full justify-between font-normal" />}>
        {value || placeholder || "Tìm đơn theo mã/mô tả…"}
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput placeholder="Nhập mã đơn hoặc mô tả sự cố…" value={tuKhoa} onValueChange={setTuKhoa} className="border-0" />
          </div>
          <CommandList>
            <CommandEmpty>Không tìm thấy đơn phù hợp.</CommandEmpty>
            <CommandGroup>
              {ketQua.map((d) => (
                <CommandItem key={d.ma_don} value={d.ma_don} onSelect={() => { onChange(d.ma_don); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === d.ma_don ? "opacity-100" : "opacity-0")} />
                  <div>
                    <p className="font-medium">{d.ma_don}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{d.mo_ta_su_co}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
