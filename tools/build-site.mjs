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
// ---------- 构建前语义守卫：防止把「编辑器吃掉声明」的版本发上线 ----------
if (!process.argv.includes("--no-guard")) {
  const { spawnSync } = await import("node:child_process");
  const g = spawnSync("node", [path.join(REPO, "tools/guard-slides.mjs")], { cwd: REPO, encoding: "utf8" });
  if (g.status !== 0) {
    console.error("\n⛔ 构建中止：slide 有语义丢失（编辑器重写可能吃掉了声明）");
    console.error((g.stdout || "").split("\n").filter((l) => l.trim()).slice(-14).join("\n"));
    console.error("\n  修好后再构建；确认是误报可加 --no-guard\n");
    process.exit(1);
  }
}

const deck = JSON.parse(fs.readFileSync(path.join(DECK, "project/deck.json"), "utf8"));
const order = deck.order;
if (!Array.isArray(order) || !order.length) throw new Error("deck.json 的 order 是空的");
const title = deck.title || "AI 时代的机遇和挑战";
const PDF_URL = encodeURI(`${title}.pdf`);   // 与构建产出的 PDF 同名，浏览器内联打开

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

function slideHtml(id, eager) {
  const file = path.join(DECK, "project/slides", `${id}.html`);
  let html = fs.readFileSync(file, "utf8").trim();
  html = html.replace(/\/_blob\/([0-9a-f]{32})/g, (all, blob) => {
    const f = blobFiles.get(blob);
    if (!f) throw new Error(`第 ${id} 页引用了不存在的图片 ${blob}`);
    return `assets/${f}`;
  });
  // 图片懒加载：首屏页保持即时加载，其余页 loading=lazy（不会阻塞首屏）
  html = html.replace(/<img\b(?![^>]*\bloading=)/g,
    eager ? '<img decoding="async"' : '<img loading="lazy" decoding="async"');
  // 外链一律新窗口打开，避免把演示页面顶掉
  html = html.replace(/<a href="(https?:[^"]+)"/g, '<a target="_blank" rel="noopener noreferrer" href="$1"');
  const ZOOM_PAGES = ['ai-digital', 'ai-physical', 'learn-1', 'learn-2'];
  if (ZOOM_PAGES.includes(id)) html = html.replace(/<img\b/g, '<img data-zoom');
  // 所有链接在新窗口打开
  html = html.replace(/<a\s+(?![^>]*\btarget=)/g, '<a target="_blank" rel="noopener noreferrer" ');
  const tr = (html.match(/<section[^>]*\sdata-transition="([a-z]+)"/) || [])[1];
  const trAttr = tr ? ` data-transition="${tr}"` : "";
  return `<div class="slide" data-id="${id}"${trAttr}><div class="fit">${html}</div></div>`;
}

const { font: iconFont, map: iconMap } = iconFontAndMap();

