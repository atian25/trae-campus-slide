# AI 时代的机遇和挑战：今天的学生，如何走向明天的世界

天猪 · TRAE Campus 高校分享

一套 19 页的 16:9 幻灯片，用 [claude-slides](https://claude.ai) 的 Slides artifact 格式维护（`project/deck.json` + 一页一个 HTML，全内联样式、1920×1080 固定画布），本地用自带的编辑器改，构建成站点 + PDF 后部署到 GitHub Pages。

## 相关链接

- 在线幻灯片：<https://atian25.github.io/trae-campus-slide/>
- PDF：[《AI 时代的机遇和挑战：今天的学生，如何走向明天的世界》](<https://atian25.github.io/trae-campus-slide/AI%20%E6%97%B6%E4%BB%A3%E7%9A%84%E6%9C%BA%E9%81%87%E5%92%8C%E6%8C%91%E6%88%98%EF%BC%9A%E4%BB%8A%E5%A4%A9%E7%9A%84%E5%AD%A6%E7%94%9F%EF%BC%8C%E5%A6%82%E4%BD%95%E8%B5%B0%E5%90%91%E6%98%8E%E5%A4%A9%E7%9A%84%E4%B8%96%E7%95%8C.pdf>)
- 知乎：[《知乎问答：在 AI 盛行的时代，大学生到底要学什么、怎么学才不会被淘汰？》](https://www.zhihu.com/question/2076658003068052960/answer/2102009083041674168)
- 飞书文档：<https://my.feishu.cn/wiki/KUvWwdDzfiBI2Vkzjzwc7S6SnTe>

## 目录

| 路径 | 说明 |
| --- | --- |
| `slide/project/deck.json` | 幻灯片索引：`order`（放映顺序）、封面、字体、已装的设计系统 |
| `slide/project/slides/*.html` | 一页一个文件，`<section>` 里全是内联样式；画布 1920×1080 |
| `slide/project/assets/` | 配图（内容寻址的 blob，页面里写 `/_blob/<id>`） |
| `slide/TYPOGRAPHY.md` | 排版规范：字号档位、间距、页面预算、版式配方、高亮与链接写法 |
| `slide/AGENTS.md` | 与 AI 协作的约定（文案在编辑器里改、结构样式交给 AI 等） |
| `design-system/` | TRAE Campus 设计系统（色板 / 字阶 / 间距 / 圆角 token + 组件预览） |
| `tools/` | 校验、起编辑器、渲染预览、构建站点与 PDF 的脚本 |
| `article/` | 分享内容对应的原文快照（Markdown + 17 张配图），方便回头查原始素材 |
| `release/` | 构建产物，不进 Git：`site/` 站点目录（含 PDF） |

## 本地编辑

```sh
npm ci
npm run deck:open     # 起编辑器（127.0.0.1），在里面改文案 / 拖版式
npm run site          # 构建站点 + PDF
npm run preview       # http://127.0.0.1:8765 看构建结果
```

编辑器里改完直接保存即可，想给 AI 改结构就让它读 `slide/AGENTS.md` 的约定。

## 命令

| 命令 | 作用 |
| --- | --- |
| `npm run deck:open` | 起 claude-slides 编辑器（本机 127.0.0.1） |
| `npm run deck:check` | 校验草稿，`problems` 必须为 0 |
| `npm run deck:render` | 把每页渲染成 1920×1080 PNG（`.tmp-test/render/`，可选单页：`-- <id>`） |
| `npm run site` | 构建 `release/site/`（站点 + PDF），部署用 |
| `npm run preview` | 起本地预览 `http://127.0.0.1:8765`（服务 `release/site/`，`-- --host 0.0.0.0` 可局域网） |

线上播放页和 claude-slides 导出的 Web page 行为一致（**不再是自创的顶栏 + 滑轨**）：

- **桌面 / 横屏**：浅色留边（`#E9EDE8`）+ 幻灯片投影，一屏一页（stage 模式）
- **手机 / 竖屏**：与桌面一致，同样是左右翻页（手指左右滑、或点屏幕左右边缘）；只是画布会 letterbox 变小
- 键位：`← ↑ PgUp`、`Shift+Space` 上一页；`→ ↓ PgDn`、`Space` 下一页；`Home` / `End`；数字键跳页；`f` 全屏；`o` 概览
- 滚轮翻页（60px 阈值、250ms 合并手势）、点**左右边缘 15%** 翻页（中间不响应）、触屏左右滑
- **底部控制条**（参考 skill 演示态）：`‹ N / 20 ⓘ › | ⊞ ⤢ ✕` —— 翻页、快捷键帮助、概览、全屏、收起
- **概览**：按 `o` / `Esc` / 点控制条 `⊞` → 缩略图网格，点击跳页，`Esc` / 点空白关闭
- 深链 `#7` 直达第 7 页；支持 `data-transition` 的 fade / push / magic 与 `data-build-in` 入场动画
- 打印 / PDF 走 `@media print`，仍是一页一张

## 修改内容

- **改文案**：编辑器里直接改（推荐），或改 `slide/project/slides/<id>.html`
- **改版式**：字号只用 24 / 25 / 30 / 41 / 56 / 104，间距、页面预算和现成配方见 [`slide/TYPOGRAPHY.md`](slide/TYPOGRAPHY.md)
- **加页面**：新增 `slide/project/slides/<id>.html`，再把 id 加进 `project/deck.json` 的 `order`
- **加图片**：用编辑器上传（会落到 `project/assets/`），页面里用 `/_blob/<id>` 引用
- **配色**：米白底 `#F7F8F5`、薄荷 `#BFF2D2` / `#2FAE72`、深绿 `#0B3A29`，一页最多两处高亮

## 自动部署

`.github/workflows/deploy.yml`，push 到 `main`（或手动触发）后执行：

`npm ci` → `npm run site`（构建站点 + 用无头 Chrome 打印 PDF）→ 发布到 GitHub Pages

站点和 PDF 都随 Pages 一起发，PDF 用中文文件名（GitHub Release 会把非 ASCII 文件名剥掉，所以不走 Release）。

## 约定

- 不用「——」，标题不重复，语气保持口语化
- 页码在右上、章节眉标在左上
- 改完 deck 记得 `npm run deck:check`；文案改完让 AI 重新读文件再改结构（编辑器会整页重写）
