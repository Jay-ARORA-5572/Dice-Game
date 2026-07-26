// Bump this on any meaningful change to force old caches out (see activate below).
const CACHE_NAME = "dicee-cache-v2";

// Static, rarely-changing assets: fine to serve cache-first for speed/offline.
const STATIC_ASSETS = [
  "./manifest.json",
  "./favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./images/dice1.png",
  "./images/dice2.png",
  "./images/dice3.png",
  "./images/dice4.png",
  "./images/dice5.png",
  "./images/dice6.png",
];

// App code: changes often during active development. Served network-first
// so a browser online never shows stale JS/HTML — cache is only a fallback
// for when you're offline.
const APP_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./index.js",
  "./js/game-logic.js",
  "./js/avatar.js",
  "./js/stats.js",
  "./js/multiplayer.js",
  "./js/multiplayer-ui.js",
  "./js/firebase-config.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([...STATIC_ASSETS, ...APP_ASSETS]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

function isAppAsset(url) {
  return APP_ASSETS.some((path) => {
    const resolved = new URL(path, self.location.origin).href;
    return url === resolved || url === resolved.replace(/\/$/, "/index.html");
  });
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = event.request.url;
  if (!url.startsWith(self.location.origin)) return; // don't intercept cross-origin (fonts, Firebase, etc.)

  if (isAppAsset(url) || event.request.mode === "navigate") {
    // Network-first: always try to get the latest code when online.
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets (images, icons, manifest).
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      });
    })
  );
});
