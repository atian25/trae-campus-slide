#!/usr/bin/env node
/**
 * tools/doctor.mjs — 体检：检查我们把 claude-slides 当依赖用到的所有耦合点。
 *
 * 用法：
 *   npm run doctor            # 全部检查
 *   npm run doctor -- --no-check   # 跳过 artfiact check（更快）
 *
 * 背景：deck 是 claude-slides 的 artifact 格式，仓库侧只依赖它 4 个稳定接口：
 *   1. scripts/artifact.mjs 的 check / render / open / share / upload
 *   2. project/deck.json 的 v 版本 + order 约定
 *   3. project/assets/index.json + /_blob/<id> 的资产约定
 *   4. 编辑器打包出来的图标字体与字形表（已复制进 tools/assets，不依赖安装）
 * 插件每次升级后跑一遍，就知道要不要动我们这边。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DECK = path.join(REPO, "slide");
const argv = process.argv.slice(2);
const skipCheck = argv.includes("--no-check");

const results = [];
const ok = (name, detail = "") => results.push(["ok", name, detail]);
const warn = (name, detail = "") => results.push(["warn", name, detail]);
const bad = (name, detail = "") => results.push(["fail", name, detail]);

// ---------- 1. 找安装 ----------
function findSkill() {
  const candidates = [
    process.env.CLAUDE_SLIDES_SKILL,
    path.join(os.homedir(), ".agents/skills/claude-slides"),
    path.join(os.homedir(), ".dsh/profiles/desktop/node_modules/dsh-claude-slides"),
  ].filter(Boolean);
  for (const c of candidates) if (c && fs.existsSync(path.join(c, "scripts/artifact.mjs"))) return c;
  const profiles = path.join(os.homedir(), ".dsh/profiles");
  if (fs.existsSync(profiles)) {
    for (const p of fs.readdirSync(profiles)) {
      const c = path.join(profiles, p, "node_modules/dsh-claude-slides");
      if (fs.existsSync(path.join(c, "scripts/artifact.mjs"))) return c;
    }
  }
  return null;
}

let skill = null;
try {
  skill = findSkill();
  if (!skill) {
    bad("claude-slides 安装", "没找到（设 CLAUDE_SLIDES_SKILL 或 npm i -g / 安装 dsh 插件）");
  } else {
    let version = "";
    const pkgFile = path.join(skill, "package.json");
    if (fs.existsSync(pkgFile)) {
      try { version = "v" + JSON.parse(fs.readFileSync(pkgFile, "utf8")).version; } catch {}
    }
    if (!version) {
      const inner = path.join(skill, "skills/claude-slides/package.json");
      if (fs.existsSync(inner)) {
        try { version = "v" + JSON.parse(fs.readFileSync(inner, "utf8")).version; } catch {}
      }
    }
    ok("claude-slides 安装", `${skill.replace(os.homedir(), "~")}${version ? " " + version : ""}`);
  }
} catch (e) {
  bad("claude-slides 安装", e.message);
}

// ---------- 1b. 已装的 dsh 插件版本（我们默认只用 CLI，这里只做提示）----------
const plugins = [];
try {
  const profiles = path.join(os.homedir(), ".dsh/profiles");
  if (fs.existsSync(profiles)) {
    for (const p of fs.readdirSync(profiles)) {
      const pkg = path.join(profiles, p, "node_modules/dsh-claude-slides/package.json");
      if (fs.existsSync(pkg)) {
        try { plugins.push(`${p} v${JSON.parse(fs.readFileSync(pkg, "utf8")).version}`); } catch {}
      }
    }
  }
} catch {}
if (plugins.length && skill) {
  const newest = plugins
    .map((x) => ({ label: x, v: Number((x.match(/v([\d.]+)/) || [])[1]?.split(".")[0] || 0) }))
    .sort((a, b) => b.v - a.v)[0].label;
  const usingPlugin = skill.includes("node_modules");
  if (!usingPlugin) {
    warn("插件版本", `已装 dsh 插件 ${plugins.join(" / ")}；当前 CLI 用的是 ${skill.replace(os.homedir(), "~")}（独立安装，版本独立）`);
  } else {
    ok("插件版本", plugins.join(" / "));
  }
}

// ---------- 2. 图标：字形表 + deck 里在用的 name 全覆盖 ----------
const MAP = path.join(REPO, "tools/assets/anthropicons.json");
const FONT = path.join(REPO, "tools/assets/anthropicons.woff2");
let iconMap = null;
try {
  if (!fs.existsSync(MAP) || !fs.existsSync(FONT)) throw new Error("tools/assets/anthropicons.{json,woff2} 缺失");
  iconMap = JSON.parse(fs.readFileSync(MAP, "utf8"));
  ok("内置图标字体", `woff2 ${(fs.statSync(FONT).size / 1024).toFixed(0)}KB · ${Object.keys(iconMap).length} 个图标`);
} catch (e) {
  bad("内置图标字体", e.message + "（跑一次 `node tools/deck.mjs` 或从安装里重新导出）");
}

const slidesDir = path.join(DECK, "project/slides");
const slideFiles = fs.existsSync(slidesDir) ? fs.readdirSync(slidesDir).filter((f) => f.endsWith(".html")) : [];
if (iconMap && slideFiles.length) {
  const used = new Set();
  for (const f of slideFiles) {
    const s = fs.readFileSync(path.join(slidesDir, f), "utf8");
    for (const m of s.matchAll(/<x-icon\s+name="([A-Za-z]+)"/g)) used.add(m[1]);
  }
  const missing = [...used].filter((n) => !(n in iconMap)).sort();
  if (missing.length) bad("图标覆盖", `deck 用到但字形表没有：${missing.join(", ")}`);
  else ok("图标覆盖", `${used.size} 个在用图标全部存在`);
}

// ---------- 3. deck 结构与页文件 ----------
let deck = null;
try {
  deck = JSON.parse(fs.readFileSync(path.join(DECK, "project/deck.json"), "utf8"));
  if (deck.v !== 4) warn("deck 格式版本", `v=${deck.v}，仓库按 v4 写的构建脚本，插件升级后请确认字段没变`);
  else ok("deck 格式版本", "v=4");

  const order = deck.order || [];
  const missingPages = order.filter((id) => !fs.existsSync(path.join(slidesDir, `${id}.html`)));
  const orphan = slideFiles.map((f) => f.replace(/\.html$/, "")).filter((id) => !order.includes(id));
  if (missingPages.length) bad("页文件", `order 里有但缺文件：${missingPages.join(", ")}`);
  else if (orphan.length) warn("页文件", `有文件但不在 order 里：${orphan.join(", ")}`);
  else ok("页文件", `${order.length} 页，order 与文件一致`);

  const start = deck.sections?.change?.start;
  if (start && !order.includes(start)) bad("sections.start", `指向不存在的页：${start}`);

  // 每页必须是「恰好一个 <section>」，这是 artifact 格式的硬约束
  const badShape = [];
  for (const id of order) {
    const p = path.join(slidesDir, `${id}.html`);
    if (!fs.existsSync(p)) continue;
    const s = fs.readFileSync(p, "utf8");
    const n = (s.match(/<section\b/g) || []).length;
    if (n !== 1) badShape.push(`${id}(${n})`);
  }
  if (badShape.length) bad("section 唯一性", badShape.join(", "));
  else ok("section 唯一性", "每页 1 个 <section>");
} catch (e) {
  bad("deck.json", e.message);
}

// ---------- 4. 资产：index.json ↔ 实际文件 ↔ 引用 ----------
const ASSETS = path.join(DECK, "project/assets");
try {
  const idx = JSON.parse(fs.readFileSync(path.join(ASSETS, "index.json"), "utf8"));
  const ids = Object.keys(idx);
  const missing = ids.filter((id) => {
    const hit = fs.readdirSync(ASSETS).find((f) => f.startsWith(id + "."));
    return !hit;
  });
  if (missing.length) bad("资产文件", `index.json 登记但文件缺失：${missing.slice(0, 5).join(", ")}${missing.length > 5 ? " …" : ""}`);
  else ok("资产文件", `${ids.length} 个资产，文件齐全`);

  // deck 引用的 /_blob/<id> 都要在 index 里
  const refs = new Set();
  for (const f of slideFiles) {
    const s = fs.readFileSync(path.join(slidesDir, f), "utf8");
    for (const m of s.matchAll(/\/_blob\/([0-9a-f]{32})/g)) refs.add(m[1]);
  }
  const dangling = [...refs].filter((r) => !(r in idx));
  if (dangling.length) bad("资产引用", `${dangling.length} 个 /_blob 未登记：${dangling.slice(0, 3).join(", ")}`);
  else ok("资产引用", `${refs.size} 处 /_blob 引用全部有效`);

  const videos = ids.filter((id) => String(idx[id]).startsWith("video/"));
  if (videos.length) ok("视频资产", `${videos.length} 个（2.16 起可用 artifact.mjs upload 直接传 mp4/webm）`);

  const names = path.join(REPO, "tools/asset-names.json");
  if (fs.existsSync(names)) {
    const nm = JSON.parse(fs.readFileSync(names, "utf8"));
    const stale = Object.keys(nm).filter((id) => !(id in idx));
    if (stale.length) warn("资产语义名", `${stale.length} 条指向已删除资产（可清理）：${stale.slice(0, 3).join(", ")}`);
    else ok("资产语义名", `${Object.keys(nm).length} 条，无失效`);
  }
} catch (e) {
  bad("资产检查", e.message);
}

// ---------- 4b. 语义守卫：编辑器重写有没有吃掉东西 ----------
try {
  const out = execFileSync("node", [path.join(REPO, "tools/guard-slides.mjs")], { encoding: "utf8" });
  if (/没有改动过的 slide/.test(out)) ok("语义守卫", "无改动页，跳过");
  else ok("语义守卫", (out.match(/通过：(.*)/) || [, "通过"])[1].trim());
} catch (e) {
  const msg = ((e.stdout || "") + (e.stderr || "")).trim();
  const first = msg.split("\n").find((l) => l.includes("✗")) || "有语义丢失";
  bad("语义守卫", first.trim() + "（跑 npm run guard 看清单）");
}

// ---------- 5. artifact check（真正的格式校验）----------
if (!skipCheck && skill) {
  try {
    const out = execFileSync("node", [path.join(REPO, "tools/deck.mjs"), "check"], { encoding: "utf8" });
    const json = JSON.parse(out.slice(out.indexOf("{")));
    const problems = json.problems ?? [];
    if (problems.length) bad("artifact check", `${problems.length} 个问题：${JSON.stringify(problems).slice(0, 160)}`);
    else ok("artifact check", "problems: 0");
  } catch (e) {
    bad("artifact check", (e.stdout || e.message || "").toString().slice(0, 200));
  }
} else if (skipCheck) {
  warn("artifact check", "已跳过（--no-check）");
}

// ---------- 汇总 ----------
const icon = { ok: "✓", warn: "!", fail: "✗" };
const pad = Math.max(...results.map((r) => r[1].length)) + 2;
console.log("");
for (const [level, name, detail] of results) {
  console.log(`  ${icon[level]} ${name.padEnd(pad)} ${detail}`);
}
const fails = results.filter((r) => r[0] === "fail").length;
const warns = results.filter((r) => r[0] === "warn").length;
console.log("");
if (fails) {
  console.log(`  ${fails} 项失败${warns ? `，${warns} 项提醒` : ""} → 先修这些问题，再去 push`);
  process.exit(1);
}
console.log(warns ? `  通过（${warns} 项提醒）` : "  全部通过");
console.log("");
