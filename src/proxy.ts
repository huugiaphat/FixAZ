import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Domain demo cũ (Vercel) — mã QR "yêu cầu dịch vụ" đã in rộng rãi trỏ
// vào https://huu-gia-phat-app.vercel.app/yeu-cau, nên KHÔNG thể đổi mã
// QR, nhưng domain này giờ chỉ còn là lớp chuyển hướng thuần túy: mọi
// đường dẫn (kể cả /yeu-cau) đều đẩy thẳng sang domain chính thức
// app.huugiaphat.com (deploy RIÊNG BIỆT trên Hostinger, chỉ chung 1 repo
// GitHub tự động build cả 2 nơi — không phải cùng 1 hosting).
// /api/* loại trừ vì cron thông báo (.github/workflows/notifications-cron.yml)
// gọi thẳng URL Vercel bằng curl không theo redirect (-sf không có -L).
const TEN_MIEN_DEMO_CU = "huu-gia-phat-app.vercel.app";
const TEN_MIEN_CHINH_THUC = "app.huugiaphat.com";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  if (host === TEN_MIEN_DEMO_CU && !request.nextUrl.pathname.startsWith("/api")) {
    const urlMoi = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${TEN_MIEN_CHINH_THUC}`);
    return NextResponse.redirect(urlMoi, 308);
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
