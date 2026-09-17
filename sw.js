// velocity public build — scramjet v2 service worker.
// loadScripts resolves relative to this file, so the repo works at the site
// root and under a subpath (e.g. github pages project sites).
importScripts("controller/controller.sw.js");

addEventListener("fetch", (e) => {
  if ($scramjetController.shouldRoute(e)) {
    e.respondWith($scramjetController.route(e));
  }
});
