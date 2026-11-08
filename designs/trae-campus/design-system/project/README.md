# TRAE Campus

TRAE Campus 是 TRAE 面向高校的分享场次：一个工程师走上讲台，讲 AI 时代里学生的机遇与挑战。这份文件是这套分享视觉系统的品牌书——颜色、字号、版心、8 种版式、比例规则，以及消费方式。

系统从 `slide/deck.html`（18 页 · 1600×900 · 手写 HTML/CSS）沉淀而来，统一换算到 **1920×1080**（原版 1u ≈ 新画布 1.2px）。所有数值都只保留一份：`tokens.json` 是唯一来源，`tokens.css` 由它生成，预览页只消费 CSS 变量。

```
design-system/
├── project/
│   ├── design-system.json     ← 索引（最后写入）
│   ├── tokens.json            ← 唯一数值来源：23 色 · 7 档字 · 12 间距 · 7 圆角 · 13 尺寸 · 1 阴影
│   ├── tokens.css             ← tokens.json 的 CSS 变量版（首行注明 generated）
│   ├── README.md              ← 本文件
│   └── components/
│       ├── Cover/             ← 封面版式（README + preview）
│       ├── ContentPage/       ← 标准内容页（README + preview）
│       ├── CardGrid/          ← 四宫格卡片（README + preview）
│       └── Statement/         ← 反白观点页（README + preview）
```

---

## 1. 品牌与语气

### 这是什么

- **场景**：校园分享，一页一屏地讲，讲完能被学生转述出去。
- **讲者视角**：一名从业者讲自己的观察，「未必能给出好的解法」。
- **视觉气质**：米白纸感 + 薄荷绿 + 墨绿重音；大量留白；不用装饰性渐变、不用玻璃拟态、不用堆阴影。

### 语气四条

1. **口语，不是书面语**。能用「你」「你们」就不用「用户」「受众」。
2. **克制，不承诺**。说「我的观察」「我们也没有答案」，不说「颠覆」「重新定义」。
3. **具体**。讲场景、讲数字，讲「刷算法题」而不是「提升核心竞争力」。
4. **不用营销腔**。没有感叹号堆叠、没有「赋能 / 闭环 / 全链路 / 抓手」、没有「仅需三步」。

### 用词对照

| 要这样写 | 不这样写 |
| --- | --- |
| 学生、你们 | 用户、目标人群、受众 |
| AI Coding、AI 协作 | 智能编码解决方案 |
| 试试、可以这样做 | 建议采取以下策略 |
| 我们也没有答案 | 业界最佳实践表明 |
| 一个想法变成产品 | 实现需求到交付的闭环 |
| 我不确定，但…… | 众所周知 |

### 段落写法

- 一段只说一件事；长段拆成 2–3 行，行内用逗号推进，句末用句号。
- 中文标点全角；破折号用「——」；引用范围用「」；不用连续感叹号。
- 中英文之间留一个半角空格（`AI 时代`、`TRAE 创造力大赛`）；数字与单位之间不留空格（`1080px`）。
- 标题不加句号；副标题以「— 」或直接陈述，一行讲完。

---

## 2. 色彩

### 23 个颜色 token

