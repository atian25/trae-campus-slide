#!/usr/bin/env node
/**
 * tools/render-slide.mjs — 把一页 claude-slides 草稿渲染成 1920×1080 PNG（headless Chrome）。
 *
 *   node tools/render-slide.mjs <slide-id> [out.png]
 *
 * 尽量还原编辑器里的效果：固定 1920×1080 画布、border-box、去掉 UA 边距、
 * Google Noto Sans SC，并把 <x-icon> 换成编辑器自带的 Anthropicons 图标字体
 * （x-icon 的 width/height 是 em 框，字形约为其 70%）。
 *
 * 图标字体与字形表不拷进仓库，直接从本机 claude-slides 安装里读。
 * 渲染结果默认写到 .tmp-test/render/（已在 .gitignore 里）。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const REPO = path.resolve(import.meta.dirname, "..");
const DECK = path.resolve(REPO, process.env.DECK_ROOT || "slide");
const OUTDIR = path.join(REPO, ".tmp-test/render");
const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;800&display=swap";

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
  throw new Error("找不到 claude-slides 安装目录；用 CLAUDE_SLIDES_SKILL=<目录> 指定。");
}

function findChrome() {
  const candidates = [
    process.env.CHROME,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  for (const bin of ["google-chrome", "chromium", "chromium-browser"]) {
    const r = spawnSync("which", [bin], { encoding: "utf8" });
    if (r.status === 0) return r.stdout.trim();
  }
  throw new Error("找不到 Chrome；用 CHROME=/path/to/chrome 指定。");
}

/** 图标名 → 字形码位：从编辑器 bundle 里扒出来（30 个名字，格式文档里规定的那套） */
function iconMap() {
  const assets = path.join(findSkill(), "scripts/editor/assets");
  const bundle = fs.readdirSync(assets).find((f) => /^index-.*\.js$/.test(f));
  if (!bundle) throw new Error(`编辑器 assets 目录里没有 index-*.js: ${assets}`);
  const src = fs.readFileSync(path.join(assets, bundle), "utf8");
  const map = {};
  for (const m of src.matchAll(/"([A-Z][A-Za-z0-9]+)":\s*(5[0-9]{4})/g)) map[m[1]] = Number(m[2]);
  if (Object.keys(map).length < 20) throw new Error("没能从 bundle 里解析出图标字形表。");
  return map;
}

/** 编辑器默认图标字体 Anthropicons-Variable 以 base64 内嵌在其 CSS 里，直接取出来用 */
function iconFontDataUrl() {
  const assets = path.join(findSkill(), "scripts/editor/assets");
  const css = fs.readdirSync(assets).find((f) => /^index-.*\.css$/.test(f));
  if (!css) throw new Error(`编辑器 assets 目录里没有 index-*.css: ${assets}`);
  const src = fs.readFileSync(path.join(assets, css), "utf8");
  const m = /font-family:\s*Anthropicons-Variable\s*;\s*src:\s*url\((data:font\/woff2;base64,[^)]+)\)/.exec(src);
  if (!m) throw new Error("编辑器 CSS 里没找到 Anthropicons-Variable 的 base64 字体。");
  return m[1];
}

const id = process.argv[2];
if (!id) {
  console.error("用法: node tools/render-slide.mjs <slide-id> [out.png]");
  process.exit(2);
}
const out = process.argv[3] ? path.resolve(process.argv[3]) : path.join(OUTDIR, `${id}.png`);

const slideFile = path.join(DECK, "project/slides", `${id}.html`);
if (!fs.existsSync(slideFile)) {
  console.error(`没有这一页: ${path.relative(REPO, slideFile)}`);
  process.exit(2);
}
fs.mkdirSync(path.dirname(out), { recursive: true });

// /_blob/<32hex> → 真实文件
const assetsDir = path.join(DECK, "project/assets");
const blobFiles = new Map();
if (fs.existsSync(assetsDir)) {
  for (const f of fs.readdirSync(assetsDir)) {
    const m = /^([0-9a-f]{32})\.(\w+)$/.exec(f);
    if (m) blobFiles.set(m[1], path.join(assetsDir, f));
  }
}

let section = fs.readFileSync(slideFile, "utf8").trim();
section = section.replace(/\/_blob\/([0-9a-f]{32})/g, (all, blob) => {
  const f = blobFiles.get(blob);
  if (!f) throw new Error(`第 ${id} 页引用了不存在的图片 blob ${blob}`);
  return "file://" + f;
});

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONT_LINK}">
<style>
@font-face{font-family:'AnthropiconsFZ';src:url(${iconFontDataUrl()}) format('woff2');font-weight:400 700;font-display:block}
html,body{margin:0;padding:0;width:1920px;height:1080px;overflow:hidden;background:#F7F8F5}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body>section{width:1920px;height:1080px}
x-icon{display:flex;align-items:center;justify-content:center;font-family:'AnthropiconsFZ',sans-serif;font-style:normal;font-weight:400;line-height:1;font-variant-ligatures:none;overflow:hidden}
</style></head><body>${section}
<script>
const CP = ${JSON.stringify(iconMap())};
for (const el of document.querySelectorAll('x-icon')) {
  const name = el.getAttribute('name') || '';
  el.textContent = String.fromCodePoint(CP[name] || 0xE000);
  const h = el.style.height || '24px';
  el.style.fontSize = h;          // 字形按 em 框（height）缩放
  if (!el.style.width) el.style.width = h;
}
</script>
</body></html>`;

const tmp = path.join(REPO, ".tmp-test", `.slide-${id}.html`);
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.writeFileSync(tmp, html);

const profile = path.join(REPO, ".tmp-test/chrome-profile");
const r = spawnSync(
  findChrome(),
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1920,1080",
    "--virtual-time-budget=15000",
    `--user-data-dir=${profile}`,
    `--screenshot=${out}`,
    "file://" + tmp,
  ],
  { stdio: ["ignore", "ignore", "pipe"] }
);

if (!fs.existsSync(out)) {
  console.error(r.stderr?.toString().split("\n").slice(-5).join("\n") || "渲染失败");
  process.exit(1);
}
const { size } = fs.statSync(out);
console.log(`${path.relative(REPO, out)}  (${(size / 1024).toFixed(0)} KB)`);
