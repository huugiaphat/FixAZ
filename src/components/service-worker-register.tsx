"use client";

import { useEffect } from "react";
import { flushOfflineQueue } from "@/lib/offline/sync";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // CHỈ đăng ký ở production — Service Worker cache-first dễ phục vụ
    // lại bundle JS cũ trong lúc dev (Fast Refresh/Turbopack đổi liên
    // tục), gây lỗi khó hiểu như "server action not found" dù code đã
    // sửa. Ở dev, chủ động gỡ mọi SW/cache cũ còn sót từ lần trước.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => void r.unregister());
      });
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => void caches.delete(k)));
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Đăng ký Service Worker thất bại:", err);
    });

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "HGP_SYNC_QUEUE") void flushOfflineQueue();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    const onOnline = () => void flushOfflineQueue();
    window.addEventListener("online", onOnline);
    if (navigator.onLine) void flushOfflineQueue();

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}
