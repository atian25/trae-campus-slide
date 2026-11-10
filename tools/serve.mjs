#!/usr/bin/env node
/**
 * tools/serve.mjs — 本地预览 release/site（npm run site 的产物）。
 *
 *   npm run preview                 → http://127.0.0.1:8765
 *   npm run preview -- --host 0.0.0.0 --port 9000   局域网/换端口
 *
 * 注意：claude-slides 编辑器（npm run deck:open）只能在 127.0.0.1 打开，
 * 局域网访问请用这个静态预览，或自己套 https。
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const REPO = path.resolve(import.meta.dirname, "..");
const ROOT = path.join(REPO, "release/site");
const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : dflt;
};
const PORT = Number(arg("port", process.env.PORT || 8765));
const HOST = arg("host", process.env.HOST || "127.0.0.1");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

if (!fs.existsSync(path.join(ROOT, "index.html"))) {
  console.error("release/site/index.html 不存在，先跑 npm run site");
  process.exit(1);
}

http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    let file = path.join(ROOT, url === "/" ? "index.html" : url);
    if (!path.resolve(file).startsWith(ROOT)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    fs.readFile(file, (err, buf) => {
      if (err) {
        // 视觉上更友好：未知路径回首页（hash 路由，实际不会用到）
        fs.readFile(path.join(ROOT, "index.html"), (e2, home) => {
          if (e2) return res.writeHead(404).end("not found");
          res.writeHead(200, { "content-type": MIME[".html"], "cache-control": "no-store" }).end(home);
        });
        return;
      }
      res.writeHead(200, {
        "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
        "cache-control": "no-store",
      }).end(buf);
    });
  })
  .listen(PORT, HOST, () => {
    console.log(`预览: http://${HOST}:${PORT}/   （目录 release/site，Ctrl+C 退出）`);
  });