| token | hex | 用途 |
| --- | --- | --- |
| `surface` | `#F7F8F5` | 页面底色；所有页头、正文与卡片的基准背景 |
| `surface-card` | `#EAECEA` | 默认卡片与面板底色（四宫格第 1 张、双栏第 1 栏、流程节点） |
| `surface-card-alt` | `#E8EDEA` | 交替卡片底（四宫格第 2 张）；图表占位块 |
| `surface-card-mint` | `#E5EEE8` | 薄荷系卡片底（四宫格第 3 张、双栏第 2 栏、流程中段） |
| `surface-mint` | `#DFF1E6` | 高亮胶囊与标签底（封面名签、tag、药丸） |
| `surface-inverse` | `#0B3A29` | 反白页底；观点页与章节封面 |
| `surface-inverse-deep` | `#101714` | 暗层底；本套 deck 未使用，留给浮层与总览 |
| `text-ink` | `#141C18` | 主标题与强文字 |
| `text-heading` | `#0B3A29` | 页内小标题、卡片标题、封面名签文字 |
| `text-body` | `#3B463F` | 正文 |
| `text-body-soft` | `#4A544E` | 副标题与次级正文 |
| `text-muted` | `#5A645E` | 辅助正文、编号行正文、流程英文 |
| `text-subtle` | `#63736B` | 弱化说明与编号 |
| `text-on-mint` | `#0B4A32` | 薄荷底/按钮/链接上的文字；线性图标描边 |
| `accent-brand` | `#2FAE72` | 品牌绿，**仅图形**：圆点、3px 边框、填充 |
| `accent-text` | `#17754A` | **当文字用的绿**：句内强调、卡片标题关键词 |
| `accent-eyebrow` | `#3C6B52` | 眉标绿 |
| `accent-highlight` | `#BFF2D2` | 薄荷高亮带与 CTA 按钮底 |
| `line` | `#D9E1DC` | 强分隔线与边框 |
| `line-soft` | `#DCE3DE` | 弱分隔线与占位底 |
| `inverse-text` | `#D6EFE2` | 反白页正文 |
| `inverse-label` | `#7FB49A` | 反白页标签与说明 |
| `neutral-graphic` | `#9BA8A1` | 装饰箭头（→ / ↓）与图形，仅装饰 |

### 两条硬规则

1. **`#2FAE72` 只做图形，不当文字。** 它和 `surface` 的对比度只有 **2.66 : 1**，远低于正文要求的 4.5:1。要绿色文字就用 `accent-text` `#17754A`（5.35 : 1）。
2. **正文对比度 ≥ 4.5:1，大字（≥ 24px / 800）≥ 3:1。** 原版里的 `#8A968F`、`#A7B3AC` 一律换成 `text-subtle` `#63736B`；原版把 `#2FAE72` 当文字的地方换成 `accent-text`。

### 对比度实测

| 前景 / 背景 | 比值 | 结论 |
| --- | --- | --- |
| `text-ink` on `surface` | 16.29 : 1 | 主标题 |
| `text-heading` on `surface` | 11.93 : 1 | 小标题 |
| `text-body` on `surface` | 9.23 : 1 | 正文 |
| `text-body-soft` on `surface` | 7.38 : 1 | 副标题 |
| `text-muted` on `surface` | 5.76 : 1 | 辅助正文 |
| `text-subtle` on `surface` | 4.70 : 1 | 弱化说明（擦线通过） |
| `text-body` on `surface-card` | 8.29 : 1 | 卡片正文 |
| `text-on-mint` on `surface-mint` | 8.76 : 1 | 薄荷胶囊文字 |
| `accent-text` on `surface` | 5.35 : 1 | 绿色文字 |
| `accent-eyebrow` on `surface` | 5.77 : 1 | 眉标 |
| `inverse-text` on `surface-inverse` | 10.48 : 1 | 反白正文 |
| `inverse-label` on `surface-inverse` | 5.39 : 1 | 反白标签 |
| `accent-brand` on `surface` | 2.66 : 1 | **只能做图形** |
| `neutral-graphic` on `surface` | 2.32 : 1 | **只能做装饰箭头** |

### 高亮与强调

- **整行/整段薄荷高亮**：把背景设在该文本元素自己身上，`linear-gradient(180deg, transparent 62%, #BFF2D2 62%)`，左右各留 5px 内边距；在 flex 列里要 `align-self:flex-start`（否则背景撑满整行）。
- **句中局部强调**：用 `<b><span style="color:#17754A">…</span></b>`，只改颜色，不要给行内 span 加背景。
- **CTA / 药丸**：`background:#BFF2D2; border-radius:100px; padding:14px 30px`，文字 `#0B4A32`。
- **一页最多两处高亮**。第三处改用 `surface-card-mint` 面板承载。

### 反白页

- 底色 `surface-inverse`，正文 `inverse-text`，标签/署名 `inverse-label`，圆点与 3px 竖线用 `accent-brand`。
- 深绿底上**不叠加阴影、不用高亮带**；阴影只属于浅色底。

---

## 3. 字体与字号

### 字体栈

本系统**不引入外部字体文件**（`tokens.json` 的 `type.fonts` 为空），直接吃系统字体：

