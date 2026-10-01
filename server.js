import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon" };

const server = http.createServer(async (req, res) => {
  try {
    const requested = decodeURIComponent((req.url || "/").split("?")[0]);
    const safe = path.normalize(requested).replace(/^([.][.][/\\])+/, "");
    let file = path.join(root, safe === "/" ? "index.html" : safe);
    try { const info = await stat(file); if (info.isDirectory()) file = path.join(file, "index.html"); } catch { if (!path.extname(file)) file = path.join(root, "index.html"); }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});
server.listen(port, "0.0.0.0", () => console.log(`CONT listening on 0.0.0.0:${port}`));
