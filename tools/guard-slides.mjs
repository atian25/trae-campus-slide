#!/usr/bin/env node
/**
 * tools/guard-slides.mjs — 语义守卫：检测「编辑器重写」是否吃掉了关键内容。
 *
 * 背景：claude-slides 编辑器每次保存会把整页交给它的规范化器重写：
 *   - 换行重排（`<div></div>` 拆成两行）、属性顺序调整（src/style 挪位）
 *   - 视觉等价的归一（border-radius:999px → 256px、颜色小写、补 font-family）
 * 这些是「排版层」变化，无害。但规范化器也可能**静默丢弃**它不认识的声明/属性
 * （object-fit、mix-blend-mode、position、data-video…），那就会悄悄坏版式。
 *
 * 本脚本把「当前工作区」和「git HEAD」的同一页做**语义抽取后对比**：
 * 只比内容（文案、图片与 video 属性、图标、关键 CSS、链接），忽略格式。
 * 发现「HEAD 有、现在没有」的东西 → 报错退出（说明被吃掉了）。
 *
 * 用法：
 *   node tools/guard-slides.mjs            # 只查有改动的页
 *   node tools/guard-slides.mjs --all      # 查全部页
 *   node tools/guard-slides.mjs --verbose  # 打印每页抽取到的数量
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SLIDES = path.join(REPO, "slide/project/slides");
const args = process.argv.slice(2);
const ALL = args.includes("--all");
const VERBOSE = args.includes("--verbose");

// 需要重点盯的 CSS 声明（丢了会直接影响版式）
const CRITICAL_CSS = [
  "object-fit",
  "mix-blend-mode",
  "position",
  "background",
  "border-top",
  "border-bottom",
  "border-radius",
  "white-space",
  "letter-spacing",
  "line-height",
];

function headContent(rel) {
  try {
    return execFileSync("git", ["show", `HEAD:${rel}`], { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

function changedFiles() {
  try {
    const out = execFileSync("git", ["status", "--porcelain", "--", "slide/project/slides"], { cwd: REPO, encoding: "utf8" });
    return out.split("\n").filter(Boolean).map((l) => l.slice(3).trim());
  } catch {
    return [];
  }
}

/** 从 slide HTML 里抽取「语义」集合 */
function extract(html) {
  const out = { texts: new Set(), imgs: new Set(), icons: new Set(), hrefs: new Set(), css: new Set(), svgCount: 0 };

  // 文案（去掉标签/属性，压缩空白）
  const textOnly = html.replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]+>/g, "\n");
  for (const t of textOnly.split("\n")) {
    const s = t.replace(/\s+/g, " ").trim();
    if (s.length >= 2) out.texts.add(s);
  }

  // 图片：src + 视频相关属性
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    const src = (tag.match(/\bsrc="([^"]*)"/) || [])[1] || "";
    const vid = (tag.match(/\bdata-video="([^"]*)"/) || [])[1] || "";
    const snd = (tag.match(/\bdata-video-sound="([^"]*)"/) || [])[1] || "";
    const alt = (tag.match(/\balt="([^"]*)"/) || [])[1] || "";
    out.imgs.add(`${src}|video:${vid}|sound:${snd}|alt:${alt}`);
  }

  // 图标名
  for (const m of html.matchAll(/<x-icon\b[^>]*\bname="([A-Za-z0-9_]+)"/g)) out.icons.add(m[1]);

  // 内联 svg 数量（我们用它画箭头/小图标）
  out.svgCount = (html.match(/<svg\b/g) || []).length;

  // 链接
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)) out.hrefs.add(m[1]);

  // 关键 CSS 声明（属性:值 去空格后整串）
  for (const m of html.matchAll(/\bstyle="([^"]*)"/g)) {
    for (const decl of m[1].split(";")) {
      const i = decl.indexOf(":");
      if (i < 0) continue;
      const prop = decl.slice(0, i).trim().toLowerCase();
      const val = decl.slice(i + 1).replace(/\s+/g, "").trim();
      if (!prop || !val) continue;
      if (CRITICAL_CSS.includes(prop) || prop.startsWith("border-") || prop.startsWith("background")) {
        out.css.add(`${prop}:${val}`);
      }
    }
  }
  return out;
}

const files = ALL
  ? fs.readdirSync(SLIDES).filter((f) => f.endsWith(".html")).map((f) => `slide/project/slides/${f}`)
  : changedFiles().filter((f) => f.endsWith(".html"));

if (!files.length) {
  console.log("\n  没有改动过的 slide，跳过（--all 可全量查）\n");
  process.exit(0);
}

let failures = 0;
for (const rel of files) {
  const abs = path.join(REPO, rel);
  if (!fs.existsSync(abs)) continue;
  const cur = extract(fs.readFileSync(abs, "utf8"));
  const before = headContent(rel);
  if (!before) {
    if (VERBOSE) console.log(`  · ${path.basename(rel)} 新文件，跳过对比`);
    continue;
  }
  const prev = extract(before);
  const lost = {
    文案: [...prev.texts].filter((x) => !cur.texts.has(x)),
    图片: [...prev.imgs].filter((x) => !cur.imgs.has(x)),
    图标: [...prev.icons].filter((x) => !cur.icons.has(x)),
    链接: [...prev.hrefs].filter((x) => !cur.hrefs.has(x)),
    CSS: [...prev.css].filter((x) => !cur.css.has(x)),
  };
  const lostSvg = Math.max(0, prev.svgCount - cur.svgCount);
  const total = Object.values(lost).reduce((a, b) => a + b.length, 0) + lostSvg;

  if (VERBOSE) {
    console.log(`  · ${path.basename(rel)} 文案${cur.texts.size} 图${cur.imgs.size} 图标${cur.icons.size} svg${cur.svgCount} css${cur.css.size}（HEAD 同类 ${prev.texts.size}/${prev.imgs.size}/${prev.icons.size}/${prev.svgCount}/${prev.css.size}）`);
  }

  if (total) {
    failures++;
    console.log(`\n  ✗ ${path.basename(rel)} 相比 HEAD 丢了 ${total} 项语义：`);
    for (const [k, v] of Object.entries(lost)) {
      if (v.length) {
        console.log(`      ${k}（${v.length}）:`);
        for (const x of v.slice(0, 6)) console.log(`        - ${x.slice(0, 110)}`);
        if (v.length > 6) console.log(`        … 还有 ${v.length - 6} 项`);
      }
    }
    if (lostSvg) console.log(`      svg 少了 ${lostSvg} 个`);
  }
}

console.log("");
if (failures) {
  console.log(`  ${failures} 页有语义丢失 → 可能是编辑器重写把不支持的声明/属性吃掉了`);
  console.log("  处理：看上面的清单，把丢掉的那几行补回去（通常 1–3 行）；不确定就 git diff 看整页\n");
  process.exit(1);
}
console.log(`  通过：${files.length} 页没有语义丢失（格式层变化忽略）\n`);
