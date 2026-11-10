# TRAE Campus 设计系统

TRAE Campus 校园分享的视觉系统。它从单文件幻灯片 `slide/deck.html`（原版 1600×900、`calc(var(--u)*N)`）里提炼而来，按 1920×1080 重新标注：**16:9、无衬线中文、米白纸面、薄荷高亮、深绿收尾**。这套系统只包含颜色、文字、间距、圆角、尺寸与版式规则，不含任何图片资产。

- 画布：1920 × 1080，四周不留安全边，所有数值都是最终 px。
- 字号：封闭七档，`24 / 25 / 30 / 41 / 56 / 104`。
- 颜色：一个 light 主题、23 个语义 token；深浅两种页面都由同一套 token 表达。
- 语气：直接、具体、带一点工程师的自嘲；标题是陈述句，副标题补上下文，不用感叹号堆情绪。

## 1. 色彩

用法三条：**一页最多两处薄荷高亮**；**品牌绿只做圆点/填充/描边，当文字一律用 accent-brand-deep**；**正文只用 text-body 三档**，次要信息才降到 text-muted。

| token | 值 | 用途 |
| --- | --- | --- |
| `surface` | `#F7F8F5` | 页面底色（米白） |
| `surface-card` | `#EAECEA` | 卡片底（中性） |
| `surface-card-alt` | `#E8EDEA` | 卡片底（交替） |
| `surface-card-tint` | `#E5EEE8` | 卡片底（薄荷调） |
| `surface-mint` | `#DFF1E6` | 浅薄荷：pill / 标签 / 讲者 |
| `surface-inverse` | `#0B3A29` | 反白页底色 |
| `text-ink` | `#141C18` | 标题墨色 |
| `text-ink-deep` | `#0B3A29` | 深墨绿：强调标题、加粗、图标 |
| `text-body` | `#3B463F` | 正文主色 |
| `text-body-soft` | `#4A544E` | 正文次级 / 副标题 |
| `text-body-quiet` | `#5A645E` | 正文弱化 / 注释 |
| `text-muted` | `#63736B` | 次要信息 / 编号 |
| `text-faint` | `#A7B3AC` | 极弱装饰文字（24px+） |
| `accent-brand` | `#2FAE72` | 品牌绿：圆点、填充、描边（**不当文字**） |
| `accent-brand-deep` | `#17754A` | 当文字用的绿：编号、链接、强调字 |
| `accent-eyebrow` | `#3C6B52` | 眉标绿 |
| `accent-mint` | `#BFF2D2` | 薄荷高亮填充 |
| `accent-mint-soft` | `#A6ECC0` | 高亮加深 / hover |
| `inverse-text` | `#D6EFE2` | 反白页正文与大字 |
| `inverse-muted` | `#7FB49A` | 反白页弱标签、装饰线 |
| `line` | `#D9E1DC` | 细线主色：页头分类线、分隔线 |
| `line-soft` | `#DCE3DE` | 细线浅色：行分隔 |
| `white` | `#FFFFFF` | 图标底、反白页最高对比文字 |

对比度事实：`accent-brand` 在 `surface` 上只有 2.66:1，所以它**永远不是文字色**；`accent-brand-deep` 是 14:1，编号与链接都用它。反白页上 `inverse-text` 约 12:1、`inverse-muted` 约 6.4:1。正文三档在纸面上分别约 9.3 / 7.3 / 5.8:1，都过 4.5:1 的正文线。

## 2. 文字

字体只有一条栈：`'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Source Han Sans SC', system-ui, sans-serif`。中文走 Google Fonts 的 Noto Sans SC，本系统不落字体文件；等宽字体只用于链接、代码、数字串，走系统等宽（SF Mono / Menlo / Consolas）。

