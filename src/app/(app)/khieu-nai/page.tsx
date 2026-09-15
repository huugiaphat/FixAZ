import { PageHeading } from "@/components/page-heading";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormKhieuNaiMoi } from "@/components/khieu-nai/form-khieu-nai-moi";
import { TheKhieuNai } from "@/components/khieu-nai/the-khieu-nai";
import type { KhieuNai } from "@/types/database";

export default async function TrangKhieuNai() {
  const nv = await requireNhanVien(["Quản lý", "CSKH-Điều phối", "Kiểm soát"]);
  const supabase = await createClient();
  const { data, error } = await supabase.from("khieu_nai").select("*").order("created_at", { ascending: false });
  const danhSach = (data as KhieuNai[]) ?? [];

  return (
    <div className="space-y-4">
      <PageHeading title="Khiếu nại" description="Tiếp nhận phản hồi và theo dõi tiến độ giải quyết.">
        {nv.vai_tro_app !== "Kiểm soát" ? <FormKhieuNaiMoi /> : null}
      </PageHeading>

      {error ? (
        <p className="text-sm text-destructive">Lỗi tải dữ liệu: {error.message}</p>
      ) : danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có khiếu nại nào.</p>
      ) : (
        <div className="space-y-2">
          {danhSach.map((kn) => (
            <TheKhieuNai key={kn.ma_kn} khieuNai={kn} vaiTro={nv.vai_tro_app} />
          ))}
        </div>
      )}
    </div>
  );
}
