import { requireNhanVien } from "@/lib/auth";
import { AppShell } from "@/components/nav/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const nhanVien = await requireNhanVien();
  return <AppShell nhanVien={nhanVien}>{children}</AppShell>;
}