| 档位 | 字号 | 字重 | 行高 | 字距 | 使用场景 |
| --- | --- | --- | --- | --- | --- |
| `display` | 104px | 800 | 1.2 | -3px | 仅封面 h1，一页一处 |
| `title` | 56px | 800 | 1.35 | -1.2px | 每页页面标题 h1 |
| `card` | 41px | 800 | 1.4 | -0.6px | 卡片 / 栏目标题、封面副标题、胶囊名字 |
| `lead` | 30px | 800 | 1.5 | -0.4px | 步骤标题、操作句、流程节点 |
| `body` | 25px | 400（强调 700） | 1.75 | 0 | 正文、列表项 |
| `caption` | 24px | 400 | 1.7 | 0 | 副标题 sub、图注、说明 |
| `label` | 24px | 600 | 1 | 2.4px | 眉标、编号、小标签 |

字号是封闭集合：全篇只有 `24 / 25 / 30 / 41 / 56 / 104` 六个值，**不允许第 7 个字号**（48、33、27 之类都不行）。正文最小值是 24px；放不下时先改间距，不要压字号。

从原版 1600 宽换算的档位表（照这张表归并，不要自己发明）：

```
原 8–18px      → 24  (label / caption)
原 18.5–22.5px → 25  (body)
原 23–28px     → 30  (lead)
原 29–40px     → 41  (card)
原 41–60px     → 56  (title)
原 61px 以上    → 104 (display)
```

### 页头配方（每页原样复用，只改文字）

```
眉标行：13×13 圆点（accent-brand，radius-pill）+ label 24/600/2.4px（accent-eyebrow）
标题行：h1 56/800/-1.2px（text-ink）
副标题：p 24/400/1.7（text-body-soft），没有就整段删
间距：圆点与文字 12px；三行之间 17px；页头 padding-bottom 31px + 1px line 分类线
高度：有副标题 205px（24 + 17 + 76 + 17 + 41 + 31）；无眉标的页 164px
```

## 3. 版心与栅格

```
┌──────────────────────────────────────────────┐ 1920 × 1080
│ 67                                          │
│   77 ┌────────────────────────────────┐ 77 │
│      │ 页头 205px（含分类线）          │    │
│      ├────────────────────────────────┤    │
│      │ 主体 746px（flex:1，净高）      │    │
│      └────────────────────────────────┘    │
│ 62                                          │
└──────────────────────────────────────────────┘
```

- 版心宽 **1766 = 1920 − 77 × 2**；版心高 951。
- 页面预算：**1080 = 67（上内距）+ 205（页头）+ 746（主体）+ 62（下内距）**。主体净高就是 746px。
- 两栏：`768 + 67`（常规图文，原版 640+56）、`792 + 67`（左图略宽）、`960 + 67`（海报/大图，原版 800+56）、`564 + 62`（窄图 + 步骤）。
- 2×2 网格间距 43（原版 36×1.2）；四行列表行内列宽 `41 / 310 / 1fr`，列间距 29。
- 卡片内距 48 × 53（原版 40×44）；卡片圆角 22（见比例规则）。

## 4. 八种版式

八种版式可以拼出全部 18 页。每种都建立在「页头 205 + 主体 746」上，页头配方见 §2。

### 4.1 页头（所有内容页的骨架）

- 结构：`flex column`，`gap: 17px`，`padding-bottom: 31px`，`border-bottom: 1px solid line`。
- 三行：眉标（13 圆点 + label）→ 标题（title）→ 副标题（caption，可删）。
- 用于：02–16 页；17–18 页删掉眉标行，页头 ≈ 164。

### 4.2 双栏图文

- 结构：主体 `display:grid`，`grid-template-columns: 768px 1fr`，`gap: 67px`，`align-items: center`。
- 左列：一张图或一块 `surface-card-tint` 面板，宽 768，图圆角 17/19，图注用 caption（text-faint 或 text-body-quiet）。
- 右列：1–2 个 item；每个 item `padding: 24px 0`，item 之间 1px `line` 分隔；item 标题 lead（可加薄荷高亮），正文 body（text-body）。
- 变体：左列换 792 / 960 时 gap 仍 67；正文段落多时左列收窄、右列加 `padding-right: 34px`。
- 用于：06 时代变革、16 校园 Token、17 结尾。