```css
--font-sans: 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Source Han Sans SC', system-ui, sans-serif;
```

macOS / iOS 落到 PingFang SC，Windows 落到 Noto Sans SC / 思源黑体，Android 落到系统无衬线。预览页与 deck 都用这一条栈，跨设备字宽会略有差异，所以数值都留了余量。

### 7 档字号

| 档位 | 字号 | 行高 | 字重 | 字距 | 使用场景 |
| --- | --- | --- | --- | --- | --- |
| `display` | 104px | 1.22 | 800 | -3px | 封面主标题；一页只出现一次 |
| `title` | 56px | 1.38 | 800 | -1.2px | 页标题；每页一个 |
| `card` | 41px | 1.3 | 800 | -0.5px | 卡片/面板标题、封面副标题（400 字重）、About Me 姓名 |
| `lead` | 30px | 1.55 | 800 | -0.4px | 步骤标题、IPO 节点中文、条目小标题、引用块 |
| `body` | 25px | 1.9 | 400 | 0 | 正文：About Me 要点、双栏要点、海报文字 |
| `caption` | 24px | 1.7 | 400 | 0 | 较密正文、说明、案例描述 |
| `label` | 24px | 1.2 | 600 | 2.4px | 眉标、编号、页码类标签 |

**最小字号 24px**，这是平台硬规则；任何情况下不得低于。字号只能取这 7 档，不出现 28px、32px、46px 这类中间值。

### 补充固定写法

| 场景 | 写法 |
| --- | --- |
| IPO 英文（Input / Process / Output） | 30px / 1.2 / 600，`text-muted`，首字母用 `accent-text` 加重 |
| 行内强调 | `<b><span style="color:#17754A">…</span></b>` |
| 药丸文字 | 24px / 1.2 / 700，`text-on-mint` |
| 引用块（浅底） | 25px / 1.95 / 700，`text-heading`，左侧 3px `accent-brand` 竖线 |
| 封面副标题 | 41px / 1.2 / **400**，`text-body-soft` |
| 反白页引文 | 30px / 1.55 / 800，`inverse-text` |

### 字距

- 大字号收紧：104px 用 -3px，56px 用 -1.2px，41px 用 -0.5px，30px 用 -0.4px。
- 小字号放开：眉标/编号 24px 用 +2.4px，编号 `01` 用 +1.2px。
- 24px 正文与说明保持 0；不要给正文加负字距。

---

## 4. 版心与栅格

### 画布与版心

- 画布：**1920 × 1080**。
- 版心：`padding: 67px 77px 62px 77px`（上 / 右 / 下 / 左），内容区 **1766 × 951**。
- 页头与主体之间固定 **41px**；主体一律 `flex:1` 撑满剩余高度。

```
┌────────────────────────────────────────────── 1920 ──┐
│ 67                                                   │
│    ┌──────────────────────────────────────────┐      │
│ 77 │  页头 ≈210（眉标 / 标题 / 副标题 / 线）    │ 77   │
│    ├──────────────────────────────────────────┤      │
│ 41 │  主体 700（flex:1，8 种版式之一）          │      │
│    └──────────────────────────────────────────┘      │
│ 62                                                   │
└──────────────────────────────────────────────────────┘
内容 951 = 210 + 41 + 700
```

### 页头三种形态

| 形态 | 构成 | 高度 |
| --- | --- | --- |
| 标准页头 | 眉标（13px 圆点 + 24px 标签）→ 56px 标题 → 24px 副标题 → 31px + 1px 分隔线 | ≈ 210 |
| 无副标题（About Me） | 眉标 → 56px 标题 → 41px + 1px 分隔线 | ≈ 153 |
| 无眉标（结尾 / FAQ） | 56px 标题（`padding-top:41px`）→ 24px 副标题（`padding-top:14px`）→ 29px + 1px 分隔线 | ≈ 193–200 |

### 常用栅格

