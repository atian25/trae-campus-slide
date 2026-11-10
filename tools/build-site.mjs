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

const ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTQiIGZpbGw9IiNERkYxRTYiLz48cmVjdCB4PSI5IiB5PSIxNSIgd2lkdGg9IjQ2IiBoZWlnaHQ9IjM0IiByeD0iNyIgZmlsbD0iI0Y3RjhGNSIgc3Ryb2tlPSIjMEIzQTI5IiBzdHJva2Utd2lkdGg9IjYiLz48cGF0aCBkPSJNMjUgMjdsNiA1LTYgNS02LTV6IiBmaWxsPSIjMEIzQTI5Ii8+PHBhdGggZD0iTTQwIDI3bDYgNS02IDUtNi01eiIgZmlsbD0iIzBCM0EyOSIvPjwvc3ZnPg==';
const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#000000">
<title>${title}</title>
<link rel="icon" type="image/svg+xml" href="${ICON}">
<style>
@font-face{font-family:'AnthropiconsFZ';src:url(${iconFont}) format('woff2');font-weight:400 700;font-display:block}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#000;overflow:hidden;
  font-family:'Noto Sans SC','PingFang SC','Hiragino Sans GB','Source Han Sans SC',system-ui,sans-serif;
  -webkit-text-size-adjust:100%;cursor:default}
/* 演示态：整页只有一个居中的 1920×1080 画布，四周黑色 letterbox（与 claude-slides 的 present 一致） */
#stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center}
#canvas{width:1920px;height:1080px;transform-origin:center center;flex:none;position:relative}
.page{display:none;position:absolute;inset:0;width:1920px;height:1080px;overflow:hidden;background:#F7F8F5}
.page.on{display:block}
.page>section{width:1920px;height:1080px}
.page.fade{animation:fade .28s ease both}
.page.push{animation:push .32s cubic-bezier(.2,.7,.2,1) both}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes push{from{opacity:.2;transform:translateX(4%)}to{opacity:1;transform:translateX(0)}}
x-icon{display:inline-flex;align-items:center;justify-content:center;font-family:'AnthropiconsFZ',sans-serif;
  font-style:normal;font-weight:400;line-height:1;font-variant-ligatures:none;overflow:hidden}
/* 页码：平时隐形，动鼠标时淡入，和旧版那条绿底控制栏不同 */
#pos{position:fixed;right:22px;bottom:16px;color:rgba(255,255,255,.62);font-size:13px;letter-spacing:.08em;
  opacity:0;transition:opacity .4s;pointer-events:none}
