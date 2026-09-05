import { notFound } from "next/navigation";
import Image from "next/image";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NutIn } from "@/components/mau-bao-gia/nut-in";
import { formatVND, formatNgayDaiVN } from "@/lib/format";
import { CONG_TY } from "@/lib/company-info";
import type { MauBaoGiaTinhToan, MauBaoGiaDongTinhToan } from "@/types/database";

// Bố cục và văn phong đúng theo mẫu báo giá thật của công ty
// (mau-bao-gia.pdf, 2026-09-05) — không tự ý đổi câu chữ/thứ tự cột.
export default async function TrangInMauBaoGia({ params }: { params: Promise<{ ma: string }> }) {
  await requireNhanVien(["Quản lý", "CSKH-Điều phối", "Kế toán", "Kiểm soát"]);
  const { ma } = await params;
  const supabase = await createClient();

  const { data: mbg } = await supabase.from("v_mau_bao_gia").select("*").eq("ma_mbg", ma).maybeSingle();
  if (!mbg) notFound();
  const chiTiet = mbg as MauBaoGiaTinhToan;

  const { data: dong } = await supabase
    .from("v_mau_bao_gia_dong")
    .select("*")
    .eq("ma_mbg", ma)
    .order("created_at", { ascending: true });
  const danhSachDong = (dong as MauBaoGiaDongTinhToan[]) ?? [];

  return (
    <div className="mx-auto max-w-3xl p-6 print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <NutIn />
      </div>

      <div className="space-y-5 border p-8 text-sm print:border-0" style={{ fontFamily: "Times New Roman, Times, serif" }}>
        <div className="space-y-1 text-center">
          <div className="flex items-start justify-center gap-3">
            <Image src="/logo.png" alt="Hữu Gia Phát" width={500} height={500} className="h-[5.76rem] w-[5.76rem] shrink-0 object-contain" />
            <div>
              <p className="text-lg font-bold">{CONG_TY.tenDayDu}</p>
              <p>Địa Chỉ: {CONG_TY.diaChi}</p>
              <p>Hotline: {CONG_TY.hotline}</p>
            </div>
          </div>
          <div className="mx-auto h-1 w-48 bg-blue-700" />
          <p className="pt-2 text-xl font-bold">Báo Giá Tạm Tính</p>
        </div>

        <div>
          <p><span className="font-bold">Kính Gởi:</span> {chiTiet.ten_khach_hang}</p>
          <p><span className="font-bold">Địa Chỉ:</span> {chiTiet.dia_chi ?? "—"}</p>
        </div>

        <p>
          Xin chân thành cảm ơn Quý Khách đã tin tưởng sử dụng sản phẩm và dịch vụ do Hữu Gia Phát cung cấp. Chúng tôi
          trân trọng gửi đến Quý Khách báo giá như sau:
        </p>

        <table className="w-full border-collapse border border-black text-center">
          <thead>
            <tr className="bg-blue-100 font-bold text-red-700">
              <th className="border border-black px-2 py-1">STT</th>
              <th className="border border-black px-2 py-1">Nội Dung Công Việc</th>
              <th className="border border-black px-2 py-1">ĐVT</th>
              <th className="border border-black px-2 py-1">Số lượng</th>
              <th className="border border-black px-2 py-1">Đơn Giá</th>
              <th className="border border-black px-2 py-1">Thành Tiền</th>
            </tr>
          </thead>
          <tbody>
            {danhSachDong.map((d, i) => (
              <tr key={d.ma_dong}>
                <td className="border border-black px-2 py-1">{i + 1}</td>
                <td className="border border-black px-2 py-1 text-left">{d.ten_hang_muc}</td>
                <td className="border border-black px-2 py-1">{d.don_vi_tinh ?? "—"}</td>
                <td className="border border-black px-2 py-1">{d.so_luong}</td>
                <td className="border border-black px-2 py-1 text-right">{d.don_gia.toLocaleString("vi-VN")}</td>
                <td className="border border-black px-2 py-1 text-right font-bold">{d.thanh_tien.toLocaleString("vi-VN")}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-200 font-bold">
              <td className="border border-black px-2 py-1" colSpan={5}>Cộng</td>
              <td className="border border-black px-2 py-1 text-right">{chiTiet.tong_tien.toLocaleString("vi-VN")}</td>
            </tr>
          </tfoot>
        </table>

        <div>
          <p className="underline">Ghi Chú:</p>
          <p> - Giá trên chưa bao gồm thuế VAT.</p>
          <p> - Những hạn mục thi công và vật tư không có trong báo giá, sẽ được cty chúng tôi báo giá khi quý khách yêu cầu.</p>
          <p> - Báo giá trên có giá trị trong vòng 10 ngày</p>
          {chiTiet.ghi_chu ? <p className="whitespace-pre-wrap"> - {chiTiet.ghi_chu}</p> : null}
        </div>

        <p className="font-bold">Rất hân hạnh được phục vụ quý khách.</p>

        <div className="text-right">
          <p className="italic">{CONG_TY.thanhPho}, {formatNgayDaiVN(chiTiet.created_at)}</p>
          <p className="mt-12 font-bold">Hữu Gia Phát</p>
        </div>
      </div>
    </div>
  );
}
