# Base44 Dev Environment

## Stack
Static single-page app (`velocity.html`) served by nginx. No build step, no backend, no database.

## Run
```
docker compose -f docker-compose.base44.yml up -d
```
Serves on host port 3000. `velocity.html` is the entry (configured via nginx `index`).

## Notes
- The repo root dir must be world-traversable (chmod 755) so the non-root nginx worker can read the bind-mounted files; a fresh clone with 700 perms returns 403.
- The file loads fonts and a proxy lib from CDNs at runtime (no local deps).
- Games in the library load from an external GitHub Pages iframe source; those require network egress from the browser, not the server.

## Verify
`curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` returns the HTML.