### 4.3 2×2 卡片

- 结构：主体 `display:grid`，两列两行（`1fr 1fr` × 2），`gap: 43px`，`padding-top: 41px`。
- 卡片：`radius: 22px`，`padding: 48px 53px`，`flex column` + `justify-content:center`；底色依次 `surface-card → surface-card-alt → surface-card-tint → surface-mint`。
- 顶行：编号（label，text-muted）+ 图标底 50×50（`white`，radius 13，内置 25px 图标）+ 标题（card 41/800）。
- 正文：body 25/1.75（text-body），`padding-left: 42px` 与标题左缘对齐。
- 用于：04 传统路径。

### 4.4 四行列表

- 结构：主体 `flex column`；每行 `flex:1`，`display:grid`，列宽 `41px 310px 1fr`，`column-gap: 29px`，`align-items:center`，`padding: 19px 0`，行间 1px `line-soft`。
- 每行：编号（label，text-faint）→ h3（card 41/800，可带 40px 图标）→ 说明（body，text-body-quiet，`padding-right: 26px`）。
- 最后一行落一句 punchline，用薄荷高亮压住。
- 用于：05 当代大学生的困境。

### 4.5 三节点流程

- 结构：`display:grid`，`grid-template-columns: 1fr 67px 1fr 67px 1fr`（67 是箭头列），`align-items:stretch`。
- 节点：`surface-card` / 中间节点 `surface-card-tint`，`radius: 22px`，`padding: 41px 48px`，`min-height: 238px`，内容居中；标题 card 41/800，英文小字 30/600（accent-eyebrow），关键词薄荷高亮。
- 箭头：`→`，lead 30，text-faint，水平垂直居中。
- 节点下方可接 1–2 个区块（`margin-top: 70px`，`gap: 65px`）：小标题 lead 30/800 + 链式 pill（`surface-card`，radius 14，`padding: 17px 26px`，caption 文字）或一段 body 说明（max-width 1488）。
- 用于：10 IPO 学习法。

### 4.6 案例双卡

- 结构：主体 `display:grid`，两列 `1fr 1fr`，`gap: 29px`，`align-content:center`。
- 卡片：`surface-card`，`radius: 22px`，`padding: 19px 19px 29px`，`flex column`。
- 截图：高 502（案例页 538），`radius: 14px`，`object-fit: cover`；无图时铺 `surface-card-tint` + 1px dashed `line`。
- 说明行：编号（label，accent-brand-deep）+ 标题（lead 30/800）+ 一句说明（caption，text-body-soft）+ CTA 胶囊（`accent-mint` 底、text-ink-deep 字、radius-pill、`padding: 14px 29px`）。
- 用于：08/09 学习案例、12/13 社区案例。

### 4.7 左图右三步

- 结构：主体 `display:grid`，`grid-template-columns: 564px 1fr`，`gap: 62px`，`align-items:center`。
- 左图：宽 564，`radius: 19px`（需要融入纸面时加 `mix-blend-mode:multiply`）。
- 右列三个步骤：每步 `display:flex`，`gap: 26px`，`padding: 26px 0`，行间 1px `line`，末行补下边线；编号（label，accent-brand-deep，上移 11px）+ 标题 lead 30/800（text-ink-deep）+ 正文 body（text-body-quiet）。
- 步骤内可用薄荷小标签：`surface-mint`，radius 8，`padding: 5px 18px`，caption 24/700。
- 用于：14 门槛。

### 4.8 居中大图

- 结构：主体 `flex column`，`justify-content:center`，`align-items:center`，`gap: 53px`。
- 图：宽 1548（max-width），`radius: 22px`，`box-shadow: card-lift`；下接一行 caption 说明（max-width 1152，居中，text-body-quiet）。
- 变体：17–18 页删掉眉标行（页头 ≈ 164）；FAQ 保留一行 sub，图直接占满主体。
- 用于：18 FAQ。

## 5. 比例规则

所有数值从画布反推，改画布尺寸时按公式等比换算。

