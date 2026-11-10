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

## 7. 现状（2026-11-10）

- `slide/`：**19 页**（1600×900 单文件版是 18 页，这里把第 7、8 页换成了改版，
  另新增 1 页 `mindset`）。页面顺序见 `project/deck.json` 的 `order`。
- `design-system/`：TRAE Campus 设计系统（namespace `traecampus`，已装进 deck 的 `project/ds/traecampus/`）。
- 验证/渲染脚本在 `tools/`，npm 脚本见 §3；`tools/render-slide.mjs` 会从本机 claude-slides 安装里读
  图标字体（Anthropicons-Variable）和字形表，不往仓库里拷字体。
- 老的 `slide/deck.html`（18 页单文件版）保持不动，Pages 仍发布那版。
