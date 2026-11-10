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
<meta name="theme-color" content="#EBECEA">
<title>${title}</title>
<link rel="icon" type="image/svg+xml" href="${ICON}">
<style>
@font-face{font-family:'AnthropiconsFZ';src:url(${iconFont}) format('woff2');font-weight:400 700;font-display:block}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;background:#EBECEA;
  font-family:'Noto Sans SC','PingFang SC','Hiragino Sans GB','Source Han Sans SC',system-ui,sans-serif;
  -webkit-text-size-adjust:100%}
/* ---------- 只读视图 ---------- */
#bar{position:fixed;left:0;right:0;top:0;height:52px;display:flex;align-items:center;gap:12px;padding:0 16px;
  background:#F4F5F3;border-bottom:1px solid #DDE2DE;z-index:5;font-size:13px;color:#3B463F}
#ro{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border:1px solid #CFD7D2;border-radius:999px;
  background:#fff;color:#54605A;letter-spacing:.02em}
#pos{color:#7C8A83;letter-spacing:.04em}
#bar .spacer{flex:1}
#bar a,#bar button{appearance:none;border:1px solid #CFD7D2;background:#fff;color:#26302B;font:inherit;
  padding:6px 13px;border-radius:999px;cursor:pointer;text-decoration:none}
#bar a:hover,#bar button:hover{background:#EDF3EF;border-color:#B9C7BF}
#present{background:#0B3A29;color:#EAF3ED;border-color:#0B3A29}
#present:hover{background:#123B29}
#stage{position:fixed;left:0;right:0;top:52px;bottom:150px;display:flex;align-items:center;justify-content:center;
  background:#EBECEA;transition:background .2s}
#canvas{width:1920px;height:1080px;transform-origin:center center;flex:none;position:relative;
  box-shadow:0 4px 28px rgba(20,40,30,.13);background:#F7F8F5}
#rail{position:fixed;left:0;right:0;bottom:0;height:150px;display:flex;align-items:center;gap:10px;
  padding:0 14px 0 8px;background:#F4F5F3;border-top:1px solid #DDE2DE;z-index:5}
#rail-track{display:flex;gap:10px;overflow-x:auto;scrollbar-width:thin;padding:12px 4px;flex:1;align-items:center}
#rail-track::-webkit-scrollbar{height:8px}
#rail-track::-webkit-scrollbar-thumb{background:#C9D3CC;border-radius:4px}
.thumb{appearance:none;border:0;padding:0;background:transparent;cursor:pointer;flex:none;display:block;text-align:left}
.thumb-frame{width:184px;aspect-ratio:16/9;overflow:hidden;background:#fff;border-radius:6px;
  box-shadow:0 1px 4px rgba(20,40,30,.14);outline:2px solid transparent;outline-offset:2px}
