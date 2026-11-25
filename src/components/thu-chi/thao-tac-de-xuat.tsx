"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ThaoTacDeXuat({ maDx, laAdmin, nguoiLap }: {
  maDx: string; laAdmin: boolean; nguoiLap: boolean;
}) {
  const [dangXuLy, setDangXuLy] = useState(false);
  const router = useRouter();
  async function xuLy(loai: "duyet" | "tu-choi" | "rut") {
    if (loai !== "duyet" && !confirm(loai === "rut"
      ? `Rút đề xuất ${maDx}? Phiếu vẫn được lưu để tra cứu.`
      : `Từ chối đề xuất ${maDx}? Phiếu vẫn được lưu để tra cứu.`)) return;
    setDangXuLy(true);
    const supabase = createClient();
    const { error } = loai === "rut"
      ? await supabase.rpc("f_rut_de_xuat_thanh_toan", { p_ma_dx: maDx })
      : await supabase.rpc("f_duyet_de_xuat_thanh_toan", { p_ma_dx: maDx, p_duyet: loai === "duyet" });
    setDangXuLy(false);
    if (error) { toast.error(`Không xử lý được đề xuất: ${error.message}`); return; }
    toast.success(loai === "duyet" ? "Đã duyệt và ghi khoản chi vào Sổ thu chi"
      : loai === "rut" ? "Đã rút đề xuất" : "Đã từ chối đề xuất");
    router.refresh();
  }
  return <div className="flex flex-wrap gap-2">
    {laAdmin && <>
      <Button size="sm" disabled={dangXuLy} onClick={() => xuLy("duyet")}>Duyệt chi</Button>
      <Button size="sm" variant="outline" disabled={dangXuLy} onClick={() => xuLy("tu-choi")}>Không duyệt</Button>
    </>}
    {nguoiLap && <Button size="sm" variant="outline" disabled={dangXuLy} onClick={() => xuLy("rut")}>Rút đề xuất</Button>}
  </div>;
}
