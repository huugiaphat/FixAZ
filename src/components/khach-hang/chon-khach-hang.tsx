"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { KhachHang } from "@/types/database";

export function ChonKhachHang({
  value,
  onChange,
  tuKhoaGoiY,
}: {
  value?: string;
  onChange: (maKh: string, ten: string) => void;
  tuKhoaGoiY?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tuKhoa, setTuKhoa] = useState(tuKhoaGoiY ?? "");
  const [ketQua, setKetQua] = useState<KhachHang[]>([]);
  const [daChon, setDaChon] = useState<KhachHang | null>(null);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    const timer = setTimeout(async () => {
      let query = supabase.from("khach_hang").select("*").order("ngay_tao", { ascending: false }).limit(20);
      if (tuKhoa) query = query.or(`ho_ten.ilike.%${tuKhoa}%,sdt.ilike.%${tuKhoa}%,ma_kh.ilike.%${tuKhoa}%`);
      const { data } = await query;
      setKetQua((data as KhachHang[]) ?? []);
    }, 250);
    return () => clearTimeout(timer);
  }, [tuKhoa, open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" className="w-full justify-between font-normal" />}>
        {daChon ? `${daChon.ma_kh} — ${daChon.ho_ten} (${daChon.sdt})` : value ? value : "Tìm khách hàng theo tên/SĐT…"}
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput placeholder="Nhập tên hoặc số điện thoại…" value={tuKhoa} onValueChange={setTuKhoa} className="border-0" />
          </div>
          <CommandList>
            <CommandEmpty>Không tìm thấy khách hàng.</CommandEmpty>
            <CommandGroup>
              {ketQua.map((kh) => (
                <CommandItem
                  key={kh.ma_kh}
                  value={kh.ma_kh}
                  onSelect={() => {
                    setDaChon(kh);
                    onChange(kh.ma_kh, kh.ho_ten);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === kh.ma_kh ? "opacity-100" : "opacity-0")} />
                  <div>
                    <p className="font-medium">{kh.ho_ten} · {kh.sdt}</p>
                    <p className="text-xs text-muted-foreground">{kh.ma_kh} — {kh.dia_chi}</p>
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
