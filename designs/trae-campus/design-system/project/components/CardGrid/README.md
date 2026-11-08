# Card Grid

四宫格卡片：2×2 等分卡片，编号 + 图标砖 + 卡片标题 + 两行正文，用于并列的四步或四类信息。

## 用途

把「一条路径的四个阶段」或「四类做法」摊平在一页里。每张卡结构完全一致，读者可以横向对比、纵向按编号阅读。2×2 之外的变体（2 栏图片卡）见 README 的 card-grid-2。

## 结构

1. **页头**：与 Content Page 相同（眉标 + 56px 标题 + 一行副标题 + 分隔线，约 210px）。
2. **主体**：`flex:1`，`display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:43px`；每格 `(1766 − 43) / 2 = 861.5 × (700 − 43) / 2 = 328.5`。
3. **单卡**：`border-radius:24px`、`padding:48px 53px`、纵向居中。
   - 顶部行：编号（24px / 1.2 / 800 / 字距 1.2px / `text-subtle`）→ 图标砖 `50×50`、`radius:13px`、`background:surface`、线性图标 25×25 / 1.8px / `text-on-mint` → 卡片标题（`card` 档 41px / 1.3 / 800 / -0.5px，`text-ink`，关键词用 `accent-text`）。
   - 正文：25px / 1.95 / 400 / `text-body`，左缩进 42px（与编号对齐），两行，用 `<br>` 断行。
4. **四张卡底色依次**：`surface-card` → `surface-card-alt` → `surface-card-mint` → `surface-mint`，形成由中性到薄荷的渐次强调。

## 数值

| 项 | 值 |
| --- | --- |
| 栅格 | 2 × 2，`gap:43px`，每格约 861.5 × 328.5 |
| 卡片内边距 | 48px 53px |
| 圆角 | `radius-card` 24px |
| 图标砖 | 50 × 50，`radius-icon` 13px，白底 `surface` |
| 图标 | 25 × 25，viewBox 24，1.8px 描边，`text-on-mint` |
| 编号 | 24px / 1.2 / 800 / 1.2px |
| 卡片标题 | 41px / 1.3 / 800 / -0.5px |
| 正文 | 25px / 1.95，左缩进 42px |

## 规则

- 卡片数量固定 4 张：3 张就改用 duo-panels + 一张满宽，5 张以上拆页。
- 编号用两位数 `01`–`04`，不用圆点、不用方框；编号颜色 `text-subtle` 而不是品牌绿。
- 每张卡正文控制在两行内（约 24–28 个汉字/行）；超过两行说明信息该拆页或改版式。
- 卡片标题里的「关键词」用 `accent-text`；只有整块面板需要强调时才把底色换成 `surface-mint`，不叠加高亮带。
- 卡片之间只用 `gap`，不要给卡片加 `margin`、描边或阴影。

## 不要这样做

- 不要做成 4 张等宽等高但内部排版各不相同的「模板拼贴」——每张卡的编号、图标砖、标题、正文位置必须严格对齐。
- 不要用 emoji 充当图标；图标是 1.7–1.8px 线性描边，不用填充图标。
- 不要把图标砖底色换成 `accent-highlight`，50×50 白底是这套系统的识别点。

## 消费者提供

四个阶段的标题与两行正文、四个线性图标（或从 README 的图标清单里取），以及高亮关键词的位置。

## 预览

`preview.html` 是一张 1920×1080 画布，外层 480×270 + `overflow:hidden`，内部 `transform:scale(0.25)`；只引用 `../../tokens.css`，静态、无脚本、无外部资源。
