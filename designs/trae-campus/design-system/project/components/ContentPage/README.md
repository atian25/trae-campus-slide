# Content Page

标准内容页：眉标 + 页标题 + 一行副标题 + 700px 主体，是其余 7 种版式的共同骨架。

## 用途

绝大多数分享页都用它：先给结论（页标题），再给一句解释（副标题），下面用具体版式承载内容。8 种版式里的 profile / content-figure / card-grid / numbered-rows / duo-panels / flow / cases 都复用这个页头。

## 结构

1. **画布**：1920×1080，`padding: 67px 77px 62px 77px`，`display:flex; flex-direction:column; gap:41px`。
2. **页头**（约 210px）：眉标行（13px 圆点 `accent-brand` + `label` 档 24px / 1.2 / 600 / 字距 2.4px / `accent-eyebrow`）→ 页标题（`title` 档 56px / 1.38 / 800 / -1.2px，`padding-top:17px`）→ 副标题（24px / 1.6 / 400 / `text-body-soft`，`padding-top:17px`）→ `padding-bottom:31px` + 1px `line` 分隔线。
3. **主体**：`flex:1`，高度 700px = 951 − 210 − 41。内容版式决定了主体怎么排（见 README 的 8 种版式）。

## 数值

| 项 | 值 |
| --- | --- |
| 版心 | 1766 × 951（`padding: 67px 77px 62px 77px`） |
| 页头 | 约 210px，下边距 41px |
| 主体 | 700px（`flex:1`） |
| 眉标 | 圆点 13px + 24px / 1.2 / 600 / 2.4px |
| 页标题 | 56px / 1.38 / 800 / -1.2px |
| 副标题 | 24px / 1.6 / 400，与标题间距 17px |
| 分隔线 | 1px `line`，在页头底部 |

## 主体槽位（本预览用「图文两栏」示范）

- 左图：`768 × 301`，`radius-figure`、`surface-card-alt`、1px 虚线 `line` —— 图片不随本系统分发，这里用占位块标注槽位尺寸。
- 右文：`1fr`，`gap:67px`；条目为 `padding:24px 0` + 1px `line` 上边框（最后一条补下边框），条目标题 `lead` 档 30px 并用薄荷下划线高亮，正文 24px / 1.9 / `text-body`、左缩进 22px。

## 规则

- 页标题每页只有一个；56px 是画布高 1080 的 0.052 倍，不要为了塞内容把标题降到 41px——先删内容，再拆页。
- 副标题只写一句，宽度不设限但不要换三行；标题里不加句号。
- 一页最多两处薄荷高亮（`accent-highlight` 渐变带或胶囊）；连续两条以上改用 `surface-card-mint` 面板。
- 主体必须显式 `flex:1` 撑满，不要用 `margin-top` 挤位置；间距一律用父级 `gap` 或自身 `padding`。
- 图片一律写死 px + `object-fit`：照片/截图 `cover`，图表/插画 `contain`；行稿插图加 `mix-blend-mode:multiply`。
- 正文最小 24px（平台硬规则），任何情况下不得低于。

## 不要这样做

- 不要两行眉标、不要标题下再叠一段 24px 的「引言」——那是编号行或引用块的工作。
- 不要把页头分隔线画成双线或虚线；只有主体里的「占位槽」允许虚线。
- 不要用 `accent-brand` 写正文（对比度 2.66:1），当文字用 `accent-text` 或 `text-on-mint`。

## 消费者提供

页标题、眉标文字（可省略）、副标题（可省略）、主体内容的版式选择，以及真实图片（本系统只提供槽位尺寸）。

## 预览

`preview.html` 是一张 1920×1080 画布，外层 480×270 + `overflow:hidden`，内部 `transform:scale(0.25)`；只引用 `../../tokens.css`，静态、无脚本、无外部资源。
