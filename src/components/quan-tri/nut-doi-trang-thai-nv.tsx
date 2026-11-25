"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { doiTrangThaiNhanVien } from "@/app/(app)/quan-tri/actions";
import { Button } from "@/components/ui/button";
import type { TrangThaiNhanVien } from "@/types/database";

export function NutDoiTrangThaiNv({ maNv, trangThai }: { maNv: string; trangThai: TrangThaiNhanVien }) {
  const router = useRouter();
  const [dangXuLy, setDangXuLy] = useState(false);
  const daNghiViec = trangThai === "Đã nghỉ việc";

  async function doi() {
    setDangXuLy(true);
    const ketQua = await doiTrangThaiNhanVien(maNv);
    setDangXuLy(false);
    if (!ketQua.ok) toast.error(ketQua.loi);
    else {
      toast.success(daNghiViec ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản nhân viên");
      router.refresh();
    }
  }

  return (
    <Button size="sm" variant={daNghiViec ? "secondary" : "outline"} disabled={dangXuLy} onClick={doi}>
      {daNghiViec ? "Kích hoạt lại" : "Đánh dấu nghỉ việc và khóa"}
    </Button>
  );
}
