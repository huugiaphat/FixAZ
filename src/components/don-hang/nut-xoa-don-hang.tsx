"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function NutXoaDonHang({ maDon }: { maDon: string }) {
  const [dangXoa, setDangXoa] = useState(false);
  const router = useRouter();

  async function xoa() {
    if (!confirm(`Xóa vĩnh viễn đơn ${maDon}? Toàn bộ chi tiết, báo giá, phát sinh, điều phối, nghiệm thu, thu tiền của đơn này sẽ mất theo, không thể khôi phục.`)) return;
    setDangXoa(true);
    const supabase = createClient();
    const { error } = await supabase.from("don_hang").delete().eq("ma_don", maDon);
    setDangXoa(false);
    if (error) {
      if (error.code === "23503") {
        toast.error("Không xóa được: đơn này còn khiếu nại, bảo hành, xuất kho, thu chi hoặc mẫu báo giá đang gắn vào. Xử lý các dữ liệu đó trước.");
        return;
      }
      toast.error(`Không xóa được: ${error.message}`);
      return;
    }
    toast.success(`Đã xóa đơn ${maDon}`);
    router.push("/don-hang");
    router.refresh();
  }

  return (
    <Button variant="destructive" size="sm" className="gap-2" disabled={dangXoa} onClick={xoa}>
      <Trash2 className="h-4 w-4" /> {dangXoa ? "Đang xóa…" : "Xóa đơn hàng"}
    </Button>
  );
}