| 版式 | 栅格 | 关键数值 |
| --- | --- | --- |
| 图文两栏 | `768px + 67px + 1fr` | 图 768×301 / 564×376 / 792×446 / 960×552；右栏 `padding-right:34px` |
| 双栏等分 | `1fr 1fr`，`gap:29px` | 面板 `padding:82px 67px` |
| 四宫格 | `1fr 1fr` × `1fr 1fr`，`gap:43px` | 每格 ≈ 861.5 × 328.5；卡片 `padding:48px 53px` |
| 编号行 | `41px 310px 1fr`，`column-gap:29px` | 行 `padding:19px 0` + 1px 下边框 |
| 流程 | `1fr 67px 1fr 67px 1fr` | 节点 `min-height:238px`，`padding:41px 48px` |
| 案例双卡 | `1fr 1fr`，`gap:29px` | 截图 830×502（高版 830×538），文字块 `padding-top:31px` |
| 练习页 | `672px + 77px + 1fr` | 左三块面板 + ↓，右侧 3 个步骤 |

### 尺寸 token（13）

| token | 值 | 用途 |
| --- | --- | --- |
| `canvas-w` | 1920px | 画布宽 |
| `canvas-h` | 1080px | 画布高 |
| `content-w` | 1766px | 版心宽（1920 − 77×2） |
| `content-h` | 951px | 版心高（1080 − 67 − 62） |
| `page-pad-top` | 67px | 版心上内边距 |
| `page-pad-x` | 77px | 版心左右内边距 |
| `page-pad-bottom` | 62px | 版心下内边距 |
| `header-h` | 210px | 标准页头总高 |
| `body-h` | 700px | 主体可用高（951 − 210 − 41） |
| `cover-avatar-w` | 190px | 封面讲者头像宽（高 167px） |
| `cover-pet-w` | 780px | 封面小助手插画宽（高 520px） |
| `case-shot-h` | 502px | 案例卡截图高（宽 830px） |
| `case-shot-tall-h` | 538px | 高版案例卡截图高（宽 830px） |

### 间距梯度（12）

| token | 值 | 用途 |
| --- | --- | --- |
| `space-1` | 4px | 图标与文字的微调间隙 |
| `space-2` | 8px | 圆点与正文、外链图标 |
| `space-3` | 12px | 眉标圆点与文字、tag 之间 |
| `space-4` | 17px | 标题与副标题、图标与标题 |
| `space-5` | 22px | 列表项、卡片编号与标题 |
| `space-6` | 26px | 段落间距、条目内边距 |
| `space-7` | 29px | 双栏与四宫格列间距 |
| `space-8` | 31px | 页头下边距、案例文字块上间距 |
| `space-9` | 41px | 页头与主体之间、流程区块之间 |
| `space-10` | 48px | 卡片内边距（主） |
| `space-11` | 56px | 大分区间距、流程上下两段 |
| `space-12` | 67px | 图文两栏大间距、面板左右内边距 |

**就近原则**：同一组元素之间用父级 `gap`（4/8/12/17/22），组与组之间用 `padding` 或更大的 `gap`（26/29/31/41/48/56/67）。不要用 `margin` 表达间距。

### 圆角（7）

| token | 值 | 用途 |
| --- | --- | --- |
| `radius-tag` | 8px | 标签、编号药丸 |
| `radius-icon` | 13px | 50×50 图标砖 |
| `radius-image` | 14px | 截图、图片、流程链条项 |
| `radius-figure` | 17px | 图表、插图（含占位块） |
| `radius-card-alt` | 22px | 案例卡、图片卡 |
| `radius-card` | 24px | 默认卡片、面板、四宫格、FAQ 截图 |
| `radius-pill` | 999px | 名签、CTA 按钮、药丸 |

### 阴影（1）

`shadow-elevation` = `0 12px 41px rgba(11,59,41,0.10)`。只用于「浮起来」的元素：楔子页 CTA、FAQ 截图；卡片、面板、分隔线一律不用阴影。深绿底上不用阴影。

---

## 5. 比例规则

所有尺寸都能从画布反推。换画布尺寸时，**先按比例算，再落到字号档位**，不要凭手感调。

