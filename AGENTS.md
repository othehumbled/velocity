# Base44 Dev Environment

## Stack
Static single-page app (`velocity.html`) + an Ultraviolet web proxy. The proxy
server is a Node/Express app (`server/server.js`) that serves the page and the
UV/bare-mux static assets, runs a **bare server** at `/bare/` (and a wisp
endpoint at `/wisp/`), and uses a wrapper service worker `proxy-sw.js` that adds
`skipWaiting` + `clients.claim()` to the stock UV SW so first-load navigation is
intercepted without a page reload.

No build step, no database. Dependencies install at container start via npm.

## Run
```
docker compose -f docker-compose.base44.yml up -d
```
Serves on host port 3000 (node listens on 8080, mapped 3000:8080).

## Proxy architecture (important)
- UV dist (`@titaniumnetwork-dev/ultraviolet`) is served **at the root** because
  `uv.config.js` bakes in root-relative paths (`/uv.bundle.js`, `/uv.sw.js`,
  `/uv.handler.js`, `/uv.client.js`, `/uv.sw.js`). Do NOT move UV under `/uv/`
  or the SW's importScripts will 404.
- `proxy-sw.js` (repo root) is the registered service worker (`{scope:"/"}`). It
  wraps the stock UV `sw.js` logic + `skipWaiting`/`claim`.
- Default transport is the **bare** transport (`/baremod/index.mjs` → `/bare/`),
  chosen because it does NOT need SharedArrayBuffer, so we do NOT set
  COOP/COEP headers — this keeps velocity's cross-origin resources (Google Fonts,
  simpleicons, the genizymath game iframe) working. Epoxy/wisp is also wired up
  if a SAB-capable transport is wanted later (would need COEP).
- Games (`openGame`) load **directly** (not proxied) from
  `https://genizymath.github.io/iframe`. Only address-bar/shortcut navigation
  (non-game `web` tabs) goes through the proxy via
  `__uv$config.prefix + __uv$config.encodeUrl(url)`.

## Verify
- Server: `curl -s -H "Host: x.example" http://localhost:3000/` → velocity.html.
- Proxy backend: a bare v3 GET with `X-Bare-URL: https://example.com/` and
  `X-Bare-Headers: {"host":"example.com"}` returns `x-bare-status: 200`.
- Browser: open the preview, type a URL in the address bar, submit → the iframe
  shows the proxied site (SW must register first; check
  `navigator.serviceWorker.controller`).

## Notes
- `server/node_modules/` is gitignored and (re)installed at container start.
- The repo root dir must be world-traversable (chmod 755) for non-root workers;
  a fresh clone with 700 perms can cause permission errors.
- Games in the library load from an external GitHub Pages iframe; those need
  browser network egress, not the server.
