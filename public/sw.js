// Service Worker — PWA offline (Mục 10) + Web Push (Mục 7).
// Chiến lược cache: "app shell" (trang tĩnh/asset) cache-first để mở
// được app khi mất mạng; dữ liệu (Supabase) luôn network-first vì
// nghiệp vụ cần dữ liệu mới nhất — khi mất mạng, việc ghi dữ liệu do
// hàng đợi IndexedDB (src/lib/offline) xử lý ở tầng trang, không phải
// ở Service Worker này.

const CACHE_NAME = "hgp-shell-v1";
const APP_SHELL = ["/", "/manifest.json", "/icons/icon.svg"];

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
  // Không cache API/Supabase — luôn phải mới.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached || caches.match("/"));
      return cached || network;
    }),
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