| 目标 | 公式 | 本系统取值 | token |
| --- | --- | --- | --- |
| 页面标题 | 1080 × 0.052 = 56.16 | 56px | `title` |
| 封面大字 | 1080 × 0.096 = 103.7 | 104px | `display` |
| 正文下限 | 1080 × 0.022 = 23.8 | 24px（常用 25px） | `body` / `caption` |
| 版心左右内距 | 1920 × 0.04 = 76.8 | 77px | `page-pad-x` |
| 版心上内距 | 1080 × 0.062 = 67 | 67px | `page-pad-top` |
| 版心下内距 | 1080 × 0.057 = 62 | 62px | `page-pad-bottom` |
| 版心宽 | 1920 − 77 × 2 | 1766px | `content-w` |
| 两栏左列 | 1920 × 0.4 = 768 | 768px | `two-col-left` |
| 四宫格间距 | 1920 × 0.0224 = 43 | 43px | `grid-gap` |
| 卡片圆角 | 1920 × 0.012 = 23.04 | 22px | `radius-22` |

换算公式：**新值 = round(原版 1600 宽值 × 1.2)**，只写最终 px，不做第二次缩放。例：56→67、64→77、52→62、46→56、34→41、20→25、14→24。

圆角取整说明：1920×0.012 = 23px，本系统把卡片/大图收进 `radius-22`；deck 里个别沿用原版 20px 的卡片写成 24px，与 22px 属同一比例档，视觉不可感，不新增第 8 个圆角 token。

## 6. 页面预算与溢出处理

```
1080 = 67 上内距 + 205 页头 + 746 主体 + 62 下内距
```

主体实际可用净高 746px。超预算时按顺序处理，**字号是最后手段**：

1. 先压间距：`gap`、卡片内距、`padding-top`，每次 4–8px，最多压掉约 60px。
2. 再删信息：删掉可推断的副标题、合并重复行、把两段并成一段。
3. 仍不够就拆页：一页只讲一个动作，把第二个动作分到下一页。
4. 最后才动字号：只在档位表内部换档（如 card → lead），且正文不得低于 24px。

## 7. 高亮、图标与图片

**薄荷高亮**（accent-mint）是这套系统唯一的「记号笔」。每页最多两处，多了会稀释重点。

- 卡片标题 / 短标签：`linear-gradient(180deg, transparent 60%, #BFF2D2 60%)`，`padding: 0 4px`。
- 列表与长句：起点降到 55%–58%，让下划线更厚。
- 整段短句：高亮挂在**块级元素**上时，背景框高度 = **行高 L**；而原版挂在 inline `span` 上，背景框 ≈ **1.41em**（PingFang 的 `normal` 行高）且在行框里居中。所以 stop 必须按 L 换算，不能照抄 45%/86%：

  ```
  P1 = ((L − 1.41) / 2 + 0.60 × 1.41) / L × 100
  P2 = min(100, ((L − 1.41) / 2 + 1.41) / L × 100)
  写法：linear-gradient(180deg, transparent P1%, accent-mint P1%, accent-mint P2%, transparent P2%)
  ```

  | line-height | P1 … P2 |
  | --- | --- |
  | 1.4 | 60% … 100% |
  | 1.5 | 59% … 97% |
  | 1.7 | 58% … 91% |
  | 1.75 | 58% … 90% |
  | 1.8 | 58% … 89% |
  | 1.85 | 58% … 88% |

  换算后绿带厚度恒为 **0.564em ≈ 字号 × 0.56**。自检：渲染后量「绿带像素高 ÷ 字号」应 ≈ 0.56（±0.03）；偏大说明 P2 拍到了 100%，偏小说明 P1 抬太高。
- 一行放不下的整段高亮：按自然断行拆成多个块（每块 `align-self:flex-start`），否则块级背景会把行尾空白也涂上。
- 标题里的局部高亮拆成并排两个文字块，不要指望 `span` 自带背景着色。

