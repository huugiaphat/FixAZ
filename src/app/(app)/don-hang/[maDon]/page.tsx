import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireNhanVien } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeTrangThaiDon, BadgeUuTien } from "@/components/don-hang/badge-trang-thai";
import { ChuyenTrangThaiDon } from "@/components/don-hang/chuyen-trang-thai";
import { TabChiTietDon } from "@/components/don-hang/tab-chi-tiet-don";
import { TabBaoGia } from "@/components/don-hang/tab-bao-gia";
import { TabPhatSinh } from "@/components/don-hang/tab-phat-sinh";
import { TabDieuPhoi } from "@/components/don-hang/tab-dieu-phoi";
import { TabNghiemThu } from "@/components/don-hang/tab-nghiem-thu";
import { TabThuTien } from "@/components/don-hang/tab-thu-tien";
import { formatDateTime, formatVND } from "@/lib/format";
import type {
  BaoGia, DonHangTinhToan, PhatSinh, DieuPhoi, NghiemThu, ThuTien, KhachHang, ChiTietDonTinhToan, BangGiaDichVu,
} from "@/types/database";

export default async function ChiTietDonHang({
  params,
  searchParams,
}: {
  params: Promise<{ maDon: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const nv = await requireNhanVien(["Quản lý", "CSKH-Điều phối", "Thợ", "Kế toán", "Kho"]);
  const { maDon } = await params;
  const { tab } = await searchParams;
  const CAC_TAB_HOP_LE = ["chi-tiet-don", "bao-gia", "dieu-phoi", "phat-sinh", "nghiem-thu", "thu-tien"];
  const tabMacDinh = tab && CAC_TAB_HOP_LE.includes(tab) ? tab : "chi-tiet-don";
  const supabase = await createClient();

  const { data: don } = await supabase.from("v_don_hang").select("*").eq("ma_don", maDon).single();
  if (!don) notFound();
  const donHang = don as DonHangTinhToan;

  const [{ data: kh }, { data: chiTietDon }, { data: baoGia }, { data: phatSinh }, { data: dieuPhoi }, { data: nghiemThu }, { data: thuTien }, { data: bangGia }] =
    await Promise.all([
      supabase.from("khach_hang").select("*").eq("ma_kh", donHang.ma_kh).single(),
      supabase.from("v_chi_tiet_don").select("*").eq("ma_don", maDon).order("created_at", { ascending: false }),
      supabase.from("bao_gia").select("*").eq("ma_don", maDon).order("phien_ban", { ascending: false }),
      supabase.from("phat_sinh").select("*").eq("ma_don", maDon).order("created_at", { ascending: false }),
      supabase.from("dieu_phoi").select("*").eq("ma_don", maDon).order("created_at", { ascending: false }),
      supabase.from("nghiem_thu").select("*").eq("ma_don", maDon).order("created_at", { ascending: false }),
      supabase.from("thu_tien").select("*").eq("ma_don", maDon).order("ngay_thu", { ascending: false }),
      supabase.from("bang_gia_dich_vu").select("*").eq("dang_hoat_dong", true).order("ten_dich_vu"),
    ]);

  const khachHang = kh as KhachHang | null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{donHang.ma_don}</p>
          <h1 className="text-2xl font-semibold">{donHang.mo_ta_su_co}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <BadgeTrangThaiDon trangThai={donHang.trang_thai} />
            <BadgeUuTien uuTien={donHang.uu_tien} />
          </div>
        </div>
        <ChuyenTrangThaiDon maDon={donHang.ma_don} trangThai={donHang.trang_thai} vaiTro={nv.vai_tro_app} />
      </div>

      {donHang.trang_thai === "Đã hủy" && donHang.ly_do_tu_choi_huy ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 text-sm">
            <span className="font-medium">Lý do hủy:</span> {donHang.ly_do_tu_choi_huy}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="grid gap-3 py-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Khách hàng</p>
            {khachHang ? (
              <Link href={`/khach-hang/${khachHang.ma_kh}`} className="font-medium text-primary hover:underline">
                {khachHang.ho_ten} · {khachHang.sdt}
              </Link>
            ) : null}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dịch vụ</p>
            <p className="font-medium">{donHang.dich_vu}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ngày tiếp nhận</p>
            <p className="font-medium">{formatDateTime(donHang.ngay_tiep_nhan)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tổng tiền đơn</p>
            <p className="font-medium">{formatVND(donHang.tong_tien)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Đã thu</p>
            <p className="font-medium">{formatVND(donHang.da_thu)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Công nợ</p>
            <p className={`font-medium ${donHang.cong_no > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatVND(donHang.cong_no)}</p>
          </div>
          {donHang.khung_gio_mong_muon ? (
            <div>
              <p className="text-xs text-muted-foreground">Khung giờ mong muốn</p>
              <p className="font-medium">{donHang.khung_gio_mong_muon}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {donHang.anh_hien_trang.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {donHang.anh_hien_trang.map((url) => (
            <div key={url} className="relative h-24 w-24 overflow-hidden rounded-lg border">
              <Image src={url} alt="Ảnh hiện trạng" fill className="object-cover" unoptimized />
            </div>
          ))}
        </div>
      ) : null}

      <Tabs defaultValue={tabMacDinh}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="chi-tiet-don">Chi tiết đơn</TabsTrigger>
          <TabsTrigger value="bao-gia">Báo giá</TabsTrigger>
          <TabsTrigger value="dieu-phoi">Điều phối</TabsTrigger>
          <TabsTrigger value="phat-sinh">Phát sinh</TabsTrigger>
          <TabsTrigger value="nghiem-thu">Nghiệm thu</TabsTrigger>
          <TabsTrigger value="thu-tien">Thu tiền</TabsTrigger>
        </TabsList>
        <TabsContent value="chi-tiet-don" className="pt-4">
          <TabChiTietDon
            maDon={maDon}
            danhSach={(chiTietDon as ChiTietDonTinhToan[]) ?? []}
            bangGiaDichVu={(bangGia as BangGiaDichVu[]) ?? []}
            vaiTro={nv.vai_tro_app}
          />
        </TabsContent>
        <TabsContent value="bao-gia" className="pt-4">
          <TabBaoGia maDon={maDon} danhSach={(baoGia as BaoGia[]) ?? []} vaiTro={nv.vai_tro_app} />
        </TabsContent>
        <TabsContent value="dieu-phoi" className="pt-4">
          <TabDieuPhoi maDon={maDon} danhSach={(dieuPhoi as DieuPhoi[]) ?? []} vaiTro={nv.vai_tro_app} maNvHienTai={nv.ma_nv} />
        </TabsContent>
        <TabsContent value="phat-sinh" className="pt-4">
          <TabPhatSinh maDon={maDon} danhSach={(phatSinh as PhatSinh[]) ?? []} bangGiaDichVu={(bangGia as BangGiaDichVu[]) ?? []} />
        </TabsContent>
        <TabsContent value="nghiem-thu" className="pt-4">
          <TabNghiemThu maDon={maDon} danhSach={(nghiemThu as NghiemThu[]) ?? []} />
        </TabsContent>
        <TabsContent value="thu-tien" className="pt-4">
          <TabThuTien maDon={maDon} danhSach={(thuTien as ThuTien[]) ?? []} congNo={donHang.cong_no} vaiTro={nv.vai_tro_app} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
