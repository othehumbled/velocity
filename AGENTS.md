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
- proxy: sandstone (loaded from CDN with fallbacks), ultraviolet as fallback
- search engine: duckduckgo only (no dropdown/selector)

## key details

- themes stored in localStorage `vel_theme`, backgrounds in `vel_bg` (comma-separated layers: stars,aurora,meteors)
- cloak in `vel_cloak`, panic key in `vel_panic_key` / `vel_panic_url`
- library button in game chrome converts the current tab (not a new tab)
- random messages array `RANDOM_MSGS` picks one per home page load
