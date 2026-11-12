# AGENTS.md

给在本仓库工作的 AI / 协作者的要求。

## 提交规则（重要）

- **小改动 / 修复**：本地验证通过后（构建、关键尺寸截图或自测），直接 `git commit` 并 **`git push`**（push 会触发 GitHub Pages 发布，这是预期行为）。
- **大改动 / 需要我拍板或调试的**（改版式、改文案结构、加依赖、改部署流程）：**先不要提交**，把改动留在工作区，并在回复里明确写出「未提交 + 原因 + 需要我确认什么」；等我确认后再提交 / 推送。
- 提交信息用中文，一行说清「做了什么 / 为什么」，必要时补正文。
- 提交前跑 `git status`，确认没有把 `.tmp-test/`、临时截图等带进去。

## slide/（幻灯片）与 design-system/

- `slide/`：幻灯片本体，claude-slides 的 Slides artifact 格式（`project/deck.json` + 一页一个 HTML，
  1920×1080 固定画布、全内联样式）。**22 页**，顺序见 `project/deck.json` 的 `order`。
- `design-system/`：TRAE Campus 设计系统（token + 组件预览），deck 里装了一份拷贝在 `slide/project/ds/traecampus/`。
- **协作约定**（文案在编辑器里改、结构/样式交给 AI、编辑器会整页重写文件）见 [`slide/AGENTS.md`](slide/AGENTS.md)，
  在 `slide/` 下工作时先读它。
- 排版规范见 [`slide/TYPOGRAPHY.md`](slide/TYPOGRAPHY.md)：字号只用 24 / 25 / 30 / 41 / 56 / 104（tip 小字可 22），
  间距用 `gap`/`padding`（`margin` 无效），页面预算 = 页头约 205 + 正文 746 + 页脚 62。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run deck:open` | 起 claude-slides 编辑器（只有 `127.0.0.1` 能用；局域网需 https） |
| `npm run deck:check` | 校验草稿，`problems` 必须为 0 才提交 |
| `npm run deck:render` | 每页渲染成 1920×1080 PNG（`.tmp-test/render/`；`-- <id>` 渲染单页） |
| `npm run site` | 构建 `release/site/`（站点 + PDF），CI 用它发布 |
| `npm run preview` | 本地预览 `release/site`（127.0.0.1:8765）——**验收看这个，不是编辑器 Present** |

- 工具脚本在 `tools/`：`deck.mjs`（check/open/share/render）、`render-slide.mjs`（单页渲染）、
  `build-site.mjs`（站点 + PDF；播放层对齐 claude-slides 导出的 Web page：黑底一屏一页 / 竖屏纵向滚动 / 右下角页码 / f 全屏）、`serve.mjs`（本地预览）。
- 图标字体与字形表内置在 `tools/assets/`（anthropicons.woff2 + json），CI 无需装 claude-slides；
  本地若想用安装里的新版可删掉这两个文件，脚本会回落到 `CLAUDE_SLIDES_SKILL` / `~/.agents/skills/claude-slides`。
- 发布：push 到 `main` 触发 `.github/workflows/deploy.yml` → `npm ci` + `npm run site` → GitHub Pages。

## 验收

- `npm run deck:check` 的 `problems` 为 0，且没有任何 `排版` / 警告 note。
- 改了版式就 `npm run deck:render`，检查页面内容不溢出（内容下沿 ≤ 1018px，安全线）。
- 改完文案至少看一眼渲染图；不要在编辑器开着的同一页上做批量结构改动。

## 部署与验收（重要）

- **小改动改完直接 commit + push**；push 后 CI 用 `gh run list --limit 1` 查一眼即可，**不要阻塞等待**。
- 发布失败要重跑时：**提交一个空 commit**，不要 `gh run rerun`（会产生重复 artifact 报错）。
- 播放层能力 / 素材规范见 [`slide/AGENTS.md`](slide/AGENTS.md) §7–§8；版式配方见 [`slide/TYPOGRAPHY.md`](slide/TYPOGRAPHY.md) §5.10–§5.12。
