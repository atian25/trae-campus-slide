#!/usr/bin/env node
/**
 * tools/watch-slides.mjs — 盯着 slide 页文件，改动后自动跑语义守卫。
 *
 * 你不需要敲任何命令：这个进程在后台跑着，只要你在编辑器里保存过某一页，
 * 它就会在 1.5s 内检查「相比上次正常状态，有没有丢 object-fit / data-video / CSS」，
 * 有问题就：
 *   1. macOS 弹通知（标题「Slide 语义丢了」）
 *   2. 把清单写到 .tmp-test/guard-status.json（AI 和我都能读）
 *   3. 终端里打印出来
 *
 * 用法：
 *   npm run watch              # 前台跑，Ctrl+C 退出
 *   npm run watch -- --quiet   # 只在出问题时打印
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SLIDES = path.join(REPO, "slide/project/slides");
const STATUS = path.join(REPO, ".tmp-test/guard-status.json");
const QUIET = process.argv.includes("--quiet");

fs.mkdirSync(path.dirname(STATUS), { recursive: true });

const ts = () => new Date().toLocaleTimeString("zh-CN", { hour12: false });

function notify(title, body) {
  try {
    const esc = (s) => s.replace(/"/g, '\\"');
    spawnSync("osascript", [
      "-e",
      `display notification "${esc(body)}" with title "${esc(title)}" sound name "Glass"`,
    ], { stdio: "ignore" });
  } catch {}
}

let timer = null;
let lastRun = 0;

function runGuard(reason) {
  const r = spawnSync("node", [path.join(REPO, "tools/guard-slides.mjs")], {
    cwd: REPO,
    encoding: "utf8",
  });
  const out = ((r.stdout || "") + (r.stderr || "")).trim();
  const failed = r.status !== 0;
  const summary = failed
    ? out.split("\n").filter((l) => l.trim()).slice(-12).join("\n")
    : "无语义丢失";

  fs.writeFileSync(
    STATUS,
    JSON.stringify({ at: new Date().toISOString(), reason, ok: !failed, output: out }, null, 2)
  );

  if (failed) {
    console.log(`\n[${ts()}] ⛔ ${reason} → 语义丢失`);
    console.log(summary.split("\n").map((l) => "  " + l).join("\n"));
    notify("Slide 语义丢了", "编辑器保存后检测到声明丢失，看终端或 .tmp-test/guard-status.json");
  } else if (!QUIET) {
    const changed = /没有改动过的 slide/.test(out) ? "（无改动）" : "";
    console.log(`[${ts()}] ✓ ${reason}${changed}`);
  }
}

function watch() {
  console.log(`\n  👀 监视 ${path.relative(REPO, SLIDES)}/ —— 编辑器保存后自动检查语义（Ctrl+C 退出）\n`);
  runGuard("启动检查");

  fs.watch(SLIDES, { persistent: true }, (event, file) => {
    if (!file || !file.endsWith(".html")) return;
    const now = Date.now();
    if (now - lastRun < 800) return; // 编辑器一次保存会触发多次事件
    clearTimeout(timer);
    timer = setTimeout(() => {
      lastRun = Date.now();
      runGuard(`改动 ${file}`);
    }, 1200);
  });

  // 兜底：每 5 分钟再查一次（防止 fs.watch 丢事件）
  setInterval(() => runGuard("定时复查"), 5 * 60 * 1000);
}

watch();
