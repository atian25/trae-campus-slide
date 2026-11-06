/**
 * 导出 PDF（高画质）：先构建 --hq 单文件版，再用 Chrome DevTools 协议打印成 1600×900 的 PDF。
 * 用法：node slide/pdf.mjs   （等价于 npm run pdf）
 */
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "release", "_pdf", "index.html");
const OUT = path.join(ROOT, "release", "AI 时代的机遇和挑战：今天的学生，如何走向明天的世界.pdf");
// 本机是 macOS 的 Chrome，CI 里是 Ubuntu 的 google-chrome，优先用 CHROME_PATH 指定
const candidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/opt/google/chrome/chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const CHROME = candidates.find((p) => existsSync(p));
if (!CHROME) {
  console.error("找不到 Chrome，候选路径都不存在：", candidates.join(", "));
  process.exit(1);
}
console.log("chrome:", CHROME);

// 1) 高画质构建
const build = spawnSync(process.execPath, [path.join(ROOT, "slide", "build.ts"), "--hq"], { stdio: "inherit" });
if (build.status !== 0) process.exit(build.status ?? 1);

// 2) 起一个带调试端口的无头 Chrome
const profile = mkdtempSync(path.join(tmpdir(), "deck-pdf-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--no-sandbox", "--hide-scrollbars", "--disable-gpu",
  "--disable-dev-shm-usage", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=0", "--user-data-dir=" + profile,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
chrome.on("error", (e) => { console.error("Chrome 启动失败：", e); process.exit(1); });
let chromeErr = "";
chrome.stderr.on("data", (d) => { chromeErr += d.toString(); });

const wsUrl = await new Promise((resolve, reject) => {
  let buf = "";
  const timer = setTimeout(() => reject(new Error("Chrome 启动超时")), 60000);
  chrome.stderr.on("data", (d) => {
    buf += d.toString();
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) { clearTimeout(timer); resolve(m[1]); }
  });
  chrome.on("exit", () => reject(new Error("Chrome 提前退出")));
});

// 3) 连上页面，打印 PDF（先解析端口，取 page 目标；浏览器级端点不能直接打印）
const port = new URL(wsUrl).port;
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = targets.find((t) => t.type === "page");
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
await new Promise((r) => { ws.onopen = r; });
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Page.enable");
await send("Page.navigate", { url: "file://" + SRC + "?clean" });

// 等页面和所有内嵌图片真正就绪，CI 机器比本机慢
const deadline = Date.now() + 60000;
for (;;) {
  const st = await send("Runtime.evaluate", {
    expression: "document.readyState === 'complete' && [...document.images].every(i => i.complete && i.naturalWidth > 0)",
    returnByValue: true,
  });
  if (st.result?.result?.value === true) break;
  if (Date.now() > deadline) throw new Error("页面加载超时");
  await new Promise((r) => setTimeout(r, 500));
}
await send("Emulation.setEmulatedMedia", { media: "print" });
await new Promise((r) => setTimeout(r, 1500));

console.log("printing pdf ...");
const pdf = await send("Page.printToPDF", {
  printBackground: true,
  preferCSSPageSize: true,
  paperWidth: 1600 / 96,
  paperHeight: 900 / 96,
  marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
});
if (pdf.error || !pdf.result?.data) {
  console.error("printToPDF 失败：", JSON.stringify(pdf).slice(0, 800));
  console.error("chrome stderr:", chromeErr.slice(-1500));
  process.exit(1);
}
const buf = Buffer.from(pdf.result.data, "base64");
writeFileSync(OUT, buf);

// 同时放一份进站点目录，部署后可以用中文文件名在线看/下载
const SITE_DIR = path.join(ROOT, "release", "site");
mkdirSync(SITE_DIR, { recursive: true });
copyFileSync(OUT, path.join(SITE_DIR, path.basename(OUT)));
console.log(`pdf -> ${path.relative(ROOT, OUT)}  ${(buf.length / 1024 / 1024).toFixed(2)} MB`);

// 4) 收尾（Chrome 可能还在写临时目录，删不掉不算失败）
ws.close();
chrome.kill();
await new Promise((r) => { chrome.once("close", r); setTimeout(r, 3000); });
try {
  rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
} catch { /* 临时目录留着无妨 */ }
rmSync(path.join(ROOT, "release", "_pdf"), { recursive: true, force: true });