| 关系 | 公式 | 推导 |
| --- | --- | --- |
| 页标题 | 画布高 × 0.052 | 1080 × 0.052 ≈ 56px |
| 封面主标题 | 画布高 × 0.096 | 1080 × 0.096 ≈ 104px |
| 正文下限 | 画布高 × 0.022，且 ≥ 24px | 1080 × 0.022 ≈ 24px（24 是平台硬下限） |
| 版心左右 | 画布宽 × 4% | 1920 × 4% ≈ 77px |
| 卡片圆角 | 画布宽 × 0.012 | 1920 × 0.012 ≈ 24px（精确值 0.0125） |
| 卡片内边距 | 圆角 × 2 | 24 × 2 = 48px |
| 图标砖 | 字号档 × 1.22 | 41 × 1.22 ≈ 50px |

**换算步骤**（例如改到 1440×810，比例系数 k = 810/1080 = 0.75）：

1. 画布：1920×1080 → 1440×810。
2. 版心：67 / 77 / 62 × 0.75 → 50 / 58 / 47（取整）。
3. 字号：104 / 56 / 41 / 30 / 25 / 24 → 78 / 42 / 31 / 22.5 / 19 / 18；**低于 24px 的一律拉回 24px**，于是正文档位合并，宁可少讲内容。
4. 栅格与图片按 k 等比缩；四宫格 gap 43 × 0.75 ≈ 32。
5. 圆角、阴影按 k 缩；`radius-pill` 保持 999px。

原版 1600×900 到本系统的换算就是 k = 1.2：版心 56/64/52 → 67/77/62，页标题 46 → 56，正文 17–21 → 24–25。

---

## 6. 版式（8 种）

18 页 deck 由这 8 种版式组合而成（括号内是原版页数）：cover(1) · profile(1) · content-figure(4) · card-grid(2) · numbered-rows(1) · duo-panels(2) · flow(1) · cases(4)，另有 2 页属于它们的变体（figure-full / faq）。

| 版式 | 一句结构 | 关键数值 |
| --- | --- | --- |
| **cover** 封面 | 字标 + 104px 主张 + 一行副标题 + 名签，内容垂直居中、右侧留给插画。 | 左右 115；主张 104/1.22/800/-3；名签 334×83 |
| **profile** 人物 | 左 564×672 照片，右姓名 + 一段 lead + 要点列表 + 引用块，两栏垂直居中。 | 564 + 67 + 1fr；要点 25/1.8；引用左竖线 3px |
| **content-figure** 图文 | 左图 768×301（或 564×376 / 792×446 / 960×552），右栏条目列表或三段正文。 | 768 + 67 + 1fr；条目 `padding:24px 0` + 1px 上边框 |
| **card-grid** 卡片网格 | 2×2 四张等分卡片，每张「编号 + 图标砖 + 41px 标题 + 两行正文」。 | gap 43；卡片 `padding:48px 53px`；四张底色中性→薄荷 |
| **numbered-rows** 编号行 | 四行「编号 41px 列 + 310px 标题列 + 1fr 正文列」，行间 1px 弱分隔线。 | `41px 310px 1fr`；`column-gap:29px`；行 `padding:19px 0` |
| **duo-panels** 双栏面板 | 左右两块 24px 圆角面板（`surface-card` / `surface-card-mint`），各含标题 + 圆点要点 + 引用。 | gap 29；面板 `padding:82px 67px` |
| **flow** 流程 | 三节点卡片 + 两个 67px 箭头列，下方再接一条「链条 + 结论」带。 | `1fr 67px 1fr 67px 1fr`；节点 `min-height:238px`；箭头 30px `neutral-graphic` |
| **cases** 案例双卡 | 左右两张 22px 圆角卡片：上 830×502（或 538）截图，下「编号 + 标题 + 描述 + 药丸链接」。 | gap 29；截图框 1px 虚线 `line`；药丸 `#BFF2D2` |

### 页面骨架（所有版式共用）

```html
<section style="background:#F7F8F5;color:#141C18;font-family:sans-serif;
  padding:67px 77px 62px 77px;display:flex;flex-direction:column;gap:41px">
  <!-- 页头：约 210px -->
  <div style="display:flex;flex-direction:column;padding-bottom:31px;border-bottom:1px solid #D9E1DC">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:13px;height:13px;border-radius:50%;background:#2FAE72"></div>
      <p style="font-size:24px;font-weight:600;line-height:1.2;letter-spacing:2.4px;color:#3C6B52">眉标文字</p>
    </div>
    <h1 style="font-size:56px;line-height:1.38;font-weight:800;letter-spacing:-1.2px;color:#141C18;padding-top:17px">页面标题</h1>
    <p style="font-size:24px;line-height:1.6;color:#4A544E;padding-top:17px">副标题（一行）</p>
  </div>
  <!-- 主体：700px -->
  <div style="flex:1;display:grid;grid-template-columns:768px 1fr;gap:67px;align-items:center">
    …
  </div>
</section>
```

