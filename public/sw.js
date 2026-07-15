// JobMo service worker — deliberately minimal.
//
// This app is almost entirely dynamic (auth-gated dashboards, live data),
// so an aggressive caching strategy would risk showing stale profile data,
// stale application statuses, etc. This worker does exactly one thing:
// if a page navigation fails because the user is offline, show the
// offline fallback page instead of the browser's default error screen.
// It does NOT cache API responses, dashboard pages, or user data.

const OFFLINE_URL = "/offline";
const CACHE_NAME = "jobmo-offline-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.open(CACHE_NAME).then((cache) => cache.match(OFFLINE_URL))
      )
    );
  }
  // All other requests (API calls, assets, etc.) pass through untouched —
  // no caching, so nothing here can ever go stale.
});
