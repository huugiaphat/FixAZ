"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function NutDuyetThuChi({ maTc, daDuyet }: { maTc: string; daDuyet: boolean }) {
  const [dangXuLy, setDangXuLy] = useState(false);
  const router = useRouter();

  async function xuLy(duyet: boolean) {
    if (!duyet) {
      const cauHoi = daDuyet
        ? `Xóa vĩnh viễn phiếu đã duyệt ${maTc}? Không thể khôi phục.`
        : `Không duyệt và xóa vĩnh viễn phiếu ${maTc}? Không thể khôi phục.`;
      if (!confirm(cauHoi)) return;
    }
    setDangXuLy(true);
    const supabase = createClient();
    const { data, error } = duyet
      ? await supabase.from("thu_chi").update({ da_duyet: true }).eq("ma_tc", maTc).eq("da_duyet", false).select("ma_tc")
      : await supabase.from("thu_chi").delete().eq("ma_tc", maTc).eq("da_duyet", daDuyet).select("ma_tc");
    setDangXuLy(false);
    if (error) {
      toast.error(`Không ${duyet ? "duyệt" : "xóa"} được: ${error.message}`);
      return;
    }
    if (!data?.length) {
      toast.error("Phiếu đã thay đổi hoặc bạn không có quyền thao tác. Vui lòng tải lại trang.");
      router.refresh();
      return;
    }
    toast.success(duyet ? `Đã duyệt phiếu ${maTc}` : `Đã xóa phiếu ${maTc}`);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      {!daDuyet ? <Button variant="outline" size="sm" className="gap-1 text-emerald-700" disabled={dangXuLy} onClick={() => xuLy(true)} aria-label={`Duyệt phiếu ${maTc}`}>
        <Check className="h-4 w-4" /> Duyệt
      </Button> : null}
      <Button variant="outline" size="sm" className="gap-1 text-destructive" disabled={dangXuLy} onClick={() => xuLy(false)} aria-label={daDuyet ? `Xóa phiếu đã duyệt ${maTc}` : `Không duyệt và xóa phiếu ${maTc}`}>
        <X className="h-4 w-4" /> {daDuyet ? "Xóa" : "Không duyệt"}
      </Button>
    </div>
  );
}
