// KP Driver PWA service worker — scope: /driver
// Independent from the customer service worker (/sw.js).
const CACHE_VERSION = "kp-driver-v1";
const STATIC_ASSETS = [
  "/driver",
  "/icons/driver-icon-192.png",
  "/icons/driver-icon-512.png",
  "/driver-manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) =>
        Promise.all(
          STATIC_ASSETS.map((url) =>
            cache.add(url).catch(() => {
              /* ignore individual asset failures */
            }),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("kp-driver-") && k !== CACHE_VERSION)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  // Never intercept Supabase (data must always be fresh)
  if (url.hostname.includes("supabase.co")) return;
  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Network-first for driver app navigations
  if (url.pathname.startsWith("/driver")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("/driver"))),
    );
    return;
  }

  // Cache-first for known static assets
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(req).then((c) => c || fetch(req)));
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Kings Pharmacy Driver";
  const options = {
    body: data.body || "New delivery assigned",
    icon: "/icons/driver-icon-192.png",
    badge: "/icons/driver-icon-192.png",
    vibrate: [200, 100, 200, 100, 200],
    tag: data.orderId || "kp-driver-notification",
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || "/driver", orderId: data.orderId },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  const targetUrl = (event.notification.data && event.notification.data.url) || "/driver";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/driver")) {
          client.focus();
          try {
            client.postMessage({
              type: "NOTIFICATION_CLICK",
              orderId: event.notification.data && event.notification.data.orderId,
            });
          } catch {}
          return;
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});