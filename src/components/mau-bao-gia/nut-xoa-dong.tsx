"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function NutXoaDong({ maDong }: { maDong: string }) {
  const router = useRouter();

  async function xoa() {
    if (!confirm("Xóa hạng mục này khỏi mẫu báo giá?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("mau_bao_gia_dong").delete().eq("ma_dong", maDong);
    if (error) {
      toast.error(`Không xóa được: ${error.message}`);
      return;
    }
    router.refresh();
  }

  return (
    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={xoa} aria-label="Xóa hạng mục">
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
