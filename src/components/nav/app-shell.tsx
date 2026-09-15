"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NhanVien } from "@/types/database";
import { dieuHuongTheoVaiTro, dieuHuongMobile, NHOM_DIEU_HUONG } from "@/lib/nav-config";
import { Button } from "@/components/ui/button";
import { Menu, ChevronRight, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/nav/notification-bell";
import { NutDangXuat } from "@/components/nav/nut-dang-xuat";

function laActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({ pathname, items, onNavigate }: {
  pathname: string;
  items: ReturnType<typeof dieuHuongTheoVaiTro>;
  onNavigate?: () => void;
}) {
  const [tim, setTim] = useState("");
  return <div className="space-y-5">
    <label className="flex items-center gap-2 rounded-lg border bg-background px-3 text-muted-foreground">
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <input aria-label="Tìm chức năng" value={tim} onChange={e => setTim(e.target.value)} placeholder="Tìm chức năng…" className="h-11 w-full min-w-0 bg-transparent text-sm text-foreground outline-none" />
    </label>
    <nav aria-label="Menu chính" className="space-y-5">
      {NHOM_DIEU_HUONG.map(nhom => {
        const muc = nhom.duongDan.flatMap(href => items.filter(m => m.href === href && m.nhan.toLocaleLowerCase("vi").includes(tim.toLocaleLowerCase("vi").trim())));
        if (!muc.length) return null;
        return <div key={nhom.nhan}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{nhom.nhan}</p>
          <div className="space-y-1">{muc.map(m => {
            const Icon = m.icon;
            const active = laActive(pathname, m.href);
            return <Link key={m.href} href={m.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-primary text-primary-foreground" : "text-foreground/75 hover:bg-muted hover:text-foreground")}>
              <Icon className="size-[18px] shrink-0" aria-hidden="true" /><span>{m.nhan}</span>{active && <ChevronRight className="ml-auto size-4" aria-hidden="true" />}
            </Link>;
          })}</div>
        </div>;
      })}
      {!items.some(m => m.nhan.toLocaleLowerCase("vi").includes(tim.toLocaleLowerCase("vi").trim())) && <p className="px-3 text-sm text-muted-foreground">Không tìm thấy chức năng.</p>}
    </nav>
  </div>;
}

function Brand() {
  return <Link href="/" className="flex items-center gap-3 py-2">
    <Image src="/logo.png" alt="" width={64} height={64} className="size-12 rounded-xl bg-white object-contain" priority />
    <div><p className="font-semibold tracking-tight">Hữu Gia Phát</p><p className="text-xs text-muted-foreground">Quản lý dịch vụ sửa chữa</p></div>
  </Link>;
}

export function AppShell({ nhanVien, children }: { nhanVien: NhanVien; children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuMo, setMenuMo] = useState(false);
  const items = dieuHuongTheoVaiTro(nhanVien.vai_tro_app);
  const mobile = dieuHuongMobile(nhanVien.vai_tro_app);
  const hienTai = items.find(m => laActive(pathname, m.href));
  const tenNgan: Record<string, string> = { "/": "Trang chủ", "/yeu-cau-dich-vu": "Yêu cầu", "/mau-bao-gia": "Báo giá", "/kho-vat-tu": "Kho vật tư", "/kpi": "KPI" };
  return <div className="app-shell flex min-h-dvh w-full bg-muted/35">
    <a href="#noi-dung" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:p-3 focus:text-primary-foreground">Đến nội dung chính</a>
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card lg:flex">
      <div className="border-b px-5 py-4"><Brand /></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4"><NavLinks pathname={pathname} items={items} /></div>
      <div className="space-y-3 border-t p-4"><div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{nhanVien.ho_ten.slice(0, 1)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{nhanVien.ho_ten}</p><p className="text-xs text-muted-foreground">{nhanVien.vai_tro_app}</p></div></div><NutDangXuat className="w-full justify-start" /></div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b bg-card px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Mở menu" onClick={() => setMenuMo(true)}><Menu /></Button>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{hienTai?.nhan ?? "Chi tiết công việc"}</p><p className="text-xs text-muted-foreground lg:hidden">Hữu Gia Phát</p></div>
          {hienTai && pathname !== hienTai.href && <span className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><ChevronRight className="size-4" />Chi tiết</span>}
        </div>
        <div className="flex shrink-0 items-center gap-4"><span className="hidden text-xs text-muted-foreground md:block">{nhanVien.vai_tro_app}</span><NotificationBell maNv={nhanVien.ma_nv} /></div>
      </header>
      <main id="noi-dung" tabIndex={-1} className="app-content mx-auto w-full max-w-[1480px] min-w-0 flex-1 p-4 pb-28 outline-none sm:p-6 sm:pb-28 lg:p-8 lg:pb-10">{children}</main>
      <nav aria-label="Truy cập nhanh" className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {mobile.map(m => { const Icon = m.icon; const active = laActive(pathname, m.href); return <Link key={m.href} href={m.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium", active ? "bg-primary/5 text-primary" : "text-muted-foreground")}><Icon className="size-5" aria-hidden="true" /><span>{tenNgan[m.href] ?? m.nhan}</span></Link>; })}
        <button onClick={() => setMenuMo(true)} className="flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground" aria-label="Mở tất cả chức năng"><Menu className="size-5" />Menu</button>
      </nav>
    </div>
    <Sheet open={menuMo} onOpenChange={setMenuMo}>
      <SheetContent side="left" className="w-[min(90vw,320px)] overflow-y-auto p-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <SheetTitle className="pr-7">Hữu Gia Phát</SheetTitle>
        <p className="text-xs text-muted-foreground">{nhanVien.ho_ten} · {nhanVien.vai_tro_app}</p>
        <NavLinks pathname={pathname} items={items} onNavigate={() => setMenuMo(false)} />
        <NutDangXuat className="mt-4 w-full justify-start" />
      </SheetContent>
    </Sheet>
  </div>;
}
