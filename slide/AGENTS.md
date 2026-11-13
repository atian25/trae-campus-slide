#  协作约定（人 ↔ AI）

这份文件管 `slide/` 下的东西：**claude-slides 幻灯片**（`trae-campus/`）与**设计系统**（`trae-campus-ds/`）。
仓库根的 [`AGENTS.md`](../AGENTS.md) 管的是老的 `slide/deck.html` 那套（`--u` 单位、Pages 发布）；两边不冲突时各自生效。

---

## 1. 分工：文案归人，结构/样式归 AI

- **文案由人在编辑器里改**（标题、正文、措辞、加删句子）—— 直接改最快，不用每次走对话。
- **结构/样式/版式/token/文档由 AI 改** —— 人不需要手写 `<section>` 里的内联样式。
- 既要改结构又要改文案时：先让 AI 调结构，人再在编辑器里过一遍文字；或者一次说清让 AI 一起做。
- 页面**新增/删除/换顺序**属于结构，找 AI 做（要同时改 `project/deck.json` 的 `order`）。

## 2. 关键：编辑器会重写文件（务必知道）

在编辑器里改任何东西并保存，编辑器会把**整页**按它的规范化格式重写：

| 你写的 | 编辑器存成 |
| --- | --- |
| `padding:67px 77px 62px 77px` | `padding:67px 77px 62px`（CSS 简写合并，视觉等价） |
| 紧凑无空格的 style | 加空格、属性重排、每个文本元素补 `font-family:…` |
| `#0B4A32` | `#0b4a32` |
| `border-radius:50%` | `border-radius:256px`（视觉等价） |

**结论与约定：**

1. **AI 改结构前必须先读当前文件**，不要凭上次记忆去替换字符串（十有八九已被重写）。
2. 人改完文案，在对话里说一句「我改了第 N 页的文案」，AI 会重新读文件再动手。
3. **双方不要同时改同一页**：人开着编辑器编辑某页时，AI 别去批量重写那一页；AI 改完文件后，编辑器会提示「磁盘已变更」，人刷新即可。
4. 想做「最终格式化」（把编辑器规范化后的格式收回统一风格）：让 AI 在页定稿后统一做一次，然后人**只改文字**就不会再动结构。

## 2.5 编辑器重写 vs AI 改动：怎么共存

编辑器保存时会把整页交给它的规范化器重写，**只改格式**（换行重排、属性顺序、圆角/颜色归一），
内容不变 —— 所以每次「AI 改完 + 你在编辑器保存」后，`git diff` 会出现一堆纯排版差异，这是正常的。

**风险**：规范化器也可能**静默丢弃**它不认识的声明（`object-fit`、`mix-blend-mode`、`data-video`…），
那会悄悄坏版式。所以：

| 场景 | 做法 |
| --- | --- |
| 小改（文案/间距） | AI 改完直接提交，commit 里注明「含编辑器格式化」即可 |
| 大改（结构/加页/改版式） | AI 改完 → 你在编辑器打开该页保存一次 → AI 再提交（仓库即编辑器格式） |
| 任何编辑器保存之后 | 跑 **`npm run guard`**：语义抽取对比 HEAD，丢了什么会逐条列出来 |

`npm run guard` 的输出示例：

```
✗ ai-physical.html 相比 HEAD 丢了 1 项语义：
    CSS（1）:
      - object-fit:contain
```

按清单把丢掉的那几行补回去（通常 1–3 行），再 `npm run doctor` 确认全绿。
`npm run guard:all` 可全量体检 22 页；`npm run doctor` 里也带了这一项。

## 3. AI 每次开工的动作

```bash
# 1. 读索引和要改的页
cat slide/project/deck.json
cat slide/project/slides/<id>.html

# 2. 改完必须 check 到 problems: 0
npm run deck:check

# 3. 需要看效果就渲染（1920×1080 PNG → .tmp-test/render/<id>.png）
npm run deck:render -- <id>      # 单页
npm run deck:render              # 全部
```

- 体检（claude-slides 升级后先跑）：`npm run doctor` —— 检查安装 / deck 格式 / 图标 / 资产 / check
- 起编辑器：`npm run deck:open`（= `node tools/deck.mjs open`，本机 127.0.0.1）
- 局域网分享（按角色出链接）：`node tools/deck.mjs share`
- 这些脚本是 `tools/deck.mjs` 的薄封装，内部调用本机 claude-slides 的 `artifact.mjs`；
  找不到安装目录时用 `CLAUDE_SLIDES_SKILL=<目录>` 指定。
- **改完不要自动提交**：这个 deck 属于「大改动」，按根 `AGENTS.md` 的规则等人确认（现在整份 `slide/` 都还是未跟踪状态）。

## 4. 样式规范看哪儿

- **版式 / 字号 / 间距 / 页面预算 / 版式配方**：`slide/TYPOGRAPHY.md`
  - §5.9 高亮（薄荷划线）的 stop 换算公式 —— 换行高就要重算，别照抄百分比
  - §5.10 链接写法 —— `<a>` 只能拿一条 plain underline，线色靠 anchor 的 `color` 染
- **色板 / 字阶 / token / 比例规则**：`design-system/project/README.md`
- 速查：字号只用 **24 / 25 / 30 / 41 / 56 / 104**；正文最小 24。

