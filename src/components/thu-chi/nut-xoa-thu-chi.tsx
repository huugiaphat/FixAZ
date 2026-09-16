"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function NutXoaThuChi({ maTc }: { maTc: string }) {
  const [dangXoa, setDangXoa] = useState(false);
  const router = useRouter();

  async function xoa() {
    if (!confirm(`Xóa vĩnh viễn phiếu ${maTc}? Không thể khôi phục.`)) return;
    setDangXoa(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("thu_chi").delete().eq("ma_tc", maTc).select("ma_tc");
    setDangXoa(false);
    if (error) {
      toast.error(`Không xóa được: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      toast.error("Không xóa được: không có quyền xóa phiếu này (kiểm tra lại phân quyền Admin trên Sổ thu chi).");
      return;
    }
    toast.success(`Đã xóa phiếu ${maTc}`);
    router.refresh();
  }

  return (
    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={dangXoa} onClick={xoa} aria-label="Xóa phiếu thu chi">
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
