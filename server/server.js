import wisp from "wisp-server-node";
import { createBareServer } from "@tomphttp/bare-server-node";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { bareModulePath } from "@mercuryworkshop/bare-as-module3";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import express from "express";
import { createServer } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = join(fileURLToPath(import.meta.url), "..");
const publicPath = join(__dirname, ".."); // repo root (velocity.html, proxy-sw.js)

const bare = createBareServer("/bare/");
const app = express();

// Static: repo files first (velocity.html, proxy-sw.js), then UV dist at root
// (uv.config.js references /uv.bundle.js, /uv.sw.js, etc. at root)
app.use(express.static(publicPath));
app.use(express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(baremuxPath));
app.use("/baremod/", express.static(bareModulePath));

// SPA fallback -> velocity.html
app.use((req, res) => {
  res.sendFile(join(publicPath, "velocity.html"));
});

const server = createServer();
server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) bare.routeRequest(req, res);
  else app(req, res);
});
server.on("upgrade", (req, socket, head) => {
  if (req.url.endsWith("/wisp/")) wisp.routeRequest(req, socket, head);
  else if (bare.shouldRoute(req)) bare.routeUpgrade(req, socket, head);
  else socket.end();
});

const port = parseInt(process.env.PORT || "8080", 10);
server.listen({ port, host: "0.0.0.0" }, () => {
  console.log("velocity proxy server on http://0.0.0.0:" + port);
});

process.on("SIGINT", () => { server.close(); bare.close(); process.exit(0); });
process.on("SIGTERM", () => { server.close(); bare.close(); process.exit(0); });
