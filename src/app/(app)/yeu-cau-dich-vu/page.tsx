import { headers } from "next/headers";
import QRCode from "qrcode";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { TheYeuCau } from "@/components/yeu-cau/the-yeu-cau";
import type { YeuCauDichVu } from "@/types/database";

export default async function TrangYeuCauDichVu() {
  const nv = await requireNhanVien(["Quản lý", "CSKH-Điều phối"]);
  const supabase = await createClient();

  const { data } = await supabase.from("yeu_cau_dich_vu").select("*").order("created_at", { ascending: false }).limit(100);
  const danhSach = (data as YeuCauDichVu[]) ?? [];

  let qrDataUrl: string | null = null;
  let urlCongKhai = "";
  if (nv.vai_tro_app === "Quản lý") {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = host.startsWith("localhost") ? "http" : "https";
    urlCongKhai = `${proto}://${host}/yeu-cau`;
    qrDataUrl = await QRCode.toDataURL(urlCongKhai, { width: 320, margin: 1 });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Yêu cầu dịch vụ</h1>
      <p className="text-sm text-muted-foreground">
        Yêu cầu khách gửi trực tiếp từ trang công khai (quét mã QR), chưa qua bước tiếp nhận của CSKH.
      </p>

      {qrDataUrl ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL sinh động, không cần Next/Image tối ưu */}
            <img src={qrDataUrl} alt="Mã QR trang yêu cầu dịch vụ" width={120} height={120} className="rounded-lg border" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Mã QR cho khách quét</p>
              <p className="break-all text-xs text-muted-foreground">{urlCongKhai}</p>
              <a
                href={qrDataUrl}
                download="ma-qr-yeu-cau-dich-vu.png"
                className="inline-block text-sm font-medium text-primary hover:underline"
              >
                Tải ảnh QR về in
              </a>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {danhSach.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có yêu cầu nào.</p>
      ) : (
        <div className="space-y-2">
          {danhSach.map((yc) => (
            <TheYeuCau key={yc.ma_yc} yeuCau={yc} />
          ))}
        </div>
      )}
    </div>
  );
}
