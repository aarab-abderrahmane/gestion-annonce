const CACHE_NAME = "gestion-annonces-v1";
const OFFLINE_URL = "/offline.html";
const HOME_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([HOME_URL, OFFLINE_URL])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) return cachedPage;

          const cachedHome = await caches.match(HOME_URL);
          if (cachedHome) return cachedHome;

          return caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((response) => {
          if (
            response.ok &&
            event.request.url.startsWith(self.location.origin)
          ) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }

          return response;
        })
        .catch(() => caches.match(OFFLINE_URL));
    }),
  );
});
