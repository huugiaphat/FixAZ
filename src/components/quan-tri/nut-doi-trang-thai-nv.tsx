"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { TrangThaiNhanVien } from "@/types/database";

export function NutDoiTrangThaiNv({ maNv, trangThai }: { maNv: string; trangThai: TrangThaiNhanVien }) {
  const router = useRouter();
  const [dangXuLy, setDangXuLy] = useState(false);
  const dangLam = trangThai === "Đang làm";

  async function doi() {
    setDangXuLy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("nhan_vien")
      .update({ trang_thai: dangLam ? "Đã nghỉ việc" : "Đang làm" })
      .eq("ma_nv", maNv);
    setDangXuLy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Đã cập nhật trạng thái nhân viên");
      router.refresh();
    }
  }

  return (
    <Button size="sm" variant={dangLam ? "outline" : "secondary"} disabled={dangXuLy} onClick={doi}>
      {dangLam ? "Đánh dấu nghỉ việc" : "Kích hoạt lại"}
    </Button>
  );
}