## 5. 踩过的坑（别重复）

1. **局域网 http 打开编辑器会白屏报错** `crypto.randomUUID is not a function`：编辑器要安全上下文，只能用 `http://127.0.0.1:<port>`，或者自己套一层 https 反代（自签证书）。
2. **`<a>` 不能设 `text-decoration`**（会报 unsupported），也不能用块级 `<a>`；胶囊按钮里也不行。
3. **空且未上色的定宽 div 会被丢弃**：要留白就给 `background`（与页面同色）或用 `gap`。
4. **`margin` 是 no-op**；`padding` 每个值都要带 `px`，否则整条声明被丢。
5. **负偏移会被夹成 0**；需要溢出/外挂的元素提到 section 级用画布坐标。
6. 编辑器打开过的页会被规范化（见 §2），所以**文件内容和"你以为的样子"会漂**。

## 6. 不要碰的

- `project/assets/`（图片 blob）、`project/ds/`（设计系统拷贝）：由工具写。
- 运行时 sidecar：`comments.json`、`.sharing.json`、`.artifact-server.json`、`.artifact-server.log`、`history/`、`exports/` —— 已在 `slide/.gitignore` 里。
- 增删页只改两处：`project/slides/<id>.html` 文件 + `project/deck.json` 的 `order`（`cover` / `sections.start` 指向的 id 也要跟着改）。

## 7. 站点播放层（`release/site`，线上给观众的版本）

`npm run site` 构建 `release/site/`（页面 + PDF），`npm run preview` 在 `127.0.0.1:8765` 预览 —— **和线上同一份产物**，验收看这个，不是编辑器的 Present。

播放层约定（`tools/build-site.mjs` 的模板，改行为只改这里）：

| 能力 | 规则 |
| --- | --- |
| 翻页 | 键盘 `←/→/PgUp/PgDn/空格`、滚轮、触摸滑动；**点了左右边缘不再翻页**（曾经有，和点图放大冲突，已移除） |
| 图片放大 | 只对白名单页面生效：`ZOOM_PAGES = ['ai-digital','ai-physical','learn-1','learn-2']`；放大层是全屏半透明蒙层 + 图片居中（无盒子），点任意处 / `Esc` 关闭 |
| 放大时的键盘 | 方向键/空格 = **只关闭放大**，不翻页；数字键 = 关闭放大后跳页 |
| 视频 | `img[data-video]` 进入页面自动播放；`→` 播放中=暂停、已暂停=翻页；点视频进放大视图（放大里点视频=播放/暂停）；放大时卡片视频暂停，关闭后只有「放大仍在播」才恢复 |
| 外链 | 自动 `target="_blank" rel="noopener noreferrer"`，全局去下划线（hover 才出现） |
| 演讲者窗口 | 按 `P` 打开 `?presenter=1`：当前页 + **`<aside>` 演讲备注** + 下一页预览 + 计时器 + 键位提示，`BroadcastChannel` 同步 |
| 概览 | 按 `O` / `Esc`：缩略图网格 + 尺寸滑轨（顶部工具行垂直居中），点缩略图跳页，**点任意空白关闭** |
| 备注 | deck 里的 `<aside>` 不画在页面上（`.slide aside{display:none}`），只喂给演讲者窗口 |

验收与发布：

1. 改完：`npm run deck:check`（problems 必须 0）→ `npm run site` → 浏览器看 `http://127.0.0.1:8765/#<页号>`。
2. 小改动**改完直接 commit + push**；CI 用 `gh run list --limit 1` 查一眼即可，**不要阻塞等待**（用户明确要求过）。
3. 发布失败重跑时要小心：`gh run rerun` 会造成 `Multiple artifacts named "github-pages"`，**要重跑就提交一个空 commit**。
4. 上线后自检：`curl -s https://atian25.github.io/trae-campus-slide/ | grep <关键词>`。

## 8. 素材规范（图片 / 视频）

- 图片按卡片图区比例出图，**默认 `object-fit:contain` 不裁切**（`cover` 会切掉截图边缘）。
- 截图先削掉约 0.6–0.8% 的边，去掉自带的 1px 黑框/白框。
- 需要补边时按卡片底色补（白卡补白、淡绿卡 `#E7EFE8` 补同色），补完看不出接缝。
- 视频：≤20MB、mp4/webm；静帧截自视频本身（不要带播放按钮）。大文件放 `slide/project/inbox/`（已 gitignore），处理完删掉。
- `artifact.mjs upload` 只收图片/字体，视频要手动登记进 `project/assets/`（见 `TYPOGRAPHY.md` §5.12）。

## 9. 现状（2026-11-12）

- `slide/`：**22 页**（新增第 7、8 页「AI 之变」两页；第 17、18 页改版）。页面顺序见 `project/deck.json` 的 `order`。
- `design-system/`：TRAE Campus 设计系统（namespace `traecampus`，已装进 deck 的 `project/ds/traecampus/`）。
- 验证/渲染脚本在 `tools/`，npm 脚本见 §3；`tools/render-slide.mjs` 会从本机 claude-slides 安装里读
  图标字体（Anthropicons-Variable）和字形表，不往仓库里拷字体。
- 老的 `slide/deck.html`（18 页单文件版）保持不动，Pages 仍发布那版。
