"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// Đăng xuất phía client (không dùng Server Action) — nút này nằm
// trên MỌI trang trong AppShell nên cần đường gọi đơn giản, ổn định.
export function NutDangXuat({ className }: { className?: string }) {
  const router = useRouter();
  const [dangXuLy, setDangXuLy] = useState(false);

  async function dangXuat() {
    setDangXuLy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" disabled={dangXuLy} onClick={dangXuat} className={className ?? "w-full justify-start gap-2 text-muted-foreground"}>
      <LogOut className="h-4 w-4" /> Đăng xuất
    </Button>
  );
}
