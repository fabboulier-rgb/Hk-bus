// sw.js - Professional Service Worker for Fai-D
const CACHE_NAME = "fai-d-cache-v2"; // Change v2, v3, etc. when you update the app
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png"
];

// 1. INSTALL EVENT: Cache core assets
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Forces this new worker to activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 2. ACTIVATE EVENT: Clean up old caches when you update the app
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Clearing old cache", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all open pages immediately
});

// 3. FETCH EVENT: Network-First, fallback to Cache
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // RULE A: NEVER cache API calls (We want live ETAs or nothing)
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // RULE B: For the app shell (index.html), try the Network first so users get updates.
  // If the network fails (offline underground), serve the cached version.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Save the latest version to the cache
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(() => {
        // If network fails, return the cached version
        return caches.match(event.request);
      })
  );
});
 
