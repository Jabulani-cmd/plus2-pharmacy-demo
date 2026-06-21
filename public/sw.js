// Minimal install-eligible service worker for Kings Pharmacy PWA.
// Chrome on Android requires a SW with a fetch handler before it will
// fire the `beforeinstallprompt` install banner. We deliberately do
// NOT cache anything — every request goes straight to the network so
// users always see fresh content (no stale white-screen risk).
self.addEventListener("install", (event) => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", (event) => {
  // Pass-through. Presence of this handler is what makes the app
  // install-eligible; we intentionally don't intercept responses.
});