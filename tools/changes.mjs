#!/usr/bin/env node
/**
 * tools/changes.mjs — 提交前一眼看清：哪些页变了、是「只改了文字」还是「动了结构」。
 *
 * 用途（并发编辑时尤其重要）：你在编辑器里改文案、AI 同时改样式，
 * 提交前跑这个，能区分：
 *   · 文案改动（你的）—— 只有文字差异
 *   · 结构/样式改动（AI 的）—— 有标签/属性/内联样式的差异
 *
 * 用法：
 *   npm run changes
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SLIDES = path.join(REPO, "slide/project/slides");

function git(args) {
  return execFileSync("git", args, { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

const changed = git(["status", "--porcelain", "--", "slide/project/slides"])
  .split("\n")
  .filter(Boolean)
  .map((l) => ({ code: l.slice(0, 2).trim(), file: path.join(REPO, l.slice(3).trim()) }))
  .filter((x) => x.file.endsWith(".html"));

if (!changed.length) {
  console.log("\n  没有 slide 改动\n");
  process.exit(0);
}

function textOf(html) {
  return html
    .replace(/<svg[\s\S]*?<\/svg>/g, " ")
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function fmtTime(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

console.log("");
for (const { code, file } of changed) {
  const name = path.basename(file);
  const cur = fs.readFileSync(file, "utf8");
  let head = "";
  try { head = git(["show", `HEAD:${path.relative(REPO, file)}`]); } catch {}
  const mtime = fmtTime(fs.statSync(file).mtimeMs);

  if (!head) {
    console.log(`  + ${name.padEnd(22)} ${code}  新文件  ${mtime}`);
    continue;
  }

  const curText = textOf(cur);
  const headText = textOf(head);
  const textChanged = JSON.stringify(curText) !== JSON.stringify(headText);

  // 结构判定：去掉文字后剩下的骨架（标签/属性/样式）是否变化
  const skeleton = (h) => h.replace(/>[^<>]*</g, "><").replace(/\s+/g, " ");
  const structChanged = skeleton(cur) !== skeleton(head);

  const tag = structChanged ? "结构/样式" : textChanged ? "只改文字" : "仅格式（等价）";
  const hint = structChanged ? "← AI 的改动" : "← 你的文案";
  console.log(`  ${name.padEnd(22)} ${code}  ${tag.padEnd(10)} ${hint}  ${mtime}`);
}
console.log("\n  提交时只挑自己的文件：git add slide/project/slides/<page>.html\n");