/** 编辑器里「隐藏」的页（<section ... hidden>）不进站点 / PDF */
function isHidden(id) {
  const file = path.join(DECK, "project/slides", `${id}.html`);
  const html = fs.readFileSync(file, "utf8");
  const tag = (html.match(/<section\b([^>]*)>/) || [])[1] || "";
  // 只看属性区，避免把 style 里的 overflow:hidden 当成隐藏标记
  const attrs = tag.replace(/style="[^"]*"/g, "");
  return /(^|\s)hidden(\s|=|$)/.test(attrs);
}
const visibleOrder = order.filter((id) => !isHidden(id));
const pages = visibleOrder.map((id, i) => slideHtml(id, i === 0)).join("\n");
const pageCount = visibleOrder.length;
if (!pageCount) throw new Error("所有页都被隐藏了");

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
html{background:#f7f8f5;color-scheme:light}
body{margin:0;background:#000;overflow:visible}
/* ===== 幻灯片 ===== */
.slide{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
.fit{width:1920px;height:1080px;flex:none;transform-origin:center center;position:relative}
.fit > section,.th-inner > section{width:1920px;height:1080px;display:block}
/* ===== 舞台模式（横屏 / 桌面，默认）：一屏一页 ===== */
html.stage #deck{position:fixed;left:0;right:0;top:0;height:100vh;height:100dvh}
html.stage .slide{position:absolute;inset:0;opacity:0;pointer-events:none;transition:opacity .32s ease}
html.stage .slide.on{opacity:1;pointer-events:auto;z-index:1}
html.stage .slide.t-fade.on{animation:d-fade .3s ease both}
html.stage .slide.t-push.on{animation:d-push .34s cubic-bezier(.2,.7,.2,1) both}
html.stage .slide.t-magic.on{animation:d-magic .42s ease both}
@keyframes d-fade{from{opacity:0}to{opacity:1}}
@keyframes d-push{from{opacity:.2;transform:translateX(4%)}to{opacity:1;transform:translateX(0)}}
@keyframes d-magic{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:scale(1)}}
/* build-in 入场动画 */
@keyframes bi-fade{from{opacity:0}to{opacity:1}}
@keyframes bi-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes bi-pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
/* ===== 文档模式（竖屏 / 手机）：纵向滚动，一页一屏 ===== */
html.doc{overflow:hidden auto;scroll-snap-type:y mandatory;scrollbar-width:none}
html.doc::-webkit-scrollbar{display:none}
html.doc .slide{height:100vh;height:100dvh;scroll-snap-align:start;scroll-snap-stop:always}
/* ===== 页码胶囊（右下角，翻页淡入 1.6s）===== */
/* ===== 底部控制条（参考 skill 演示态）===== */
.bar{position:fixed;z-index:6;right:14px;bottom:4px;
  display:flex;flex-direction:row;align-items:center;gap:1px;height:28px;padding:0 2px;
  background:transparent;transition:opacity .3s}
.bar[data-quiet]{opacity:0;pointer-events:none}
.bar button{appearance:none;border:0;background:transparent;color:rgba(23,117,74,.5);
  width:calc(26px * var(--bs, 1));height:calc(26px * var(--bs, 1));border-radius:999px;display:flex;align-items:center;justify-content:center;
  cursor:pointer;padding:0;transition:background .18s,color .18s}
.bar button:hover{background:rgba(11,74,50,.08);color:#17754a}
.bar button svg{width:calc(15px * var(--bs, 1));height:calc(15px * var(--bs, 1));display:block}
.bar a.ic{appearance:none;border:0;background:transparent;color:rgba(23,117,74,.5);
  width:calc(26px * var(--bs, 1));height:calc(26px * var(--bs, 1));border-radius:999px;display:flex;align-items:center;justify-content:center;
  cursor:pointer;padding:0;transition:background .18s,color .18s;text-decoration:none}
.bar a.ic:hover{background:rgba(11,74,50,.08);color:#17754a}
.bar a.ic svg{width:calc(15px * var(--bs, 1));height:calc(15px * var(--bs, 1));display:block}
.bar a.ic:focus-visible{outline:2px solid #2fae72;outline-offset:2px}
.ovl-links{margin-left:auto;display:flex;flex-direction:row;gap:18px;align-items:center}
.ovl-links a{color:rgba(255,255,255,.62);text-decoration:none;font:13px/1 system-ui,sans-serif;letter-spacing:.02em}
.ovl-links a:hover{color:#7fe3ae}
.bar button:focus{outline:none}
.bar button:focus-visible{outline:2px solid #2fae72;outline-offset:2px}
.bar .num{min-width:46px;text-align:center;color:rgba(23,117,74,.5);
  font:11px/1 system-ui,-apple-system,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:.06em}
.bar .sep{width:1px;height:12px;background:rgba(23,117,74,.16);margin:0 4px}
.tips{position:fixed;z-index:6;right:14px;bottom:44px;
  padding:9px 13px;border-radius:10px;background:rgba(255,255,255,.97);border:1px solid #e2e6e1;
  color:#3b463f;font:12px/1.85 system-ui,-apple-system,sans-serif;white-space:nowrap;
  box-shadow:0 4px 14px rgba(20,28,24,.08);display:none}
.tips[data-on]{display:block}
.tips b{color:#0b4a32;font-weight:700;margin-right:6px}
/* ===== 图片放大 ===== */
.lb-mask{position:fixed;inset:0;z-index:29;background:rgba(16,22,19,.72);backdrop-filter:blur(3px);display:none}
.lb-mask[data-on]{display:block}
.lightbox{position:fixed;inset:0;z-index:30;background:transparent;display:none;
  align-items:center;justify-content:center;padding:24px;cursor:zoom-out}
.lightbox[data-on]{display:flex}
.lightbox img{max-width:92vw;max-height:88vh;width:auto;height:auto;object-fit:contain;
  border-radius:12px;box-shadow:0 16px 50px rgba(0,0,0,.4)}
.lightbox .lb-video{display:none;max-width:92vw;max-height:88vh;border-radius:12px;box-shadow:0 16px 50px rgba(0,0,0,.45)}

/* ===== 视频 ===== */
.slide video{display:block}
.slide a{text-decoration:none!important}
.slide a:hover{text-decoration:underline!important}
.slide aside{display:none!important}   /* skill 的演讲者备注，不画在幻灯片上 */

/* ===== 演讲者窗口 ===== */
body.pv{background:#0d1210;color:#e8eee9;display:flex;height:100vh;overflow:hidden}
body.pv > #deck,body.pv > .bar,body.pv > .tips,body.pv > .lb-mask,body.pv > .lightbox{display:none!important}
body.pv .pv-main{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;padding:14px;overflow:hidden}
body.pv .pv-frame{width:100%;height:100%;border:0;background:#fff;border-radius:10px}
body.pv .pv-main .fit{box-shadow:0 10px 40px rgba(0,0,0,.5)}
body.pv .pv-side{width:300px;flex:0 0 auto;box-sizing:border-box;padding:18px;display:flex;flex-direction:column;gap:16px;background:#131a16}
body.pv .pv-side h2{font:600 12px/1.6 system-ui,sans-serif;letter-spacing:.12em;color:#7f8f86;margin:0}
body.pv .pv-next{width:100%;aspect-ratio:16/9;border:0;border-radius:8px;background:#0a0e0c;display:block}
body.embed .bar,body.embed .lb-mask,body.embed .lightbox{display:none!important}
body.pv .pv-timer{font:700 34px/1 system-ui,sans-serif;font-variant-numeric:tabular-nums;color:#7fe3ae}
body.pv .pv-notes{font:13px/1.85 system-ui,sans-serif;color:#cfe0d5;max-height:180px;overflow:auto;white-space:pre-wrap}
body.pv .pv-hint{font:12px/1.9 system-ui,sans-serif;color:#7f8f86;margin:0}
body.pv .pv-hint b{color:#cfe0d5;font-weight:600;margin-right:4px}

/* ===== 概览（o 键 / 点右下角页码）===== */
.ovl{position:fixed;inset:0;z-index:20;background:#000;padding:24px 24px 40px;overflow:auto;display:none}
.ovl.on{display:block}
.ovl-tools{display:flex;flex-direction:row;align-items:center;gap:14px;margin:0 0 16px;color:rgba(255,255,255,.55);font:13px/1.4 system-ui,sans-serif}
.ovl-tools input[type=range]{width:180px;accent-color:#2fae72}
.ovl-tools b{color:rgba(255,255,255,.8);font-weight:600}
.ovl-hint{margin:0;color:rgba(255,255,255,.55);font:13px/1.4 system-ui,sans-serif;letter-spacing:.04em;line-height:1}
.ovl-tools>span{line-height:1}
.ovl-tools input[type=range]{margin:0;vertical-align:middle}
.ovl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
.th{appearance:none;border:0;padding:0;background:transparent;cursor:pointer;text-align:left;display:block}
.th-frame{width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:6px;background:#111;
  box-shadow:0 2px 10px rgba(0,0,0,.6);outline:2px solid transparent;outline-offset:2px}
.th-inner{width:1920px;height:1080px;transform-origin:top left;pointer-events:none}
.th-cap{display:block;margin-top:6px;font:11px/1.4 system-ui,sans-serif;color:rgba(255,255,255,.5)}
.th.active .th-frame{outline-color:#2fae72}
.th:hover .th-frame{outline-color:rgba(127,227,174,.8)}
x-icon{display:inline-flex;align-items:center;justify-content:center;font-family:'AnthropiconsFZ',sans-serif;
  font-style:normal;font-weight:400;line-height:1;font-variant-ligatures:none;overflow:hidden}
@media print{
  @page{size:1920px 1080px;margin:0}
  html,body{background:#fff;overflow:visible;height:auto}
  html.stage #deck,html.doc{position:static;overflow:visible}
  .slide{position:static!important;opacity:1!important;display:block!important;height:auto!important;
    pointer-events:auto!important;break-after:page;page-break-after:always;animation:none!important}
  .fit{transform:none!important}
  .bar,.tips,.ovl{display:none!important}
  html,body{background:#f7f8f5}
}
</style>
</head>
<body>
<main id="deck">
${pages}
</main>
<div class="bar" role="toolbar" aria-label="演示控制">
  <button type="button" data-act="tips" title="快捷键帮助" aria-label="快捷键帮助"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v6"></path><circle cx="12" cy="7.6" r="1.1" fill="currentColor" stroke="none"></circle></svg></button>
  <button type="button" data-act="overview" title="概览（O）" aria-label="概览"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="4" y="4" width="7" height="7" rx="1.6"></rect><rect x="13" y="4" width="7" height="7" rx="1.6"></rect><rect x="4" y="13" width="7" height="7" rx="1.6"></rect><rect x="13" y="13" width="7" height="7" rx="1.6"></rect></svg></button>
  <a class="ic" href="https://github.com/atian25/trae-campus-slide" target="_blank" rel="noopener" title="GitHub 仓库" aria-label="GitHub 仓库"><svg viewBox="0 0 16 16" fill="currentColor" stroke="none"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"></path></svg></a>
  <a class="ic" href="${PDF_URL}" target="_blank" rel="noopener" title="查看 PDF（浏览器内打开）" aria-label="查看 PDF"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v11"></path><path d="m7.5 9.5 4.5 4.5 4.5-4.5"></path><path d="M5 20h14"></path></svg></a>
  <button type="button" data-act="full" title="全屏（F）" aria-label="全屏"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"></path></svg></button>
</div>
<div class="lb-mask" data-mask></div>
<div class="lightbox" data-lb aria-hidden="true"><img alt=""><video class="lb-video" playsinline></video></div>
<div class="tips" data-tips>
  <div><b>→ / 空格</b>下一个动作（有视频先播，再翻页）</div>
  <div><b>←</b>上一个动作（回上一页）</div>
  <div><b>↑ ↓ / PgUp PgDn</b>直接翻页（跳过视频）</div>
  <div><b>1-9</b>跳页 · <b>Home / End</b> 首尾页 · <b>O</b> 概览 · <b>F</b> 全屏</div>
</div>
<div class="ovl">
  <div class="ovl-tools"><b class="ovl-hint"></b>
    <span>缩略图</span>
    <input type="range" class="ovl-size" min="160" max="440" step="20" value="240" aria-label="缩略图尺寸">
    <span class="ovl-size-label">240px</span>
    <span class="ovl-links">
      <a href="https://github.com/atian25/trae-campus-slide" target="_blank" rel="noopener">GitHub 仓库 ↗</a>
      <a href="${PDF_URL}" target="_blank" rel="noopener">查看 PDF ↗</a>
    </span>
  </div>
  <div class="ovl-grid"></div>
</div>
<script>
const CP = ${JSON.stringify(iconMap)};
for (const el of document.querySelectorAll('x-icon')) {
  const name = el.getAttribute('name') || '';
  el.textContent = String.fromCodePoint(CP[name] || 0xE000);
  const h = el.style.height || '24px';
  el.style.fontSize = h;               // 字形按 em 框缩放，与编辑器一致
  if (!el.style.width) el.style.width = h;
}

const deck = document.getElementById('deck');
const slides = Array.prototype.slice.call(deck.querySelectorAll('.slide'));
const bar = document.querySelector('.bar');
const tips = document.querySelector('.tips');
const mqPortrait = matchMedia('(max-aspect-ratio: 1/1)');
let cur = 0, mode = '', pagerTimer = 0;

function clamp(n) { return Math.max(0, Math.min(slides.length - 1, n)); }

function alignBar() {
  if (!bar || !slides[cur]) return;
  const fit = slides[cur].querySelector('.fit');
  if (!fit) return;
  const r = fit.getBoundingClientRect();
  const scale = r.width / 1920;
  const safeRight = r.right - 77 * scale;          // 正文安全区右边
  const inset = Math.max(10, (window.innerWidth - safeRight) + 10);
  bar.style.right = Math.round(inset) + 'px';

  // 页面底部留白 = 1080 - 正文安全下沿(1018) = 62px，控制条必须塞进这条空带里
  const freeBand = 62 * scale;
  const bs = Math.max(0.62, Math.min(1, (freeBand - 8) / 26));
  bar.style.setProperty('--bs', bs.toFixed(2));
  bar.style.bottom = Math.max(2, Math.round(freeBand - 26 * bs - 3)) + 'px';
}

const BAR_SPACE = 36;   // 控制条 + 边距（尽量少占幻灯片空间）

function fit() {
  const ref = slides[0];
  if (!ref) return;
  const deck = document.getElementById('deck');
  const vw = deck.clientWidth, vh0 = deck.clientHeight || window.innerHeight;

  // 先按满高算：如果底部本来就有一块 ≥ 控制条高度的留白，就不用压缩幻灯片
  const sFull = Math.min(vw / 1920, vh0 / 1080);
  const letterGap = (vh0 - 1080 * sFull) / 2;
  const reserve = 0;   // 控制条只有 3 个图标，直接压在页面底部留白上，不再压缩幻灯片
  deck.style.bottom = '0px';

  const vh = vh0 - reserve;
  const s = Math.min(vw / 1920, vh / 1080);
  for (const sl of slides) {
    const f = sl.querySelector('.fit');
    if (f) f.style.transform = 'scale(' + s + ')';
  }
  alignBar();
}

function setPager() {
  if (bar) bar.style.display = cur === 0 ? 'none' : 'flex';   // 封面不显示控制条
  if (mode === 'stage') fit();
}

function writeHash(i) {
  try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) {}
}

function runBuildIn(slide) {
  const els = slide.querySelectorAll('[data-build-in]');
  for (let k = 0; k < els.length; k++) {
    const el = els[k];
    const kind = el.getAttribute('data-build-in') || 'fade';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = (kind === 'rise' ? 'bi-rise' : kind === 'pop' ? 'bi-pop' : 'bi-fade') +
      ' .45s cubic-bezier(.2,.7,.2,1) both';
    el.style.animationDelay = (k * 0.06) + 's';
  }
}

/* 舞台模式下切页 */
function show(i, animate) {
  if (typeof closeLightbox === 'function') closeLightbox();   // 切页时收起放大图
  cur = clamp(i);
  for (let k = 0; k < slides.length; k++) {
    const sl = slides[k], on = k === cur;
    sl.classList.toggle('on', on);
    sl.classList.remove('t-fade', 't-push', 't-magic');
    sl.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (on && animate) {
      const tr = sl.getAttribute('data-transition');
      if (tr) sl.classList.add('t-' + tr);
    }
  }
  setPager();
  writeHash(cur);
  try { startVideo(); } catch (e) {}
  if (animate) runBuildIn(slides[cur]);
  postState();
  if (typeof showBarNow === 'function') showBarNow();
}

/* 文档模式下按滚动位置算当前页 */
function syncFromScroll() {
  const h = slides[0] ? slides[0].clientHeight : 0;
  if (!h) return;
  const i = clamp(Math.round(window.scrollY / h));
  if (i !== cur) {
    cur = i;
    setPager();
    writeHash(i);
    runBuildIn(slides[i]);
  }
}

function setMode() {
  const m = 'stage';   /* 统一左右翻页；竖屏也走 stage（swipe/点边缘/键盘）*/
  const changed = m !== mode;
  mode = m;
  document.documentElement.classList.toggle('doc', m === 'doc');
  document.documentElement.classList.toggle('stage', m === 'stage');
  requestAnimationFrame(function () {
    fit();
    if (mode === 'stage') {
      for (let k = 0; k < slides.length; k++) slides[k].classList.toggle('on', k === cur);
      setPager();
    } else if (changed && slides[cur]) {
      slides[cur].scrollIntoView({ block: 'start' });
    }
  });
}

function toggleFullscreen() {
  const el = document.documentElement;
  if (document.fullscreenElement) { (document.exitFullscreen || function(){}).call(document); }
  else if (el.requestFullscreen) { el.requestFullscreen().catch(function(){}); }
}

/* ===== 概览 ===== */
const ovl = document.querySelector('.ovl');
const ovlGrid = document.querySelector('.ovl-grid');
const ovlHint = document.querySelector('.ovl-hint');
let ovlBuilt = false;
function loadThumb(th) {
  th.querySelectorAll('img[data-src]').forEach(function (im) {
    im.setAttribute('src', im.getAttribute('data-src'));
    im.removeAttribute('data-src');
  });
}
function loadVisibleThumbs() {
  const box = ovl.getBoundingClientRect();
  for (const th of ovlGrid.children) {
    if (!th.querySelector('img[data-src]')) continue;
    const r = th.getBoundingClientRect();
    if (r.top < box.bottom + 400 && r.bottom > box.top - 200) loadThumb(th);
  }
}
function scaleThumbs() {
  const first = ovlGrid.firstElementChild;
  const w = first ? first.getBoundingClientRect().width : 240;
  const els = ovlGrid.querySelectorAll('.th-inner');
  for (let i = 0; i < els.length; i++) els[i].style.transform = 'scale(' + (w / 1920) + ')';
}
function buildOverview() {
  if (ovlBuilt) return;
  ovlBuilt = true;
  ovlHint.textContent = '共 ' + slides.length + ' 页 · 点击缩略图跳转 · Esc 或点空白处关闭';
  for (let i = 0; i < slides.length; i++) {
    const src = slides[i].querySelector('.fit > section');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'th'; b.setAttribute('data-i', String(i));
    const f = document.createElement('div'); f.className = 'th-frame';
    const inner = document.createElement('div'); inner.className = 'th-inner';
    if (src) {
      const c = src.cloneNode(true); c.removeAttribute('id');
      // ① 正在播放的页会把 <img> 换成 <video>：缩略图里去掉 video、恢复静帧
      c.querySelectorAll('video').forEach(function (v) { v.remove(); });
      c.querySelectorAll('img[data-video]').forEach(function (im) { im.style.display = ''; });
      // ② 图片改成滚到才加载（data-src 占位，IntersectionObserver 再赋值）
      c.querySelectorAll('img').forEach(function (im) {
        const u = im.getAttribute('src');
        if (!u) return;
        im.setAttribute('data-src', u);
        im.removeAttribute('src');
        im.setAttribute('loading', 'lazy');
      });
      inner.appendChild(c);
    }
    f.appendChild(inner);
    const cap = document.createElement('span'); cap.className = 'th-cap';
    cap.textContent = (i + 1) + ' / ' + slides.length;
    b.appendChild(f); b.appendChild(cap);
    b.addEventListener('click', function (e) { e.stopPropagation(); closeOverview(); jump(i); });
    ovlGrid.appendChild(b);
  }
  scaleThumbs();
  // 滚到才加载：用几何位置判断（比 IntersectionObserver 稳，缩放/显示时机都不影响）
  ovl.addEventListener('scroll', loadVisibleThumbs, { passive: true });
  window.addEventListener('resize', loadVisibleThumbs);
  const sizeInput = document.querySelector('.ovl-size');
  const sizeLabel = document.querySelector('.ovl-size-label');
  if (sizeInput) {
    sizeInput.addEventListener('input', function () {
      const px = Number(sizeInput.value) || 240;
      sizeLabel.textContent = px + 'px';
      ovlGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(' + px + 'px, 1fr))';
      scaleThumbs();
      requestAnimationFrame(loadVisibleThumbs);
    });
  }
}
function jump(i) {
  i = clamp(i);
  if (mode === 'doc') { cur = i; if (slides[i]) slides[i].scrollIntoView({ behavior: 'smooth', block: 'start' }); setPager(); writeHash(i); }
  else { show(i, true); }
}
function openOverview() {
  if (typeof closeLightbox === 'function') closeLightbox();
  buildOverview();
  ovl.classList.add('on');
  requestAnimationFrame(function () {
    scaleThumbs();
    const active = ovlGrid.querySelector('.th[data-i="' + cur + '"]');
    if (active) active.classList.add('active');
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
    requestAnimationFrame(loadVisibleThumbs);
  });
  document.body.style.overflow = 'hidden';
}
function closeOverview() {
  ovl.classList.remove('on');
  document.body.style.overflow = '';
  const a = ovlGrid.querySelector('.th.active');
  if (a) a.classList.remove('active');
}
function toggleOverview() {
  if (ovl.classList.contains('on')) closeOverview(); else openOverview();
}

/* 数字键跳页：支持多位数（1 → 2 = 第 12 页），无法再拼接时立即跳 */
let digitBuf = '', digitTimer = 0;
function typeDigit(k) {
  clearTimeout(digitTimer);
  digitBuf += k;
  const n = Number(digitBuf);
  if (n < 1) { digitBuf = ''; return; }
  if (n <= slides.length && n * 10 <= slides.length) {
    // 还可以再拼一位（例如 1 → 10..19 中的某页）
    digitTimer = setTimeout(function () { show(n - 1, true); digitBuf = ''; }, 420);
    show(n - 1, true);
    return;
  }
  digitBuf = '';
  if (n <= slides.length) show(n - 1, true);
}

function step(d) {
  const n = clamp(cur + d);
  if (mode === 'doc') {
    if (slides[n]) slides[n].scrollIntoView({ behavior: 'smooth', block: 'start' });
    cur = n; setPager(); writeHash(n);
  } else {
    show(n, true);
  }
}

/* ---- 键盘 ---- */
window.addEventListener('keydown', function (e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  // 灯箱打开时：方向键/空格只关灯箱不翻页；数字键关灯箱后照常跳页；Esc 关闭
  if (lb && lb.hasAttribute('data-on')) {
    if (k === 'Escape') { e.preventDefault(); closeLightbox(); return; }
    if (/^[0-9]$/.test(k)) { closeLightbox(); }
    else if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
          || k === 'PageUp' || k === 'PageDown' || k === ' ' || k === 'Home' || k === 'End') {
      e.preventDefault(); closeLightbox(); return;
    } else { return; }
  }
  // 左右 = 「动作」语义（PPT 的下一动画 / 上一动画）
  if (k === 'ArrowRight' || k === ' ') {
    e.preventDefault();
    if (toggleVideo()) return;      // 该页有视频：播放中→暂停；已暂停→翻页
    step(1);
  } else if (k === 'ArrowLeft' || (k === ' ' && e.shiftKey)) {
    e.preventDefault(); stopVideo(); step(-1);
  // 上下 / PgUp PgDn = 「直接翻页」语义（忽略视频动作）
  } else if (k === 'ArrowDown' || k === 'PageDown') {
    e.preventDefault(); stopVideo(); step(1);
  } else if (k === 'ArrowUp' || k === 'PageUp') {
    e.preventDefault(); stopVideo(); step(-1);
  } else if (k === 'Home') { e.preventDefault(); show(0, true); }
  else if (k === 'End') { e.preventDefault(); show(slides.length - 1, true); }
  else if (/^[0-9]$/.test(k)) { typeDigit(k); }
  else if (k === 'f' || k === 'F') { toggleFullscreen(); }
  else if (k === 'o' || k === 'O') { toggleOverview(); }
  else if (k === 'p' || k === 'P') { openPresenter(); }
  else if (k === 'Escape') { if (lb && lb.hasAttribute('data-on')) closeLightbox(); else toggleOverview(); }
});

/* ---- 滚轮（仅舞台模式）---- */
let wheelAcc = 0, wheelReset = 0, wheelDone = false;
window.addEventListener('wheel', function (e) {
  if (e.ctrlKey || mode !== 'stage') return;
  // 概览 / 图片放大 打开时，滚轮属于它们自己的滚动，不翻页
  if (ovl && ovl.classList.contains('on')) return;
  if (lb && lb.hasAttribute('data-on')) return;
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  e.preventDefault();
  clearTimeout(wheelReset);
  wheelReset = setTimeout(function () { wheelDone = false; wheelAcc = 0; }, 250);
  if (wheelDone) return;
  wheelAcc += e.deltaMode ? (e.deltaY > 0 ? 60 : e.deltaY < 0 ? -60 : 0) : e.deltaY;
  if (Math.abs(wheelAcc) >= 60) {
    wheelDone = true;
    step(wheelAcc > 0 ? 1 : -1);
    wheelAcc = 0;
  }
}, { passive: false });

/* ---- 点击不再翻页（桌面用键盘/滚轮，移动端滑动）---- */

/* ---- 触摸滑动 ---- */
let tX = 0, tY = 0, tT = 0;
window.addEventListener('touchstart', function (e) {
  if (e.touches.length !== 1) { tT = 0; return; }
  tX = e.touches[0].clientX; tY = e.touches[0].clientY; tT = Date.now();
}, { passive: true });
window.addEventListener('touchend', function (e) {
  if (e.changedTouches.length !== 1 || !tT) return;
  const dx = e.changedTouches[0].clientX - tX;
  const dy = e.changedTouches[0].clientY - tY;
  if (Date.now() - tT > 700) return;
  if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
  if (mode === 'stage') step(dx < 0 ? 1 : -1);
}, { passive: true });

/* ---- 滚动（文档模式的页码/深链）---- */
window.addEventListener('scroll', function () {
  if (mode === 'doc') syncFromScroll();
}, { passive: true });

window.addEventListener('resize', function () { setMode(); });
window.addEventListener('orientationchange', function () { setTimeout(setMode, 120); });
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', function () { setMode(); });
  window.visualViewport.addEventListener('scroll', function () { setMode(); });
}
if (mqPortrait.addEventListener) mqPortrait.addEventListener('change', function () { setMode(); });

/* ---- 深链 #N ---- */
function fromHash() {
  const m = /^#(\\d+)$/.exec(window.location.hash);
  return m ? clamp(Number(m[1]) - 1) : 0;
}
window.addEventListener('hashchange', function () {
  const i = fromHash();
  if (i === cur) return;
  if (mode === 'stage') show(i, true);
  else { cur = i; if (slides[cur]) slides[cur].scrollIntoView({ block: 'start' }); setPager(); }
});

/* ---- 视频：进入该页自动播放，离开暂停；→ 先控制播放再翻页 ---- */
let activeVideo = null;
function stopVideo() {
  if (activeVideo) {
    try { activeVideo.pause(); } catch (e) {}
    if (activeVideo.parentNode) activeVideo.parentNode.removeChild(activeVideo);
    activeVideo = null;
  }
}
function startVideo() {
  stopVideo();
  const slide = slides[cur];
  if (!slide) return;
  const img = slide.querySelector('img[data-video]');
  if (!img) return;
  const v = document.createElement('video');
  v.setAttribute('src', img.getAttribute('data-video'));
  v.loop = true;
  v.playsInline = true;
  v.muted = img.getAttribute('data-video-sound') !== 'on';
  v.setAttribute('aria-label', img.getAttribute('alt') || '');
  v.setAttribute('style', (img.getAttribute('style') || '') + ';display:block');
  v.style.objectFit = 'cover';
  img.parentNode.insertBefore(v, img.nextSibling);
  img.style.display = 'none';
  activeVideo = v;
  const play = v.play();
  if (play && play.catch) play.catch(function () {
    v.muted = true;                      // 浏览器拦自动播放时降级静音，画面照常
    const again = v.play();
    if (again && again.catch) again.catch(function () {});
  });
}
function toggleVideo() {
  // 播放中 → 暂停（不翻页）；已暂停 → 让位给翻页
  if (!activeVideo) return false;
  if (activeVideo.paused) { stopVideo(); return false; }
  activeVideo.pause();
  return true;
}

/* ---- 点击图片放大 ---- */
const lb = document.querySelector('.lightbox');
const lbImg = lb ? lb.querySelector('img') : null;
let lbResumeVideo = false;
function openLightboxVideo(src) {
  if (!lb) return;
  if (activeVideo && !activeVideo.paused) { activeVideo.pause(); lbResumeVideo = true; } else { lbResumeVideo = false; }
  const v = lb.querySelector('.lb-video');
  if (!v) return;
  lbImg.style.display = 'none';
  v.style.display = 'block';
  v.src = src;
  v.controls = true;
  v.loop = false;
  v.muted = false;
  const pr = v.play();
  if (pr && pr.catch) pr.catch(function () {});
  lb.setAttribute('data-on', '');
  lb.setAttribute('aria-hidden', 'false');
  const mask = document.querySelector('.lb-mask');
  if (mask) mask.setAttribute('data-on', '');
}
function openLightbox(src, alt) {
  if (!lb || !lbImg) return;
  const v0 = lb.querySelector('.lb-video');
  if (v0) { try { v0.pause(); } catch (e) {} v0.removeAttribute('src'); v0.style.display = 'none'; }
  lbImg.style.display = '';
  lbImg.setAttribute('src', src);
  lbImg.setAttribute('alt', alt || '');
  lb.setAttribute('data-on', '');
  lb.setAttribute('aria-hidden', 'false');
  const mask = document.querySelector('.lb-mask');
  if (mask) mask.setAttribute('data-on', '');
}
function closeLightbox() {
  if (!lb) return;
  const v0 = lb.querySelector('.lb-video');
  // 放大视图里视频是暂停状态 → 关掉后卡片视频也保持暂停，不自动恢复
  const lbWasPlaying = !!(v0 && v0.style.display !== 'none' && !v0.paused);
  if (lbResumeVideo && lbWasPlaying && activeVideo) {
    const pr = activeVideo.play();
    if (pr && pr.catch) pr.catch(function () {});
  }
  lbResumeVideo = false;
  if (v0) { try { v0.pause(); } catch (e) {} v0.removeAttribute('src'); v0.style.display = 'none'; }
  if (lbImg) lbImg.style.display = '';
  lb.removeAttribute('data-on');
  lb.setAttribute('aria-hidden', 'true');
  const mask = document.querySelector('.lb-mask');
  if (mask) mask.removeAttribute('data-on');
}
document.addEventListener('click', function (e) {
  const t = e.target;
  if (!t || !t.closest) return;
  const vid = t.closest('.slide video');
  if (vid) {
    e.stopPropagation(); e.preventDefault();
    openLightboxVideo(vid.currentSrc || vid.src);
    return;
  }
  const img = t.closest('.slide img[data-zoom]') || (t.tagName === 'IMG' && t.hasAttribute('data-zoom') ? t : null);
  if (!img) return;
  if (ovl && ovl.classList.contains('on')) return;   // 概览里的缩略图不放大
  e.stopPropagation();
  e.preventDefault();
  openLightbox(img.currentSrc || img.src, img.getAttribute('alt'));
}, true);
if (lb) {
  lb.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.lb-video')) return;   // 视频区域自己处理
    closeLightbox();
  });
  const mask = document.querySelector('.lb-mask');
  if (mask) mask.addEventListener('click', closeLightbox);
  document.addEventListener('click', function (e) {
    if (!lb.hasAttribute('data-on')) return;
    const lv = e.target.closest && e.target.closest('.lb-video');
    if (lv) {                                   // 放大视图里点视频 = 播放/暂停
      e.stopPropagation();
      e.preventDefault();
      if (lv.paused) { const pr = lv.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else lv.pause();
      return;
    }
    if (!e.target.closest('.slide img[data-zoom]')) closeLightbox();
  }, false);
}

/* ---- 底部控制条 ---- */
if (bar) {
  bar.addEventListener('mousedown', function (e) { e.preventDefault(); });
  bar.addEventListener('click', function (e) {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    e.stopPropagation();
    const act = b.getAttribute('data-act');
    if (act !== 'tips') tips.removeAttribute('data-on');
    if (act === 'prev') step(-1);
    else if (act === 'next') step(1);
    else if (act === 'overview') toggleOverview();
    else if (act === 'full') toggleFullscreen();
    else if (act === 'tips') { tips.toggleAttribute('data-on'); }
    else if (act === 'close') { /* 已移除 ✕ 按钮 */ }
  });
  // 常驻：任何模式（含全屏）都一直显示，不再自动隐藏
  function showBar() {
    bar.removeAttribute('data-quiet');
  }
  window.showBarNow = showBar;
  window.addEventListener('click', function (e) {
    if (!e.target.closest('.bar')) tips.removeAttribute('data-on');
  });
  showBar();
}

/* ---- 概览交互 ---- */
ovl.addEventListener('click', function (e) {
  if (e.target.closest('.th')) return;                       // 点缩略图：跳转
  if (e.target.closest('input,label,button')) return;        // 控件不关闭
  closeOverview();
});
window.addEventListener('mousemove', function () { setPager(); }, { passive: true });
window.addEventListener('resize', function () { if (ovl.classList.contains('on')) scaleThumbs(); });

/* ---- 演讲者窗口（P）：同源第二窗口，BroadcastChannel 同步 ---- */
const chan = ('BroadcastChannel' in window) ? new BroadcastChannel('dsh-deck') : null;
function postState() {
  if (chan) chan.postMessage({ cur: cur, total: slides.length, t: Date.now() });
}
function openPresenter() {
  const url = location.origin + location.pathname + '?presenter=1';
  window.open(url, 'dsh-presenter', 'width=1280,height=760');
}

/* ---- 演讲者窗口渲染（?presenter=1）---- */
function presenterMode() {
  document.documentElement.classList.add('pv');
  document.body.classList.add('pv');
  const base = location.origin + location.pathname;
  const main = document.createElement('div'); main.className = 'pv-main';
  const side = document.createElement('aside'); side.className = 'pv-side';
  side.innerHTML = '<div><h2>备注（本页）</h2><div class="pv-notes"></div></div>'
    + '<div><h2>下一页</h2><iframe class="pv-next" src="' + base + '?embed=1#2"></iframe></div>'
    + '<div><h2>已用时间</h2><div class="pv-timer">00:00</div></div>'
    + '<p class="pv-hint"><b>→</b>下一页（有视频时先播放/暂停）</p>'
    + '<p class="pv-hint"><b>←</b>上一页 · <b>O</b>概览 · <b>F</b>全屏</p>'
    + '<p class="pv-hint"><b>1-9</b>跳页，可连按两位数</p>';
  const frame = document.createElement('iframe');
  frame.className = 'pv-frame';
  frame.src = base + '?embed=1#1';
  main.appendChild(frame);
  document.body.appendChild(main); document.body.appendChild(side);
  const nextFrame = side.querySelector('.pv-next');
  const timerEl = side.querySelector('.pv-timer');
  const start = Date.now();
  setInterval(function () {
    const s2 = Math.floor((Date.now() - start) / 1000);
    timerEl.textContent = String(Math.floor(s2 / 60)).padStart(2, '0') + ':' + String(s2 % 60).padStart(2, '0');
  }, 500);
  function goto(i) {
    const n = Math.max(1, Math.min(slides.length, i + 1));
    const sec = slides[n - 1] && slides[n - 1].querySelector('section');
    const noteEl = document.querySelector('.pv-notes');
    if (noteEl) {
      const note = sec && sec.querySelector('aside');
      noteEl.textContent = note ? note.textContent.trim() : '（本页没有备注）';
    }
    if (frame.contentWindow) frame.contentWindow.location.hash = '#' + n;
    if (nextFrame.contentWindow) nextFrame.contentWindow.location.hash = '#' + Math.min(slides.length, n + 1);
  }
  window.gotoPresenter = goto;
  goto(0);
}

/* ---- 启动 ---- */
cur = fromHash();
setMode();
if (location.search.indexOf('presenter') >= 0) { presenterMode(); }
else { try { startVideo(); } catch (e) {} }   // 首屏直接深链到有视频的页也要播
window.addEventListener('load', function () { fit(); if (mode === 'doc' && slides[cur]) slides[cur].scrollIntoView({ block: 'start' }); });
</script>
</body>
</html>`;

fs.writeFileSync(path.join(SITE, "index.html"), html);
// 卡片样式指南（docs/style-guide.html → 站点 style-guide.html）
const guide = path.join(REPO, "docs/style-guide.html");
if (fs.existsSync(guide)) {
  fs.copyFileSync(guide, path.join(SITE, "style-guide.html"));
  console.log("guide -> release/site/style-guide.html");
}
const mb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`site -> release/site/index.html  ${mb} KB，${pageCount} 页，图片 ${blobFiles.size} 张`);

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
