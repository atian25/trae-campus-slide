#!/usr/bin/env node
/**
 * tools/build-pptx.mjs — 把 deck 导出成 PowerPoint（.pptx）。
 *
 * 做法：先把 22 页渲染成 1920×1080 PNG（复用 tools/deck.mjs render 的产物），
 * 再用 python-pptx 每页铺一张全幅图，生成 16:9 的 .pptx。
 *
 * 特点：像素级和网页/PDF 一致；但每页是图片，PowerPoint 里**不能改文字**。
 * 需要「可编辑文字」的版本要另做（HTML → 形状/文本框的重建），成本高。
 *
 * 用法：
 *   npm run pptx                 # 用 .tmp-test/render 里已有的 PNG
 *   npm run pptx -- --render     # 先重新渲染全部页面再导出
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DECK = path.join(REPO, "slide/project/deck.json");
const RENDER_DIR = path.join(REPO, ".tmp-test/render");
const OUT_DIR = path.join(REPO, "release");

const order = JSON.parse(fs.readFileSync(DECK, "utf8")).order;
const title = JSON.parse(fs.readFileSync(DECK, "utf8")).title || "deck";

if (process.argv.includes("--render")) {
  console.log("渲染全部页面…");
  const r = spawnSync("node", [path.join(REPO, "tools/deck.mjs"), "render"], { cwd: REPO, stdio: "inherit" });
  if (r.status !== 0) { console.error("渲染失败"); process.exit(1); }
}

const missing = order.filter((id) => !fs.existsSync(path.join(RENDER_DIR, `${id}.png`)));
if (missing.length) {
  console.error(`缺少渲染图：${missing.join(", ")}\n先跑 npm run deck:render`);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const out = path.join(OUT_DIR, `${title}.pptx`);

const py = `
import json, sys
from pptx import Presentation
from pptx.util import Inches, Emu

order = json.loads(sys.argv[1])
render_dir = sys.argv[2]
out_path = sys.argv[3]

prs = Presentation()
prs.slide_width = Emu(12192000)   # 13.333in → 16:9
prs.slide_height = Emu(6858000)   # 7.5in
blank = prs.slide_layouts[6]

for slide_id in order:
    s = prs.slides.add_slide(blank)
    s.shapes.add_picture(f"{render_dir}/{slide_id}.png", 0, 0,
                         width=prs.slide_width, height=prs.slide_height)

prs.save(out_path)
print(f"{len(order)} 页 → {out_path}")
`;

const r = spawnSync("python3", ["-c", py, JSON.stringify(order), RENDER_DIR, out], { redirect: "pipe", encoding: "utf8" });
process.stdout.write(r.stdout || "");
if (r.status !== 0) {
  process.stderr.write(r.stderr || "生成失败");
  process.exit(1);
}
const mb = (fs.statSync(out).size / 1048576).toFixed(1);
console.log(`pptx -> release/${path.basename(out)}  ${mb} MB`);