---

## 7. 页面预算

一页的总高只有 1080，可写字的只有 951：

```
内容总高 951 = 页头 210 + 间隔 41 + 主体 700
951 / 1080 = 0.88        ← 常规目标
1026 / 1080 = 0.95       ← 硬上限（页脚之外不得越过）
```

> 与 p.md「页头 ~205 / 主体 ≤746」的记法等价：`746` 里含 41px 的页头-主体间隔，即 `210 + 41 + 700`；`205 + 746 + 62 + 67 = 1080`。两套记法指同一块版心，落地以本节 210 / 41 / 700 为准。

| 版式 | 主体预算 | 一页大约能放 |
| --- | --- | --- |
| cover | 垂直居中，内容高 ≈ 500 | 1 句主张 + 1 行副标题 + 名签 |
| profile | 700 | 564×672 照片 + 1 段 lead + 4 条要点 + 1 条引用 |
| content-figure | 700 | 1 张图 + 2–3 个条目（每条约 2–3 行正文） |
| card-grid | 700 | 4 张卡，每张正文 ≤ 2 行 |
| numbered-rows | 700 | 4 行，每行 2–3 行正文 |
| duo-panels | 700 | 2 块面板，每块 3 条要点 + 1 条引用 |
| flow | 700 | 3 节点 + 1 条链条 + 1 段结论 |
| cases | 700 | 2 张卡，截图 + 1 行标题 + 1 行描述 |

**超出预算时的处理顺序（不许跳步）：**

1. **先删信息**：删掉第二层解释、删掉重复的修饰句；
2. **再拆页**：把一个版式拆成两页，标题沿用、副标题递进；
3. **最后才动字号**：而且只能在 7 档之间换档（例如 `body` 25 → `caption` 24），**不能**降到 24px 以下，也不能自造中间值。

排版落地的三条校验：页头 + 41 + 主体 ≤ 951；每行文字不超过容器宽度；卡片/面板内文字不溢出圆角。

---

## 8. 图标与插图

### 线性图标

- 统一 **1.7–1.8px 描边**（卡片图标 1.8，编号行图标 1.7），`stroke-linecap:round`，`fill:none`。
- 颜色 **`#0B4A32`**（`text-on-mint`），不用品牌绿 `#2FAE72`，不用纯黑。
- 尺寸：卡片图标 25×25（viewBox 24）；编号行图标 40×40；外链/箭头 16–24px。
- 图标砖：`50×50`、白底 `surface`、`radius:13px`，图标居中。

```html
<div style="width:50px;height:50px;border-radius:13px;background:#F7F8F5;
  display:flex;align-items:center;justify-content:center">
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none"
    stroke="#0B4A32" stroke-width="1.8" stroke-linecap="round">
    <path d="M4 5.5A2 2 0 0 1 6 3.5h13v17H6a2 2 0 0 1-2-2z"/>
    <path d="M8 8h7M8 12h7"/>
  </svg>
</div>
```

常用图标（原稿自带，可直接复用路径）：

| 场景 | 路径（viewBox 24） |
| --- | --- |
| 课内 / 书本 | `M4 5.5A2 2 0 0 1 6 3.5h13v17H6a2 2 0 0 1-2-2z` + `M8 8h7M8 12h7` |
| 课外 / 活跃 | `M3 12h4l2.5-6 5 12L17 12h4` |
| 校招 / 人像 | `circle cx=12 cy=8 r=3.4` + `M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6` |
| 职场 / 建筑 | `M4 20V9l8-5 8 5v11z` + `M9.5 20v-6h5v6` |
| 机会 / 趋势 | `M3.5 7l6 6 4-4 7 7` + `M20.5 9.5v6.5H14` |
| Token / 圆环 | `circle cx=12 cy=12 r=8.2` + `circle cx=12 cy=12 r=3.2` |

