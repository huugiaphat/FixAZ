import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guiPushChoNhanVien } from "@/lib/push/server";
import type { LoaiThongBao } from "@/types/database";

// Endpoint chạy định kỳ (Vercel Cron / Supabase Cron gọi mỗi 15 phút)
// quét các điều kiện cần cảnh báo tự động theo Mục 7, tạo thong_bao +
// gửi Web Push thật. Bảo vệ bằng CRON_SECRET — không public.
export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret") ?? request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
  }

  const admin = createAdminClient();
  let soLuongTao = 0;

  async function taoThongBaoChoVaiTro(params: {
    loai: LoaiThongBao;
    tieu_de: string;
    noi_dung: string;
    vai_tro: string[];
    ma_don?: string | null;
    ma_vt?: string | null;
  }) {
    const { data: nguoiNhanList } = await admin
      .from("nhan_vien")
      .select("ma_nv")
      .in("vai_tro_app", params.vai_tro)
      .eq("trang_thai", "Đang làm");

    for (const nv of nguoiNhanList ?? []) {
      let query = admin
        .from("thong_bao")
        .select("id")
        .eq("loai", params.loai)
        .eq("nguoi_nhan", nv.ma_nv)
        .eq("da_doc", false);
      query = params.ma_don ? query.eq("ma_don", params.ma_don) : query.is("ma_don", null);
      query = params.ma_vt ? query.eq("ma_vt", params.ma_vt) : query.is("ma_vt", null);
      const { data: existing } = await query.maybeSingle();
      if (existing) continue;

      const { data: inserted } = await admin
        .from("thong_bao")
        .insert({
          loai: params.loai,
          tieu_de: params.tieu_de,
          noi_dung: params.noi_dung,
          ma_don: params.ma_don ?? null,
          ma_vt: params.ma_vt ?? null,
          nguoi_nhan: nv.ma_nv,
        })
        .select("id")
        .single();

      if (inserted) {
        soLuongTao++;
        await guiPushChoNhanVien(nv.ma_nv, {
          tieu_de: params.tieu_de,
          noi_dung: params.noi_dung,
          url: params.ma_don ? `/don-hang/${params.ma_don}` : "/kho-vat-tu",
        });
        await admin.from("thong_bao").update({ da_gui_push: true }).eq("id", inserted.id);
      }
    }
  }

  const { data: config } = await admin
    .from("cau_hinh_he_thong")
    .select("khoa, gia_tri")
    .in("khoa", ["SO_GIO_NHAC_PHAT_SINH_CHUA_XAC_NHAN", "SO_NGAY_NHAC_CHAM_SOC_SAU_SUA"]);
  const soGioPhatSinh = Number(config?.find((c) => c.khoa === "SO_GIO_NHAC_PHAT_SINH_CHUA_XAC_NHAN")?.gia_tri ?? 2);
  const soNgayChamSoc = Number(config?.find((c) => c.khoa === "SO_NGAY_NHAC_CHAM_SOC_SAU_SUA")?.gia_tri ?? 2);

  // 1) Nhắc xác nhận phát sinh
  const nguongPhatSinh = new Date(Date.now() - soGioPhatSinh * 3600_000).toISOString();
  const { data: phatSinhChuaXacNhan } = await admin
    .from("phat_sinh")
    .select("ma_ps, ma_don, hang_muc")
    .eq("khach_xac_nhan", false)
    .eq("truong_hop_khan_cap", false)
    .lt("created_at", nguongPhatSinh);
  for (const ps of phatSinhChuaXacNhan ?? []) {
    await taoThongBaoChoVaiTro({
      loai: "Nhắc xác nhận phát sinh",
      tieu_de: `Phát sinh chưa xác nhận — đơn ${ps.ma_don}`,
      noi_dung: `Hạng mục "${ps.hang_muc}" vẫn chưa được khách xác nhận.`,
      vai_tro: ["Quản lý", "CSKH-Điều phối"],
      ma_don: ps.ma_don,
    });
  }

  // 2) Nhắc nộp tiền mặt
  const { data: tienMatChuaNop } = await admin
    .from("thu_tien")
    .select("ma_thu, ma_don, so_tien")
    .eq("phuong_thuc", "Tiền mặt")
    .eq("da_nop_ve_cong_ty", false);
  for (const t of tienMatChuaNop ?? []) {
    await taoThongBaoChoVaiTro({
      loai: "Nhắc nộp tiền mặt",
      tieu_de: `Chưa nộp tiền mặt — đơn ${t.ma_don}`,
      noi_dung: `Khoản thu ${t.so_tien.toLocaleString("vi-VN")} đ chưa được đánh dấu đã nộp về công ty.`,
      vai_tro: ["Kế toán"],
      ma_don: t.ma_don,
    });
  }

  // 3) Cảnh báo đơn trễ hẹn
  const { data: donTre } = await admin
    .from("dieu_phoi")
    .select("ma_don, eta")
    .is("check_in", null)
    .lt("eta", new Date().toISOString());
  for (const dp of donTre ?? []) {
    await taoThongBaoChoVaiTro({
      loai: "Cảnh báo đơn trễ hẹn",
      tieu_de: `Đơn ${dp.ma_don} trễ hẹn`,
      noi_dung: `Đã quá giờ hẹn (ETA) mà thợ chưa check-in tại hiện trường.`,
      vai_tro: ["Quản lý", "CSKH-Điều phối"],
      ma_don: dp.ma_don,
    });
  }

  // 4) Nhắc chăm sóc sau sửa
  const ngayMuc = new Date();
  ngayMuc.setDate(ngayMuc.getDate() - soNgayChamSoc);
  const ngayMucStr = ngayMuc.toISOString().slice(0, 10);
  const { data: donCanChamSoc } = await admin
    .from("don_hang")
    .select("ma_don")
    .eq("trang_thai", "Đã đóng")
    .eq("ngay_dong_don", ngayMucStr);
  for (const d of donCanChamSoc ?? []) {
    await taoThongBaoChoVaiTro({
      loai: "Nhắc chăm sóc sau sửa",
      tieu_de: `Nhắc chăm sóc khách — đơn ${d.ma_don}`,
      noi_dung: `Đơn đã hoàn thành ${soNgayChamSoc} ngày trước — liên hệ hỏi thăm khách hàng (Mục A16 quy chế).`,
      vai_tro: ["CSKH-Điều phối", "Quản lý"],
      ma_don: d.ma_don,
    });
  }

  // 5) Cảnh báo tồn kho thấp
  const { data: vatTuList } = await admin.from("v_vat_tu").select("ma_vt, ten, ton_kho, nguong_canh_bao_ton");
  for (const vt of vatTuList ?? []) {
    if (vt.nguong_canh_bao_ton != null && vt.ton_kho < vt.nguong_canh_bao_ton) {
      await taoThongBaoChoVaiTro({
        loai: "Cảnh báo tồn kho thấp",
        tieu_de: `Tồn kho thấp — ${vt.ten}`,
        noi_dung: `Tồn hiện tại ${vt.ton_kho}, dưới ngưỡng cảnh báo ${vt.nguong_canh_bao_ton}.`,
        vai_tro: ["Kho", "Quản lý"],
        ma_vt: vt.ma_vt,
      });
    }
  }

  return NextResponse.json({ ok: true, so_luong_thong_bao_moi: soLuongTao });
}
