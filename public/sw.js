// Service Worker — PWA offline (Mục 10) + Web Push (Mục 7).
// Chiến lược cache:
// - Asset tĩnh có hash trong tên (_next/static/...): cache-first — an
//   toàn vì nội dung không bao giờ đổi dưới cùng 1 tên file.
// - Trang/HTML/RSC payload (mọi request điều hướng còn lại): LUÔN ưu
//   tiên mạng trước (network-first), chỉ rơi về cache khi mất mạng
//   hẳn. Lý do: đây là app nghiệp vụ có ghi/sửa/xóa dữ liệu liên tục
//   (Mục 6.12 quản trị nhân viên...) — nếu cache-first cho cả trang,
//   người dùng sẽ thấy dữ liệu CŨ ngay sau khi vừa sửa/xóa cho đến khi
//   tự tải lại lần 2, dễ tưởng thao tác chưa lưu.
// - API/Supabase: không cache, luôn phải mới (ghi dữ liệu lúc mất
//   mạng do hàng đợi IndexedDB ở src/lib/offline xử lý riêng).

const CACHE_NAME = "hgp-shell-v2";
const APP_SHELL = ["/manifest.json", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  const laAssetTinhCoHash = url.pathname.startsWith("/_next/static/");

  if (laAssetTinhCoHash) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          }),
      ),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
  );
});

// ---- Web Push (Mục 7: Tự động hóa & thông báo) ----
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { tieu_de: "Thông báo", noi_dung: event.data.text() };
  }

  const title = payload.tieu_de || "Hữu Gia Phát";
  const options = {
    body: payload.noi_dung || "",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    data: { url: payload.url || "/" },
    tag: payload.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    }),
  );
});

// Background Sync (best-effort) — chỉ báo cho các tab đang mở tự đồng
// bộ hàng đợi offline; việc ghi dữ liệu thật do trang xử lý (cần
// phiên đăng nhập Supabase, Service Worker không giữ session).
self.addEventListener("sync", (event) => {
  if (event.tag === "hgp-sync-queue") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "HGP_SYNC_QUEUE" }));
      }),
    );
  }
});
