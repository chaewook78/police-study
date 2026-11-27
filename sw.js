const CACHE_NAME = "police-study-v7-icon-20261127";
const APP_FILES = [
  "./",
  "./index.html",
  "./police-app-v7.webmanifest",
  "./police-icon-v7-192.png",
  "./police-icon-v7-512.png",
  "./police-icon-v7-180.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_FILES.map(path => new Request(new URL(path, self.registration.scope), {cache: "reload"})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME && (key.startsWith("police-study-") || key.startsWith("police-study-planner-"))).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, {cache: "no-store"});
        if (!response.ok) throw new Error("Network response not OK");
        const cache = await caches.open(CACHE_NAME);
        await cache.put("./index.html", response.clone());
        return response;
      } catch (error) {
        return (await (await caches.open(CACHE_NAME)).match("./index.html")) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return cached || Response.error();
    }
  })());
});
