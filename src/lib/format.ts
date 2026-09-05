// Định dạng tiền tệ/ngày giờ theo chuẩn Việt Nam (Mục 9: "680.000 đ").

// Chuẩn hoá số điện thoại về dạng chỉ gồm chữ số — dùng khi lưu SĐT
// nhân viên và khi tra cứu lúc đăng nhập, để "091 234 5678" và
// "0912345678" được coi là cùng 1 số.
export function chuanHoaSdt(value: string): string {
  return value.replace(/\D/g, "");
}

const vndFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

export function formatVND(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "0 đ";
  return `${vndFormatter.format(value)} đ`;
}

// Luôn ghim múi giờ Việt Nam thay vì để Intl tự lấy theo máy đang chạy
// (server Vercel chạy giờ UTC, trình duyệt người dùng chạy giờ VN) —
// thiếu dòng này khiến Server Component/Client Component format ra 2
// chuỗi giờ khác nhau cho cùng 1 thời điểm, gây lỗi hydration mismatch
// (React #418) và hiển thị sai giờ trên các trang server-render thuần.
const MUI_GIO_VN = "Asia/Ho_Chi_Minh";

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: MUI_GIO_VN }).format(date);
}

// "ngày 28 tháng 08 năm 2026" — dùng cho phần ký ngày trên văn bản in
// (báo giá...), đúng định dạng mẫu giấy tờ thật của công ty.
export function formatNgayDaiVN(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: MUI_GIO_VN }).formatToParts(date);
  const lay = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `ngày ${lay("day")} tháng ${lay("month")} năm ${lay("year")}`;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MUI_GIO_VN,
  }).format(date);
}

export function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  return rtf.format(diffDay, "day");
}
