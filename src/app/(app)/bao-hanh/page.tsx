import { PageHeading } from "@/components/page-heading";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormBaoHanhMoi } from "@/components/bao-hanh/form-bao-hanh-moi";
import { TheBaoHanh } from "@/components/bao-hanh/the-bao-hanh";
import type { BaoHanh } from "@/types/database";

export default async function TrangBaoHanh() {
  const nv = await requireNhanVien(["Quản lý", "Admin", "CSKH-Điều phối", "Kiểm soát"]);
  const supabase = await createClient();
  const { data, error } = await supabase.from("bao_hanh").select("*").order("created_at", { ascending: false });
  const danhSach = (data as BaoHanh[]) ?? [];

  return (
    <div className="space-y-4">
      <PageHeading title="Bảo hành" description="Theo dõi các yêu cầu bảo hành sau khi hoàn thành công việc.">
        {nv.vai_tro_app !== "Kiểm soát" ? <FormBaoHanhMoi /> : null}
      </PageHeading>

      {error ? (
        <p className="text-sm text-destructive">Lỗi tải dữ liệu: {error.message}</p>
      ) : danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có yêu cầu bảo hành nào.</p>
      ) : (
        <div className="space-y-2">
          {danhSach.map((bh) => (
            <TheBaoHanh key={bh.ma_bh} baoHanh={bh} vaiTro={nv.vai_tro_app} />
          ))}
        </div>
      )}
    </div>
  );
}
