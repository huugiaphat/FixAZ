function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function isPushSupported(): Promise<boolean> {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

// Đăng ký nhận Web Push thật (Mục 7) cho thiết bị/trình duyệt hiện
// tại. Gọi khi nhân viên bấm "Bật thông báo" trong app (cần thao tác
// người dùng để trình duyệt cho phép xin quyền Notification).
export async function subscribeToPush(): Promise<{ ok: boolean; error?: string }> {
  if (!(await isPushSupported())) return { ok: false, error: "Trình duyệt không hỗ trợ Web Push." };

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return { ok: false, error: "Chưa cấu hình VAPID public key." };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, error: "Bạn đã từ chối quyền thông báo." };

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!res.ok) return { ok: false, error: "Không lưu được đăng ký thông báo lên máy chủ." };
  return { ok: true };
}
