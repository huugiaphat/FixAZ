"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NhanVien } from "@/types/database";
import { dieuHuongTheoVaiTro } from "@/lib/nav-config";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/nav/notification-bell";
import { NutDangXuat } from "@/components/nav/nut-dang-xuat";

function laActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({
  pathname,
  items,
  onNavigate,
}: {
  pathname: string;
  items: ReturnType<typeof dieuHuongTheoVaiTro>;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((m) => {
        const Icon = m.icon;
        const active = laActive(pathname, m.href);
        return (
          <Link
            key={m.href}
            href={m.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {m.nhan}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ nhanVien, children }: { nhanVien: NhanVien; children: React.ReactNode }) {
  const pathname = usePathname();
  const items = dieuHuongTheoVaiTro(nhanVien.vai_tro_app);
  const mucMobile = items.filter((m) => m.uuTienMobile).slice(0, 5);

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-muted/20 md:p-4">
        <div className="flex items-center gap-2 px-2 pb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange text-brand-orange-foreground text-sm font-bold">
            HGP
          </div>
          <span className="font-semibold">Hữu Gia Phát</span>
        </div>
        <NavLinks pathname={pathname} items={items} />
        <div className="mt-auto space-y-2 pt-4 border-t">
          <div className="px-2 text-sm">
            <p className="font-medium">{nhanVien.ho_ten}</p>
            <p className="text-muted-foreground">{nhanVien.vai_tro_app}</p>
          </div>
          <NutDangXuat />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Header mobile + desktop */}
        <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Mở menu" />}>
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                <SheetTitle className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange text-brand-orange-foreground text-xs font-bold">
                    HGP
                  </div>
                  Hữu Gia Phát
                </SheetTitle>
                <NavLinks pathname={pathname} items={items} />
                <div className="mt-6 border-t pt-4">
                  <p className="px-2 text-sm font-medium">{nhanVien.ho_ten}</p>
                  <p className="px-2 text-sm text-muted-foreground">{nhanVien.vai_tro_app}</p>
                  <NutDangXuat className="mt-2 w-full justify-start gap-2 text-muted-foreground" />
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-semibold">Xin chào, {nhanVien.ho_ten.split(" ").pop()}</span>
          </div>
          <span className="hidden md:block text-sm text-muted-foreground">
            Xin chào, <span className="font-medium text-foreground">{nhanVien.ho_ten}</span> — {nhanVien.vai_tro_app}
          </span>
          <NotificationBell maNv={nhanVien.ma_nv} />
        </header>

        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>

        {/* Bottom nav mobile — mobile-first cho Thợ/Điều phối (Mục 9) */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background md:hidden">
          {mucMobile.map((m) => {
            const Icon = m.icon;
            const active = laActive(pathname, m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-6 w-6" />
                {m.nhan}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
