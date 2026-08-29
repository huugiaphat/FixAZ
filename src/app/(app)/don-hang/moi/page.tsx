import { requireNhanVien } from "@/lib/auth";
import { FormDonHangMoi } from "@/components/don-hang/form-don-hang-moi";

export default async function TrangTaoDonHangMoi({
  searchParams,
}: {
  searchParams: Promise<{ ma_yc?: string; ho_ten?: string; sdt?: string; dich_vu?: string; yeu_cau?: string }>;
}) {
  await requireNhanVien(["Quản lý", "CSKH-Điều phối"]); // nguyên tắc 6 — chỉ 2 vai trò này được tạo đơn
  const { ma_yc, ho_ten, sdt, dich_vu, yeu_cau } = await searchParams;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Tạo đơn hàng mới</h1>
      <FormDonHangMoi tuYeuCau={ma_yc ? { ma_yc, ho_ten, sdt, dich_vu, yeu_cau } : undefined} />
    </div>
  );
}