**链接**：inline `<a>` 只能拿到 plain underline，线色跟 anchor 的 `color` 走。统一写法 `<a href="…" style="color:#2FAE72"><span style="color:#0B4A32">文字</span></a>`（深色字 + 1px 品牌绿下划线，对应原版 2px 薄荷下划线）；不设 `color` 会掉到浏览器默认蓝，别用 `<u>` 包（会双下划线）。

**图标**：线稿图标由 deck 渲染器的 `x-icon` 集提供（Book / Activity / Users / Home / Chart / Key / Link 等），25px 或 44px，描边 1.7–2.2，颜色 `text-ink-deep`，底衬 50×50 `white` + radius 13。本系统不发布图标文件。

**图片**：本系统不含图片。deck 里的截图、插画、照片均以 `/img/*` 或 blob 形式随 deck 分发，不进入设计系统。

## 8. 不可复用声明

以下素材**只属于这一场「TRAE Campus 校园分享」**，不随本设计系统分发，也不要复制、重绘或挪用到其他材料：

- TRAE logo（`img/trae.png`，deck 封面 138×46）。
- 小助手机器人插画（`img/trae-pet-2.png`，封面右下 780×520）。
- 天猪头像（去底，`img/tz-dog-cut.png`，300×264）与天猪照片（`img/pepole.jpg`，1440×2035，About Me 564×672 cover）。

需要对外物料时，用文字 wordmark「TRAE Campus」或向品牌方申请正式授权；预览页用品牌色块代替插画，不复制人物形象。

## 9. Consuming this system

**装进 claude-slides deck**（本仓库的 `designs/trae-campus`）：

1. 复制 tokens：`designs/trae-campus-ds/project/tokens.json` → `designs/trae-campus/project/ds/traecampus/tokens.json`（目录名必须是 `traecampus`）。
2. 在 `designs/trae-campus/project/deck.json` 里登记：

   ```json
   "designSystems": [
     {
       "title": "TRAE Campus",
       "namespace": "traecampus",
       "artifact": "designs/trae-campus-ds",
       "version": "1",
       "copiedAt": "2026-11-09T03:46:55Z"
     }
   ]
   ```

3. 页面里照旧写最终 px 值（claude-slides 的 slide 格式不支持 `var()`）。tokens 是取值依据，不是运行时依赖：`768 + 67` 的两栏、`43` 的网格间距、`22` 的卡片圆角都从 tokens 抄数。
4. 校验：`node /Users/tz/.agents/skills/claude-slides/scripts/artifact.mjs check designs/trae-campus` —— `designSystems` 记录与 `project/ds/traecampus/tokens.json` 两者齐，主题/取色菜单才会出现这套 token。

**用在静态页 / 预览页**：

```html
<link rel="stylesheet" href="tokens.css">
<style>
  .card { background: var(--surface-card); border-radius: var(--radius-22); }
  .title { color: var(--text-ink); font-size: 56px; }
</style>
```

变量名等于 token 名（`--surface`、`--text-body`、`--radius-22`、`--space-48`），另有 `--color-*` 兼容别名；字体是 `--font-sans` / `--font-mono`。`tokens.css` 由 `tokens.json` 编译而来，改 token 后重新生成，不要手改。

**组件预览**：`components/` 下四张 1920×1080 版式样张（Cover / ContentPage / CardGrid / Statement）是视觉配方，不是可导入的代码。要新页面时，从对应 preview 里抄结构，把占位内容换成真实文案。

## 10. 文件结构

```
project/
├── design-system.json       索引（最后由编辑器/本系统写入）
├── tokens.json              23 色 / 7 字阶 / 12 间距 / 7 圆角 / 13 尺寸 / 1 投影
├── tokens.css               由 tokens.json 编译的 CSS 变量
├── README.md                本文（品牌书）
└── components/
    ├── Cover/preview.html         封面版式
    ├── ContentPage/preview.html   页头 + 双栏图文
    ├── CardGrid/preview.html      2×2 卡片
    └── Statement/preview.html     反白 statement
```
