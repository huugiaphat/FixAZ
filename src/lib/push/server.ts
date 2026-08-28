import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let daCauHinh = false;
function dbCauHinhVapid() {
  if (daCauHinh) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  if (!publicKey || !privateKey) return;
  webPush.setVapidDetails(subject, publicKey, privateKey);
  daCauHinh = true;
}

interface PushPayload {
  tieu_de: string;
  noi_dung?: string;
  url?: string;
  tag?: string;
}

// Gửi Web Push tới toàn bộ thiết bị đã đăng ký của 1 nhân viên. Xóa
// khỏi push_subscriptions nếu endpoint đã hết hạn (410 Gone).
export async function guiPushChoNhanVien(maNv: string, payload: PushPayload): Promise<void> {
  dbCauHinhVapid();
  if (!daCauHinh) return;

  const admin = createAdminClient();
  const { data: subs } = await admin.from("push_subscriptions").select("*").eq("ma_nv", maNv);
  if (!subs || subs.length === 0) return;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }),
  );
}
