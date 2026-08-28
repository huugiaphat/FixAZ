"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { ThongBao } from "@/types/database";
import { formatRelativeTime } from "@/lib/format";
import Link from "next/link";

export function NotificationBell({ maNv }: { maNv: string }) {
  const [danhSach, setDanhSach] = useState<ThongBao[]>([]);
  const supabase = createClient();

  const taiLai = useCallback(async () => {
    const { data } = await supabase
      .from("thong_bao")
      .select("*")
      .eq("nguoi_nhan", maNv)
      .order("created_at", { ascending: false })
      .limit(20);
    setDanhSach((data as ThongBao[]) ?? []);
  }, [maNv, supabase]);

  useEffect(() => {
    // Tải danh sách ban đầu khi mount — setDanhSach chỉ chạy sau await
    // (bất đồng bộ), không gây render đồng bộ như rule dưới đây cảnh báo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void taiLai();
    const channel = supabase
      .channel(`thong_bao_${maNv}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "thong_bao", filter: `nguoi_nhan=eq.${maNv}` }, () => {
        void taiLai();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [maNv, supabase, taiLai]);

  const soChuaDoc = danhSach.filter((t) => !t.da_doc).length;

  async function danhDauDaDoc(id: string) {
    await supabase.from("thong_bao").update({ da_doc: true }).eq("id", id);
    setDanhSach((cur) => cur.map((t) => (t.id === id ? { ...t, da_doc: true } : t)));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" aria-label="Thông báo" />}>
        <Bell className="h-5 w-5" />
        {soChuaDoc > 0 ? (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
            {soChuaDoc > 9 ? "9+" : soChuaDoc}
          </Badge>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        {danhSach.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">Chưa có thông báo</p>
        ) : (
          danhSach.map((t) => (
            <Link
              key={t.id}
              href={t.ma_don ? `/don-hang/${t.ma_don}` : t.ma_vt ? "/kho-vat-tu" : "#"}
              onClick={() => !t.da_doc && danhDauDaDoc(t.id)}
              className={`block border-b px-3 py-2.5 text-sm last:border-0 hover:bg-muted ${!t.da_doc ? "bg-primary/5" : ""}`}
            >
              <p className="font-medium leading-snug">{t.tieu_de}</p>
              {t.noi_dung ? <p className="text-muted-foreground line-clamp-2">{t.noi_dung}</p> : null}
              <p className="mt-0.5 text-xs text-muted-foreground">{formatRelativeTime(t.created_at)}</p>
            </Link>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
