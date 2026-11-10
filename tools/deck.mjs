#!/usr/bin/env node
/**
 * tools/deck.mjs — thin wrapper around the claude-slides CLI for this repo.
 *
 *   node tools/deck.mjs check           草稿校验（problems 必须为 0）
 *   node tools/deck.mjs open            启动编辑器（本机 127.0.0.1）
 *   node tools/deck.mjs serve           前台启动编辑器
 *   node tools/deck.mjs share           局域网分享，按角色输出链接
 *   node tools/deck.mjs render [id…]    把每页渲染成 1920×1080 PNG（默认全部）
 *   node tools/deck.mjs list            列出本机可用的设计系统
 *
 * 环境变量：
 *   DECK_ROOT            草稿目录，默认 designs/trae-campus
 *   CLAUDE_SLIDES_SKILL  claude-slides skill 目录（默认自动探测 ~/.agents/skills/claude-slides
 *                        和 ~/.dsh/profiles/*​/node_modules/dsh-claude-slides）
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const REPO = path.resolve(import.meta.dirname, "..");
const DECK = path.resolve(REPO, process.env.DECK_ROOT || "designs/trae-campus");

/** 找到 claude-slides 的安装目录（含 scripts/artifact.mjs 与 editor/assets/） */
function findSkill() {
  const candidates = [
    process.env.CLAUDE_SLIDES_SKILL,
    path.join(os.homedir(), ".agents/skills/claude-slides"),
    path.join(os.homedir(), ".dsh/profiles/desktop/node_modules/dsh-claude-slides"),
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "scripts/artifact.mjs"))) return c;
  }
  // 兜底：在 ~/.dsh/profiles/*/node_modules 下找一个
  const profiles = path.join(os.homedir(), ".dsh/profiles");
  if (fs.existsSync(profiles)) {
    for (const p of fs.readdirSync(profiles)) {
      const c = path.join(profiles, p, "node_modules/dsh-claude-slides");
      if (fs.existsSync(path.join(c, "scripts/artifact.mjs"))) return c;
    }
  }
  throw new Error(
    "找不到 claude-slides。装一个（npm i -g dsh-claude-slides 或 npx skills add …），" +
      "或用 CLAUDE_SLIDES_SKILL=<目录> 指过去。"
  );
}

const SKILL = findSkill();
const CLI = path.join(SKILL, "scripts/artifact.mjs");

function run(args, opts = {}) {
  const r = spawnSync(process.execPath, [CLI, ...args], { stdio: "inherit", ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function slides() {
  const deckJson = JSON.parse(fs.readFileSync(path.join(DECK, "project/deck.json"), "utf8"));
  return deckJson.order || [];
}

const [cmd, ...rest] = process.argv.slice(2);

switch (cmd) {
  case "check":
    run(["check", DECK]);
    break;
  case "open":
    run(["open", DECK, ...rest]);
    break;
  case "serve":
    run(["serve", DECK, ...rest]);
    break;
  case "share":
    run(["share", DECK, ...rest]);
    break;
  case "list":
    run(["list", REPO]);
    break;
  case "render": {
    const ids = rest.length ? rest : slides();
    for (const id of ids) {
      const r = spawnSync(process.execPath, [path.join(REPO, "tools/render-slide.mjs"), id], {
        stdio: "inherit",
      });
      if (r.status !== 0) process.exit(r.status ?? 1);
    }
    break;
  }
  default:
    console.log(
      [
        "用法: node tools/deck.mjs <命令>",
        "",
        "  check            校验草稿（problems 必须为 0）",
        "  open             启动编辑器（本机）",
        "  serve            前台启动编辑器",
        "  share            局域网分享（按角色给链接）",
        "  render [id…]     渲染成 1920×1080 PNG（默认全部，输出到 .tmp-test/render/）",
        "  list             列出本机设计系统",
        "",
        `草稿目录: ${path.relative(REPO, DECK)}  (DECK_ROOT 可改)`,
      ].join("\n")
    );
    process.exit(cmd ? 1 : 0);
}