### 装饰箭头

- 只用文本 **`→` / `↓`**，30px，`neutral-graphic` `#9BA8A1`；它们是对齐与节奏工具，不承载信息。
- 流程箭头放在 67px 宽的专用列里居中；纵向递进用 `↓`，上下留 41–65px。

### 图片与截图

- 写死 px + `object-fit`：照片/截图 `cover`，图表/插画 `contain`。
- 圆角：截图 14px（`radius-image`），图表/插图 17px（`radius-figure`），案例卡 22px（`radius-card-alt`）。
- 线稿/手绘插图加 `mix-blend-mode:multiply`，让它融进米白底。
- 截图框用 1px 虚线 `line` + `line-soft` 占位底；图片不拉伸、不裁掉关键信息。

---

## 9. 不可复用声明

以下资产**只属于这一场校园分享**，不随本设计系统分发，不得复制、改编或用于其他项目：

- **TRAE logo**（字号标与图形标）；
- **TRAE 小助手插画**（封面的 3D 角色图）；
- **天猪的头像与照片**（封面名签旁、About Me 的生活照）。

本系统只沉淀「可复用的视觉规则」：颜色、字号、版心、栅格、圆角、图标几何、版式结构。封面与 About Me 的预览里因此只保留文字、薄荷名签和尺寸占位，不画 logo、不画头像、不引用 deck 的图片资源。需要这些素材时，请向 TRAE 官方获取，并按上文的位置与尺寸放置。

---

## 10. 消费方式

### tokens.json → tokens.css

- `project/tokens.json` 是唯一数值来源（`version: 1`，单主题 `light`）。
- `project/tokens.css` 由它生成，首行为 `/* TRAE Campus — generated from tokens.json */`；改颜色/字号请改 `tokens.json`，再重新生成 CSS，**不要手改 `tokens.css`**。

```html
<link rel="stylesheet" href="tokens.css">
<div style="background:var(--surface);color:var(--text-ink);font-family:var(--font-sans)">
  <h1 style="font-size:var(--text-title);line-height:var(--text-title-leading);font-weight:var(--text-title-weight)">
    每个时代都有挑战和机遇
  </h1>
  <p style="color:var(--text-body)">正文用 --text-body，强调绿用 --accent-text。</p>
</div>
```

常用变量：`--surface`、`--surface-card`、`--text-ink`、`--text-body`、`--accent-text`、`--accent-highlight`、`--line`、`--font-sans`、`--text-display` … `--text-label`、`--space-1` … `--space-12`、`--radius-tag` … `--radius-pill`、`--canvas-w`、`--shadow-elevation`。

> 注意：`--text-body` 是**正文颜色**；正文档的**字号**叫 `--text-body-size`（25px），避免同名覆盖。

### 装进 deck

1. 原样复制 `project/tokens.json` 到 deck 的 `project/ds/traecampus/tokens.json`（字节不变，不要重新格式化）。
2. 在 `deck.json` 的 `designSystems` 里登记：

```json
{
  "title": "TRAE Campus",
  "namespace": "traecampus",
  "artifact": "<本设计系统根目录>",
  "version": null,
  "copiedAt": "<RFC 3339 时间>"
}
```

3. 验证：`artifact.mjs list` 能列出 TRAE Campus；deck 的 `check` 里 `designSystemNotes` 为空；编辑器 Theme 页签能看到 `surface` / `text-ink` / `accent-text` 等 token 名。

### 组件与预览

- 本系统 `libraries: []`，**不提供 JS bundle / React 组件**；4 个组件（Cover / ContentPage / CardGrid / Statement）是版式参考，用 `preview.html` 展示，不是可安装的代码包。
- 每个 `preview.html` 都画一张完整的 1920×1080 画布，用「480×270 外层 + `overflow:hidden` + 内部 `transform:scale(0.25)`」缩进卡片，只引用 `../../tokens.css`，静态、无脚本、无外部资源。
- 复用版式时，把 `preview.html` 里的内联样式原样搬进 slide，按「8 种版式」的骨架替换文案与数字；不要引入新的颜色或字号。

---

*所有数值以 `tokens.json` 为准；本文件负责解释「为什么是这些数值」。*