.thumb-inner{width:1920px;height:1080px;transform-origin:top left;pointer-events:none}
.thumb-cap{display:block;margin-top:5px;font-size:11px;color:#8A968F;letter-spacing:.04em}
.thumb.active .thumb-frame{outline-color:#2FAE72}
.thumb.active .thumb-cap{color:#17754A}
.thumb:hover .thumb-frame{outline-color:#9FD8B8}
#rail-actions{display:flex;flex-direction:column;gap:6px;flex:none;padding:0 6px}
#rail-actions button,#rail-toggle{appearance:none;border:1px solid #CFD7D2;background:#fff;color:#3B463F;
  font:inherit;font-size:12px;padding:5px 10px;border-radius:8px;cursor:pointer}
#rail-actions button:hover{background:#EDF3EF}
#rail-toggle{flex:none;align-self:flex-start;margin-top:14px}
/* 折叠滑轨 */
body.no-rail #rail{height:0;padding:0;overflow:hidden;border-top:0}
body.no-rail #stage{bottom:0}
body.no-rail #rail-toggle{position:fixed;left:14px;bottom:14px;z-index:6;margin:0}
/* 页码/提示（只读视图里显示） */
#hint{color:#9AA69F;font-size:12px;letter-spacing:.03em}
/* ---------- 演示态 ---------- */
body.mode-present #bar,body.mode-present #rail,body.mode-present #rail-toggle{display:none}
body.mode-present #stage{top:0;bottom:0;background:#000}
body.mode-present #canvas{box-shadow:none}
/* ---------- 总览网格 ---------- */
#overview{position:fixed;inset:0;z-index:9;background:#0B0B0B;padding:26px 26px 40px;overflow:auto;display:none}
body.mode-overview #overview{display:block}
#ov-hint{margin:0 0 16px;color:rgba(255,255,255,.5);font-size:13px;letter-spacing:.06em}
#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
#grid .thumb-frame{width:100%;aspect-ratio:16/9;box-shadow:0 2px 12px rgba(0,0,0,.6)}
#grid .thumb-cap{color:rgba(255,255,255,.45);font-size:12px}
#grid .thumb.active .thumb-frame{outline-color:#7FE3AE}
#grid .thumb.active .thumb-cap{color:#7FE3AE}
.page{display:none;position:absolute;inset:0;width:1920px;height:1080px;overflow:hidden;background:#F7F8F5}
.page.on{display:block}
.page>section{width:1920px;height:1080px}
.page.fade{animation:fade .28s ease both}
.page.push{animation:push .32s cubic-bezier(.2,.7,.2,1) both}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes push{from{opacity:.2;transform:translateX(4%)}to{opacity:1;transform:translateX(0)}}
x-icon{display:inline-flex;align-items:center;justify-content:center;font-family:'AnthropiconsFZ',sans-serif;
  font-style:normal;font-weight:400;line-height:1;font-variant-ligatures:none;overflow:hidden}
@media print{
  @page{size:1920px 1080px;margin:0}
  html,body{background:#fff;overflow:visible;height:auto}
  #bar,#rail,#rail-toggle,#overview{display:none!important}
  #stage{position:static;display:block;background:#fff;top:auto;bottom:auto}
  #canvas{transform:none!important;width:1920px;height:auto;box-shadow:none;position:static}
  .page{display:block!important;position:relative;break-after:page;page-break-after:always;animation:none!important}
}
</style>
</head>
<body>
<div id="bar">
  <span id="ro">Read-only</span>
  <span id="pos">1 / ${order.length}</span>
  <span id="hint"></span>
  <span class="spacer"></span>
  <a id="pdf" href="${encodeURIComponent(title + ".pdf")}" download>下载 PDF</a>
  <button id="present" type="button">▶ 演示</button>
</div>

<div id="stage"><div id="canvas">
${pages}
</div></div>

<div id="rail">
  <button id="rail-toggle" type="button" title="折叠/展开缩略图">收起</button>
  <div id="rail-track"></div>
  <div id="rail-actions"><button id="grid-btn" type="button" title="网格总览">总览</button></div>
</div>

<div id="overview"><p id="ov-hint"></p><div id="grid"></div></div>

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
const track = document.getElementById('rail-track');
const grid = document.getElementById('grid');
const overview = document.getElementById('overview');
let cur = 0;
let mode = 'view';            // view | present | overview
const clamp = (n) => Math.max(0, Math.min(pages.length - 1, n));

/* ---------- 缩放 ---------- */
function fit() {
  const s = Math.min(stage.clientWidth / 1920, stage.clientHeight / 1080);
  canvas.style.transform = 'scale(' + s + ')';
  scaleThumbs();
}
function scaleThumbs() {
  for (const t of track.querySelectorAll('.thumb-inner')) t.style.transform = 'scale(0.0958)';
  const first = grid.firstElementChild;
  if (first) {
    const w = first.getBoundingClientRect().width || 280;
    for (const t of grid.querySelectorAll('.thumb-inner')) t.style.transform = 'scale(' + (w / 1920) + ')';
  }
}

/* ---------- 翻页 ---------- */
function show(n, opts) {
  const o = opts || {};
  cur = clamp(n);
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
  for (const el of document.querySelectorAll('.thumb')) {
    el.classList.toggle('active', (+el.dataset.i) === cur);
  }
  document.getElementById('hint').textContent = mode === 'view' ? '滚轮 / ← → 翻页 · 点缩略图跳页' : '';
  const active = track.querySelector('.thumb.active');
  if (active && !o.noScroll) active.scrollIntoView({ inline: 'center', block: 'nearest' });
  const g = grid.querySelector('.thumb.active');
  if (g) g.scrollIntoView({ block: 'nearest' });
  if (o.push !== false) history.replaceState(null, '', '#slide-' + (cur + 1));
}

/* ---------- 缩略图（滑轨 + 网格） ---------- */
function makeThumb(i, page) {
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'thumb'; btn.dataset.i = String(i);
  const frame = document.createElement('div'); frame.className = 'thumb-frame';
  const inner = document.createElement('div'); inner.className = 'thumb-inner';
  const clone = page.querySelector('section').cloneNode(true);
  clone.removeAttribute('id');
  inner.appendChild(clone); frame.appendChild(inner);
  const cap = document.createElement('span'); cap.className = 'thumb-cap';
  cap.textContent = (i + 1) + ' / ' + pages.length;
  btn.appendChild(frame); btn.appendChild(cap);
  btn.addEventListener('click', () => { setMode('view'); show(i); });
  return btn;
}
pages.forEach((p, i) => track.appendChild(makeThumb(i, p)));
let gridBuilt = false;
function buildGrid() {
  if (gridBuilt) return;
  gridBuilt = true;
  pages.forEach((p, i) => grid.appendChild(makeThumb(i, p)));
  document.getElementById('ov-hint').textContent =
    '共 ' + pages.length + ' 页 · 点击缩略图跳转 · Esc 或点空白处关闭';
  scaleThumbs();
}

/* ---------- 模式 ---------- */
function setMode(m) {
  mode = m;
  document.body.classList.toggle('mode-present', m === 'present');
  document.body.classList.toggle('mode-overview', m === 'overview');
  if (m === 'overview') buildGrid();
  document.getElementById('hint').textContent =
    m === 'view' ? '滚轮 / ← → 翻页 · 点缩略图跳页' : '';
  requestAnimationFrame(() => { fit(); show(cur, { noScroll: true, push: false }); });
}
function enterPresent() {
  setMode('present');
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}
function exitPresent() {
  setMode('view');
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
}

/* ---------- 交互 ---------- */
document.getElementById('present').addEventListener('click', enterPresent);
document.getElementById('grid-btn').addEventListener('click', () => setMode('overview'));
const railToggle = document.getElementById('rail-toggle');
railToggle.addEventListener('click', () => {
  const collapsed = document.body.classList.toggle('no-rail');
  railToggle.textContent = collapsed ? '展开' : '收起';
  requestAnimationFrame(fit);
});
addEventListener('resize', fit);
document.addEventListener('fullscreenchange', () => requestAnimationFrame(fit));

addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === 'Escape') {
    e.preventDefault();
    if (mode === 'overview') setMode('view');
    else if (mode === 'present') exitPresent();
    else setMode('overview');
    return;
  }
  if (mode === 'overview') return;
  if (k === 'ArrowRight' || k === 'ArrowDown' || k === ' ' || k === 'PageDown') { e.preventDefault(); show(cur + 1); }
  else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); show(cur - 1); }
  else if (k === 'Home') show(0);
  else if (k === 'End') show(pages.length - 1);
  else if (/^[1-9]$/.test(k)) show(+k - 1);
});

// 滚轮翻页（节流）
let wheelAt = 0;
addEventListener('wheel', (e) => {
  if (mode !== 'view') return;
  if (e.target.closest('#rail')) return;
  const now = Date.now();
  if (now - wheelAt < 450 || Math.abs(e.deltaY) < 8) return;
  wheelAt = now;
  show(cur + (e.deltaY > 0 ? 1 : -1));
}, { passive: true });

// 点画面左右两侧翻页（只读视图与演示态都支持）
addEventListener('click', (e) => {
  if (mode === 'overview') { if (e.target === overview) setMode('view'); return; }
  if (e.target.closest('#bar') || e.target.closest('#rail') || e.target.closest('a')) return;
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

fit();
const fromHash = parseInt((location.hash.match(/(\\d+)$/) || [])[1], 10);
show(Number.isFinite(fromHash) ? fromHash - 1 : 0);
addEventListener('hashchange', () => {
  const n = parseInt((location.hash.match(/(\\d+)$/) || [])[1], 10);
  if (Number.isFinite(n)) show(n - 1, { noScroll: true });
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