#pos.show{opacity:1}
/* 总览：深色缩略图网格，Esc / o 切换 */
#overview{position:fixed;inset:0;z-index:9;background:#0B0B0B;padding:26px 26px 40px;overflow:auto}
#overview.hidden{display:none}
#ov-hint{margin:0 0 16px;color:rgba(255,255,255,.5);font-size:13px;letter-spacing:.06em}
#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.thumb{appearance:none;border:0;padding:0;background:transparent;cursor:pointer;text-align:left;display:block}
.thumb-frame{width:100%;aspect-ratio:16/9;overflow:hidden;background:#111;box-shadow:0 2px 12px rgba(0,0,0,.6)}
.thumb-inner{width:1920px;height:1080px;transform-origin:top left;pointer-events:none}
.thumb-cap{display:block;margin-top:6px;color:rgba(255,255,255,.45);font-size:12px}
.thumb:hover .thumb-frame,.thumb:focus-visible .thumb-frame{outline:2px solid #7FE3AE;outline-offset:2px}
@media print{
  @page{size:1920px 1080px;margin:0}
  html,body{background:#fff;overflow:visible;height:auto}
  #stage{position:static;display:block}
  #canvas{transform:none!important;width:1920px;height:auto;position:static}
  .page{display:block!important;position:relative;break-after:page;page-break-after:always;animation:none!important}
  #overview,#pos{display:none!important}
}
</style>
</head>
<body>
<div id="stage"><div id="canvas">
${pages}
</div></div>
<p id="pos"></p>
<div id="overview" class="hidden"><p id="ov-hint"></p><div id="grid"></div></div>
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
const stage = document.getElementById('stage');
const pos = document.getElementById('pos');
const overview = document.getElementById('overview');
const grid = document.getElementById('grid');
let cur = 0;

const clamp = (n) => Math.max(0, Math.min(pages.length - 1, n));
function fit() {
  const s = Math.min(stage.clientWidth / 1920, stage.clientHeight / 1080);
  canvas.style.transform = 'scale(' + s + ')';
}
function show(n, push) {
  const next = clamp(n);
  if (next === cur && pages[cur].classList.contains('on')) return;
  const dir = next > cur ? 'push' : 'push';
  cur = next;
  pages.forEach((p, i) => {
    const on = i === cur;
    p.classList.toggle('on', on);
    p.classList.remove('fade', 'push');
    if (on) {
      const tr = p.dataset.transition || '';
      if (tr === 'fade') p.classList.add('fade');
      else if (tr === 'push') p.classList.add('push');
    }
  });
  pos.textContent = (cur + 1) + ' / ' + pages.length;
  if (push !== false) history.replaceState(null, '', '#slide-' + (cur + 1));
}

// 页码只在动鼠标时淡入
let hideTimer = 0;
function revealPos() {
  pos.classList.add('show');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => pos.classList.remove('show'), 1500);
}
addEventListener('mousemove', revealPos);
addEventListener('resize', fit);

// —— 总览 ——
let built = false;
function scaleThumbs() {
  const el = grid.firstElementChild;
  const w = el ? el.getBoundingClientRect().width : 280;
  for (const t of grid.querySelectorAll('.thumb-inner')) t.style.transform = 'scale(' + (w / 1920) + ')';
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
  document.getElementById('ov-hint').textContent =
    '共 ' + pages.length + ' 页 · 点击缩略图跳转 · Esc 或点空白处关闭';
  scaleThumbs();
}
function toggleOverview(force) {
  const on = force === undefined ? overview.classList.contains('hidden') : force;
  if (on) buildOverview();
  overview.classList.toggle('hidden', !on);
  if (on) { scaleThumbs(); grid.querySelectorAll('.thumb')[cur]?.scrollIntoView({ block: 'center' }); }
  else { revealPos(); }
}

// —— 交互：键位与 claude-slides 的 present 一致（← → 翻页，Esc 退出/总览） ——
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  const inOverview = !overview.classList.contains('hidden');
  if (k === 'Escape') { e.preventDefault(); toggleOverview(!inOverview); return; }
  if (inOverview) return;
  if (k === 'ArrowRight' || k === 'ArrowDown' || k === ' ' || k === 'PageDown') { e.preventDefault(); show(cur + 1); }
  else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); show(cur - 1); }
  else if (k === 'Home') show(0);
  else if (k === 'End') show(pages.length - 1);
  else if (k === 'o' || k === 'O') toggleOverview(true);
  else if (/^[1-9]$/.test(k)) show(+k - 1);
});
// 点屏幕左右两侧翻页（演示时没有可见控件）
addEventListener('click', (e) => {
  if (!overview.classList.contains('hidden')) {
    if (e.target === overview) toggleOverview(false);
    return;
  }
  if (e.target.closest('.thumb')) return;
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
document.addEventListener('fullscreenchange', fit);

fit();
const fromHash = parseInt((location.hash.match(/(\\d+)$/) || [])[1], 10);
show(Number.isFinite(fromHash) ? fromHash - 1 : 0);
addEventListener('hashchange', () => {
  const n = parseInt((location.hash.match(/(\\d+)$/) || [])[1], 10);
  if (Number.isFinite(n)) show(n - 1, false);
});
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
