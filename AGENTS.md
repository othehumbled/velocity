# velocity

unblocked game site — single-file frontend (`velocity.html`) served by a node express proxy server (`server/server.js`).

## running

```
docker compose -f docker-compose.base44.yml up -d
```

- web service: `node:20`, installs deps from `server/package.json`, runs `node server.js`
- listens on port 8080 inside the container, mapped to host port 3000
- no database, no external secrets needed
- express serves static files from repo root (velocity.html, proxy-sw.js) + uv/epoxy/baremux dist at root
- SPA fallback to velocity.html for all routes

## architecture

- `velocity.html` — entire app: html, css, js in one file. tabbed browser ui with game library, themes, animated canvas backgrounds, cloak, panic key.
- `server/server.js` — express + ultraviolet/bare/wisp proxy server
- `proxy-sw.js` — ultraviolet service worker wrapper
- games list is embedded inline in velocity.html (no network fetch for the library)
- proxy: ultraviolet (main build), scramjet v2 (public build)
- search engine: duckduckgo only (no dropdown/selector)
- shared ui kinds: home, library, movies (movies + anime grids), embedder (html embedder), settings, legal, changelog
- `bPop` button next to the address bar opens the current tab's url in an about:blank popup window (full-viewport iframe)

## key details

- themes stored in localStorage `vel_theme`, backgrounds in `vel_bg` (comma-separated layers: stars,aurora,meteors)
- cloak in `vel_cloak`, panic key in `vel_panic_key` / `vel_panic_url`
- library button in game chrome converts the current tab (not a new tab)
- random messages array `RANDOM_MSGS` picks one per home page load
- uv transport setting in localStorage `vel_transport`: "epoxy" (default) or "libcurl". applied via BareMux setTransport to `/epoxy/index.mjs` or `/libcurl/index.mjs` with `{wisp: <ws(s)://host/wisp/>}`. both connect to the local wisp endpoint.
- `@mercuryworkshop/libcurl-transport` has no `libcurlPath` export — server.js resolves its dist dir via createRequire and serves it at `/libcurl/`.

## velocity-public.html

- single-file redistributable, generated from `velocity.html` by a transform: drops uv/baremux script tags + service worker registration, removes the server-only transport card, replaces the proxy engine with scramjet v2 (`USE_SCRAMJET=true`).
- scramjet v2 (main build stays on ultraviolet): the page loads `/scramjet/scramjet.js` + `/controller/controller.api.js` (IIFEs setting `$scramjet` / `$scramjetController`), imports `utils/scramjet-utils.mjs` (UrlWatcher + CatchEscapedLinks plugins) and `libcurl/index.mjs` (transport, public wisp fallbacks in `WISP_FALLBACKS`), registers `sw.js`, then `new $scramjetController.Controller({serviceworker, transport, config})` -> `controller.createFrame(iframeEl, {plugins})` -> `frame.go(url)`.
- all paths are resolved relative to the page's directory (`sjBase()`), so the build works at a site root and under subpaths (github pages project sites).
- vendored assets shipped in this repo next to the html: `scramjet/` (@mercuryworkshop/scramjet 2.0.67-alpha.2 dist: scramjet.js + scramjet.wasm), `controller/` (scramjet-controller 0.0.14: controller.api.js / controller.inject.js / controller.sw.js), `utils/scramjet-utils.mjs` (0.0.3), `libcurl/index.mjs` (@mercuryworkshop/libcurl-transport 2.0.5, self-contained bundle), `sw.js` (tiny wrapper that importScripts `controller/controller.sw.js` and routes fetches via `$scramjetController`). controller 0.0.14 pins scramjet 2.0.67-alpha.2 — keep those two in sync when updating.
- if any of that fails (file://, missing assets, no https) the build degrades to direct iframe embeds, like before.
- escaped links (target=_blank / window.open) are caught and redirected to `#goto=<url>` on the shell, which the page reads on load and opens in a new proxied tab. never use `?goto=` — the query would force a reload.
- warning: `sw.js` and the main build's `proxy-sw.js` both claim scope `/`, so on a shared origin the last-registered one wins; each build re-registers its own on load, so this self-heals, but testing both builds on one origin swaps the active service worker.
- regenerate after changing velocity.html (build script lives outside the repo); keep both files in feature parity.
