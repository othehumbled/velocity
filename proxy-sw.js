/* velocity wrapper around the stock Ultraviolet service worker.
   Adds skipWaiting + clients.claim() so the worker controls the page on the
   very first load (otherwise proxied /service/ requests aren't intercepted
   until the next reload). UV dist is served at the root, matching the paths
   baked into uv.config.js (/uv.bundle.js, /uv.sw.js, ...). */
importScripts("/uv.bundle.js");
importScripts("/uv.config.js");
importScripts(__uv$config.sw || "/uv.sw.js");

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()));

const uv = new UVServiceWorker();

async function handleRequest(event) {
  if (uv.route(event)) {
    return await uv.fetch(event);
  }
  return await fetch(event.request);
}

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});
