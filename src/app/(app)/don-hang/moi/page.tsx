import { requireNhanVien } from "@/lib/auth";
import { FormDonHangMoi } from "@/components/don-hang/form-don-hang-moi";

export default async function TrangTaoDonHangMoi() {
  await requireNhanVien(["Quản lý", "CSKH-Điều phối"]); // nguyên tắc 6 — chỉ 2 vai trò này được tạo đơn

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Tạo đơn hàng mới</h1>
      <FormDonHangMoi />
    </div>
  );
}
