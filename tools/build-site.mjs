#!/usr/bin/env node
/**
 * tools/build-site.mjs — 把 slide 的 19 页打成可直接部署的静态站点，
 * 并从同一个页面导出 PDF。替代老的 slide/deck.html 那套发布产物。
 *
 *   node tools/build-site.mjs
 *
 * 产出：
 *   release/site/index.html   单页应用：hash 路由 #7、←/→ 翻页、触屏滑动、等比缩放
 *   release/site/assets/…     页面用到的图片（不再内嵌，走相对路径，可被浏览器缓存）
 *   release/site/<标题>.pdf   从同一份 HTML 打印（@page 1920×1080）
 *
 * 图标字体与字形表从本机 claude-slides 安装读取，不往仓库里拷字体。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const REPO = path.resolve(import.meta.dirname, "..");
const DECK = path.resolve(REPO, process.env.DECK_ROOT || "slide");
const SITE = path.join(REPO, "release/site");
const ART_ASSETS = path.join(SITE, "assets");
// 部署时的图片文件名：tools/asset-names.json 里给的那些语义名，没登记的退回 blob id
const ASSET_NAMES = (() => {
  const f = path.join(REPO, "tools/asset-names.json");
  try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return {}; }
})();

// ---------- 图标字体与字形表：优先用仓库内的 tools/assets（CI 也能用），没有再从本机安装里取 ----------
const LOCAL_FONT = path.join(REPO, "tools/assets/anthropicons.woff2");
const LOCAL_MAP = path.join(REPO, "tools/assets/anthropicons.json");

function findSkill() {
  const candidates = [
    process.env.CLAUDE_SLIDES_SKILL,
    path.join(os.homedir(), ".agents/skills/claude-slides"),
    path.join(os.homedir(), ".dsh/profiles/desktop/node_modules/dsh-claude-slides"),
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(path.join(c, "scripts/artifact.mjs"))) return c;
  const profiles = path.join(os.homedir(), ".dsh/profiles");
  if (fs.existsSync(profiles)) {
    for (const p of fs.readdirSync(profiles)) {
      const c = path.join(profiles, p, "node_modules/dsh-claude-slides");
      if (fs.existsSync(path.join(c, "scripts/artifact.mjs"))) return c;
    }
  }
  return null;
}

function iconFontAndMap() {
  if (fs.existsSync(LOCAL_FONT) && fs.existsSync(LOCAL_MAP)) {
    const b64 = fs.readFileSync(LOCAL_FONT).toString("base64");
    return { font: `data:font/woff2;base64,${b64}`, map: JSON.parse(fs.readFileSync(LOCAL_MAP, "utf8")) };
  }
  const skill = findSkill();
  if (!skill) throw new Error("没有 tools/assets/anthropicons.*，也找不到 claude-slides 安装目录。");
  const assets = path.join(skill, "scripts/editor/assets");
  const css = fs.readdirSync(assets).find((f) => /^index-.*\.css$/.test(f));
  const bundle = fs.readdirSync(assets).find((f) => /^index-.*\.js$/.test(f));
  const cssText = fs.readFileSync(path.join(assets, css), "utf8");
  const m = /font-family:\s*Anthropicons-Variable\s*;\s*src:\s*url\((data:font\/woff2;base64,[^)]+)\)/.exec(cssText);
  if (!m) throw new Error("编辑器 CSS 里没找到 Anthropicons-Variable 的 base64 字体。");
  const src = fs.readFileSync(path.join(assets, bundle), "utf8");
  const map = {};
  for (const mm of src.matchAll(/"([A-Z][A-Za-z0-9]+)":\s*(5[0-9]{4})/g)) map[mm[1]] = Number(mm[2]);
  return { font: m[1], map };
}

// ---------- 读 deck ----------
const deck = JSON.parse(fs.readFileSync(path.join(DECK, "project/deck.json"), "utf8"));
const order = deck.order;
if (!Array.isArray(order) || !order.length) throw new Error("deck.json 的 order 是空的");
const title = deck.title || "AI 时代的机遇和挑战";

// ---------- 图片：拷到 release/site/assets 并把 /_blob/<id> 换成相对路径 ----------
fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(ART_ASSETS, { recursive: true });
const blobDir = path.join(DECK, "project/assets");
const blobFiles = new Map();          // blobId -> 部署后的文件名
const MAXW = 2400;
if (fs.existsSync(blobDir)) {
  for (const f of fs.readdirSync(blobDir)) {
    const m = /^([0-9a-f]{32})\.(\w+)$/.exec(f);
    if (!m) continue;
    const src = path.join(blobDir, f);
    let meta;
    try { meta = await sharp(src).metadata(); } catch { meta = null; }
    if (!meta) {                        // 非图片（理论上不会有）直接拷
      blobFiles.set(m[1], f);
      fs.copyFileSync(src, path.join(ART_ASSETS, f));
      continue;
    }
    // 版式按 1920×1080 排版，最长边 2400 已经够（2 倍屏余量）
    let img = sharp(src);
    if (meta.width > MAXW) img = img.resize({ width: MAXW, withoutEnlargement: true });
    const stem = ASSET_NAMES[m[1]] || m[1];
    const outName = meta.hasAlpha ? `${stem}.png` : `${stem}.jpg`;
    const buf = meta.hasAlpha
      ? await img.png({ compressionLevel: 9 }).toBuffer()
      : await img.flatten({ background: "#F7F8F5" }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(ART_ASSETS, outName), buf);
    blobFiles.set(m[1], outName);
  }
}

function slideHtml(id) {
  const file = path.join(DECK, "project/slides", `${id}.html`);
  let html = fs.readFileSync(file, "utf8").trim();
  html = html.replace(/\/_blob\/([0-9a-f]{32})/g, (all, blob) => {
    const f = blobFiles.get(blob);
    if (!f) throw new Error(`第 ${id} 页引用了不存在的图片 ${blob}`);
    return `assets/${f}`;
  });
  return `<div class="page" data-id="${id}">${html}</div>`;
}

const { font: iconFont, map: iconMap } = iconFontAndMap();
const pages = order.map(slideHtml).join("\n");

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0B3A29">
<title>${title}</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTQiIGZpbGw9IiNERkYxRTYiLz48cmVjdCB4PSI5IiB5PSIxNSIgd2lkdGg9IjQ2IiBoZWlnaHQ9IjM0IiByeD0iNyIgZmlsbD0iI0Y3RjhGNSIgc3Ryb2tlPSIjMEIzQTI5IiBzdHJva2Utd2lkdGg9IjYiLz48cGF0aCBkPSJNMjUgMjdsNiA1LTYgNS02LTV6IiBmaWxsPSIjMEIzQTI5Ii8+PHBhdGggZD0iTTQwIDI3bDYgNS02IDUtNi01eiIgZmlsbD0iIzBCM0EyOSIvPjwvc3ZnPg==">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;800&display=swap">
<style>
@font-face{font-family:'AnthropiconsFZ';src:url(${iconFont}) format('woff2');font-weight:400 700;font-display:block}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{margin:0;height:100%;background:#0B3A29;overflow:hidden;
  font-family:'Noto Sans SC','PingFang SC','Hiragino Sans GB','Source Han Sans SC',system-ui,sans-serif;
  -webkit-text-size-adjust:100%}
#stage{position:fixed;left:0;right:0;top:0;bottom:56px;display:flex;align-items:center;justify-content:center}
#canvas{width:1920px;height:1080px;transform-origin:center center;flex:none}
.page{display:none;position:relative;width:1920px;height:1080px;overflow:hidden}
.page.on{display:block}
.page>section{width:1920px;height:1080px}
x-icon{display:inline-flex;align-items:center;justify-content:center;font-family:'AnthropiconsFZ',sans-serif;
  font-style:normal;font-weight:400;line-height:1;font-variant-ligatures:none;overflow:hidden}
.ui{position:fixed;left:0;right:0;bottom:0;padding:14px 20px;display:flex;align-items:center;gap:16px;
  color:#E8EFEA;font-size:13px;letter-spacing:.04em;pointer-events:none;
  background:linear-gradient(to top,rgba(11,58,41,.55),rgba(11,58,41,0))}
.ui .spacer{flex:1}
.ui button{pointer-events:auto;appearance:none;border:1px solid rgba(232,239,234,.35);background:rgba(11,58,41,.35);
  color:#E8EFEA;font:inherit;padding:6px 14px;border-radius:999px;cursor:pointer}
.ui button:hover{background:rgba(255,255,255,.12)}
.hint{opacity:.55}
#overview{position:fixed;inset:0;z-index:9;background:#0B3A29;padding:26px 26px 80px;overflow:auto}
#overview.hidden{display:none}
#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.thumb{appearance:none;border:0;padding:0;background:transparent;cursor:pointer;text-align:left;position:relative;display:block}
.thumb-frame{width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:10px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.35)}
.thumb-inner{width:1920px;height:1080px;transform-origin:top left;pointer-events:none}
.thumb-cap{display:block;margin-top:6px;color:#CBD9D0;font-size:12px;letter-spacing:.06em}
.thumb:hover .thumb-frame{outline:2px solid #7FE3AE}
#ov-hint{margin:0 0 16px;color:#CBD9D0;font-size:13px;letter-spacing:.06em}
@media print{
  @page{size:1920px 1080px;margin:0}
  html,body{background:#fff;overflow:visible;height:auto}
  #stage{position:static;display:block;bottom:auto}
  #canvas{transform:none!important;width:1920px;height:auto}
  .page{display:block!important;break-after:page;page-break-after:always}
  .page>section{break-inside:avoid}
  .ui{display:none!important}
  #overview{display:none!important}
}
</style>
</head>
<body>
<div id="stage"><div id="canvas">
${pages}
</div></div>
<div id="overview" class="hidden"><p id="ov-hint"></p><div id="grid"></div></div>
<div class="ui">
  <span id="pos">1 / ${order.length}</span>
  <span class="spacer"></span>
  <span class="hint">← → / 滚轮 翻页 · 数字跳页 · Esc 总览</span>
  <button id="overview-btn" type="button">总览</button>
  <button id="prev" type="button">上一页</button>
  <button id="next" type="button">下一页</button>
</div>
<script>
const CP = ${JSON.stringify(iconMap)};
for (const el of document.querySelectorAll('x-icon')) {
  const name = el.getAttribute('name') || '';
  el.textContent = String.fromCodePoint(CP[name] || 0xE000);
  const h = el.style.height || '24px';
  el.style.fontSize = h;               // 字形按 em 框缩放，和编辑器一致
  if (!el.style.width) el.style.width = h;
}
const pages = [...document.querySelectorAll('.page')];
const canvas = document.getElementById('canvas');
const pos = document.getElementById('pos');
let cur = 0;
const clamp = (n) => Math.max(0, Math.min(pages.length - 1, n));
const stage = document.getElementById('stage');
function fit() {
  const s = Math.min(stage.clientWidth / 1920, stage.clientHeight / 1080);
  canvas.style.transform = 'scale(' + s + ')';
}
function show(n, push) {
  cur = clamp(n);
  pages.forEach((p, i) => p.classList.toggle('on', i === cur));
  pos.textContent = (cur + 1) + ' / ' + pages.length;
  if (push !== false) history.replaceState(null, '', '#' + (cur + 1));
}
addEventListener('resize', fit);
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === 'ArrowRight' || k === 'ArrowDown' || k === ' ' || k === 'PageDown') { e.preventDefault(); show(cur + 1); }
  else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); show(cur - 1); }
  else if (k === 'Home') show(0);
  else if (k === 'End') show(pages.length - 1);
  else if (/^[1-9]$/.test(k)) show((+k - 1));
});
document.getElementById('next').addEventListener('click', () => show(cur + 1));
document.getElementById('prev').addEventListener('click', () => show(cur - 1));
// 点屏幕左右三分之一翻页
addEventListener('click', (e) => {
  if (e.target.closest('.ui')) return;
  if (e.clientX > innerWidth * 0.62) show(cur + 1);
  else if (e.clientX < innerWidth * 0.38) show(cur - 1);
});
// 触屏滑动
let sx = 0, sy = 0;
addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
}, { passive: true });
// 滚轮翻页（节流，避免一次手势跳多页）
let wheelAt = 0;
addEventListener('wheel', (e) => {
  if (!overview.classList.contains('hidden')) return;
  const now = Date.now();
  if (now - wheelAt < 450 || Math.abs(e.deltaY) < 8) return;
  wheelAt = now;
  show(cur + (e.deltaY > 0 ? 1 : -1));
}, { passive: true });

// 总览：把所有页克隆成缩略图网格
const overview = document.getElementById('overview');
const grid = document.getElementById('grid');
let built = false;
function thumbScale() {
  const w = grid.firstElementChild?.getBoundingClientRect().width || 280;
  return w / 1920;
}
function scaleThumbs() {
  const s = thumbScale();
  for (const el of grid.querySelectorAll('.thumb-inner')) el.style.transform = 'scale(' + s + ')';
}
function buildOverview() {
  if (built) return;
  built = true;
  pages.forEach((page, i) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'thumb';
    const frame = document.createElement('div'); frame.className = 'thumb-frame';
    const inner = document.createElement('div'); inner.className = 'thumb-inner';
    const clone = page.querySelector('section').cloneNode(true);
    clone.removeAttribute('id');
    inner.appendChild(clone); frame.appendChild(inner);
    const cap = document.createElement('span'); cap.className = 'thumb-cap';
    cap.textContent = (i + 1) + ' / ' + pages.length;
    btn.appendChild(frame); btn.appendChild(cap);
    btn.addEventListener('click', () => { toggleOverview(false); show(i); });
    grid.appendChild(btn);
  });
  scaleThumbs();
  document.getElementById('ov-hint').textContent = '共 ' + pages.length + ' 页 · 点击缩略图跳转 · Esc 或点空白处关闭';
}
function toggleOverview(force) {
  const on = force === undefined ? overview.classList.contains('hidden') : force;
  if (on) buildOverview();
  overview.classList.toggle('hidden', !on);
  if (on) { scaleThumbs(); grid.querySelectorAll('.thumb')[cur]?.scrollIntoView({ block: 'center' }); }
}
document.getElementById('overview-btn').addEventListener('click', () => toggleOverview());
addEventListener('resize', () => { if (!overview.classList.contains('hidden')) scaleThumbs(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overview.classList.contains('hidden')) toggleOverview(false); });
overview.addEventListener('click', (e) => { if (e.target === overview) toggleOverview(false); });

fit();
show((parseInt(location.hash.replace('#', ''), 10) || 1) - 1);
addEventListener('hashchange', () => show((parseInt(location.hash.replace('#', ''), 10) || 1) - 1, false));
</script>
</body>
</html>`;

fs.writeFileSync(path.join(SITE, "index.html"), html);
const mb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`site -> release/site/index.html  ${mb} KB，${order.length} 页，图片 ${blobFiles.size} 张`);

// ---------- PDF：同一个页面打印 ----------
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.CHROME,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  for (const bin of ["google-chrome", "chromium", "chromium-browser"]) {
    const r = spawnSync("which", [bin], { encoding: "utf8" });
    if (r.status === 0) return r.stdout.trim();
  }
  throw new Error("找不到 Chrome；用 CHROME_PATH=/path/to/chrome 指定。");
}

const PDF = path.join(SITE, `${title}.pdf`);
const profile = path.join(REPO, ".tmp-test/chrome-profile-site");
fs.mkdirSync(profile, { recursive: true });
const r = spawnSync(findChrome(), [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--no-first-run",
  "--no-pdf-header-footer",
  "--virtual-time-budget=30000",
  `--user-data-dir=${profile}`,
  `--print-to-pdf=${PDF}`,
  "file://" + path.join(SITE, "index.html"),
], { encoding: "utf8" });

if (!fs.existsSync(PDF)) {
  console.error((r.stderr || "").slice(-800) || "PDF 打印失败");
  process.exit(1);
}
const pdfMb = (fs.statSync(PDF).size / 1048576).toFixed(2);
console.log(`pdf  -> release/site/${path.basename(PDF)}  ${pdfMb} MB`);
