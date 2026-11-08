# TRAE Campus 排版规范

> 适用：TRAE Campus 分享 deck（claude-slides 格式，16:9 / 1920×1080，18 页）
> 数值来源：`.tmp-test/SPEC.md`（唯一基准）。本文所有 px 均指 1920×1080 画布下的绝对像素。
> 用途：后续复用与改版时，**照着取值、照着禁用项自查**；不做风格发挥。
> 维护：改版式先改本文，再改页面文件；两者数值必须一致。

---

## 0. 适用范围与核心原则

### 0.1 适用范围

- 画布：**1920×1080**（16:9）。所有尺寸写死 px，不随窗口缩放。
- 产物形态：**claude-slides 闭合子集** —— 一页一个 `<section id="<id>">`，只有内联 `style`，只用 flex/grid + px。
- 本规范覆盖 **8 种版式**（cover / profile / content-figure / card-grid / numbered-rows / duo-panels / flow / cases），可完整复现本 deck 的 18 页。
- 本规范**不覆盖**：翻页/总览等交互、图片资产本身、deck.json 与设计系统文件。

### 0.2 核心原则（四条，按优先级）

1. **一个画布单位体系**：全站 px，基准画布 1920×1080。禁止 em/rem/百分比/vw/vh；换画布时整体等比换算后向梯度取整，不混用两套单位。
2. **7 档字号**：display 104 / title 56 / card 41 / lead 30 / body 25 / caption 24 / label 24（后两档同字号、不同行高与字重），字号只能落在档位上，**下限 24px**（平台硬规则）。
3. **8 种版式**：每页必须能归入某一种版式；版式内的结构、栅格、间距、圆角是常量，只有文案、图片、条目数是变量。
4. **内容预算**：每页内容总高固定 951px（占画布 0.88），主体按 ≤700px 设计；超预算按「删信息 → 拆页 → 最后才动字号」处理，**永远不压缩版心 padding**。

### 0.3 术语

| 术语 | 含义 |
|---|---|
| 画布 | 1920×1080 的 section 本体 |
| 版心 | 画布去掉上下左右 padding 后的内容区：1766×951 |
| 页头 | 眉标 + 标题 + 副标题的组合块（带 1px 下分隔线） |
| 主体 | 页头之后的 `flex:1` 容器，常规页约 700px 高 |
| 页脚 | 画布下方 62px 留白区，**不放任何元素**（页码由编辑器负责） |
| 版式常量 | 属于版式结构的固定值（栅格列宽、gap、卡片 padding、圆角），不参与间距梯度挑选 |
| 间距梯度 | 组内/组间关系性的 12 级间距值（见 §3） |

---

## 1. 画布、版心与页面骨架

### 1.1 画布

- 尺寸：1920×1080，无圆角、无外边距、无滚动。
- 底色：`#F7F8F5`（surface）；默认文字色 `#141C18`（text-ink）。
- 字体：页面文件统一 `font-family:sans-serif`，**不得引入自定义字体**；设计系统层的 sans 栈为 `Noto Sans SC, PingFang SC, Hiragino Sans GB, Source Han Sans SC, system-ui, sans-serif`（供 DS/预览页使用，不写进页面文件）。
- overflow：封面 `hidden`（插画出血），其余页不写 overflow。

### 1.2 版心

| 项 | 值 | 校验公式 |
|---|---|---|
| 上边距 | 67px | ≈ 画布高 × 0.062 |
| 右/左边距 | 77px | ≈ 画布宽 × 0.04 |
| 下边距 | 62px | 页脚区，不放元素 |
| 版心宽 | 1766px | 1920 − 77×2 |
| 版心高 | 951px | 1080 − 67 − 62 |

**换画布时**：所有 px 按 `新画布高 / 1080` 等比缩放，再向最近的间距梯度（§3）或圆角档（§4）取整；字号必须重新落到 7 档上，**不得出现中间字号**。

### 1.3 页面骨架（页头 → 主体 → 页脚）

每页自上而下**固定三段**，顺序不可换、不可增减：

1. **页头**：眉标行 → 标题 → 副标题，末尾 `padding-bottom` + 1px 下分隔线。
2. **主体**：`flex:1` 填满剩余高度，承载版式内容。
3. **页脚**：不写元素，只保留 62px 下边距。

页头与主体之间用 **section 的 `gap:41px`** 分隔（不用 margin）。

```html
<section id="<id>" style="background:#F7F8F5;color:#141C18;font-family:sans-serif;padding:67px 77px 62px 77px;display:flex;flex-direction:column;gap:41px">
  <div>页头（§1.4 三种变体之一）</div>
  <div style="flex:1">主体（§6 对应版式）</div>
</section>
```

**每页逐字复制上面这段 section 基础样式**，不得改写（除 cover 外，见 §6.1）。section 内只放页头块与主体块两个直接子元素（上方占位仅示意，实际替换为真实元素）；不写 HTML 注释、不留空文本节点。

### 1.4 页头的三种变体

**变体 A：常规页头**（有眉标 + 标题 + 副标题，多数页）

```html
<div style="display:flex;flex-direction:column;padding-bottom:31px;border-bottom:1px solid #D9E1DC">
  <div style="display:flex;align-items:center;gap:12px">
    <div style="width:13px;height:13px;border-radius:50%;background:#2FAE72"></div>
    <p style="font-size:24px;font-weight:600;line-height:1.2;letter-spacing:2.4px;color:#3C6B52">眉标文字</p>
  </div>
  <h1 style="font-size:56px;line-height:1.38;font-weight:800;letter-spacing:-1.2px;color:#141C18;padding-top:17px">页面标题</h1>
  <p style="font-size:24px;line-height:1.6;color:#4A544E;padding-top:17px">副标题（逐字，可含 br 换行）</p>
</div>
```

| 元素 | 字号档 | 细节 | 高度贡献 |
|---|---|---|---|
| 眉标圆点 | — | 13×13，`border-radius:50%`，`#2FAE72` | 13 |
| 眉标文字 | label | 24 / 1.2 / 600 / 字距 2.4px / `#3C6B52`，与圆点 `gap:12px` | 29 |
| 标题 h1 | title | 56 / 1.38 / 800 / 字距 −1.2px / `#141C18`，`padding-top:17px` | 77 + 17 |
| 副标题 p | 副标题角色 | 24 / 1.6 / 400 / `#4A544E`，`padding-top:17px`，可含 `<br>` | 38 + 17 |
| 下分隔线 | — | `1px solid #D9E1DC`，`padding-bottom:31px` | 31 + 1 |
| **合计** | | | **约 210** |

**变体 B：无副标题**（about 等）—— 删掉副标题 `<p>`，其余完全不变，页头高 **约 153**。

**变体 C：无眉标**（future / faq）—— 去掉眉标行，改用：

```html
<div style="padding-bottom:29px;border-bottom:1px solid #D9E1DC">
  <h1 style="font-size:56px;line-height:1.38;font-weight:800;letter-spacing:-1.2px;color:#141C18;padding-top:41px">页面标题</h1>
  <p style="font-size:24px;line-height:1.6;color:#4A544E;padding-top:14px">副标题</p>
</div>
```

页头高 **约 193**（`padding-top:41` / 副标题 `padding-top:14` / `padding-bottom:29`）。预算按 193 计；实测随行盒取整会有 ±8px 浮动，不影响版式。

**禁止**：给 h1 / 副标题加 `margin`；改分隔线颜色或粗细；删分隔线；把眉标圆点改成图标/图片；页头里塞 CTA（CTA 只能绝对定位，见 §6.3 prelude）。

### 1.5 页脚

- 不写任何元素，**不要页脚文案、不要页码、不要页脚分隔线**。
- 62px 下边距必须保留，主体不得越过它。

---

## 2. 字号与字重档位

### 2.1 7 档字号表

字号只能取这 7 个值；行高以倍数写，行盒高为换算参考。

| 档位 | 字号 | 行高 | 行盒高 | 字重 | 字距 | 使用场景 |
|---|---|---|---|---|---|---|
| display | 104px | 1.22 | ≈127 | 800 | −3px | 封面主标题（唯一一处） |
| title | 56px | 1.38 | ≈77 | 800 | −1.2px | 页标题 h1 |
| card | 41px | 1.3 | ≈53 | 800 | −0.5px | 卡片/面板标题、封面副标题、About Me 姓名、flow 节点中文、numbered-rows 行标题 |
| lead | 30px | 1.55 | ≈47 | 800 | −0.4px | 步骤标题、小标题、箭头字符；英文标签改 1.2 / 600，块标题行高改 1.3 |
| body | 25px | 1.9 | ≈48 | 400 | 0 | 正文：About 要点、双栏要点、海报文字、引用段（改 700） |
| caption | 24px | 1.7 | ≈41 | 400 | 0 | 较密正文、说明、案例描述、副标题（1.6）、条目正文（1.85–1.95） |
| label | 24px | 1.2 | ≈29 | 600 | 2.4px | 眉标；编号变体见 §2.2 |

**禁止用法**

- display：封面以外禁用；不得用于副标题或卡片标题。
- title：不得用于卡片标题；单页只出现一次；标题最多 2 行。
- card：不得写整段正文；不得行高 < 1.3。
- lead：不得整段铺正文；不得用于 ≥3 行的段落。
- body：不得用于注释/说明（用 caption）；行高只能在 1.75–2.0 之间按密度取，不得更松。
- caption：不得用于主标题层级；行高只能在 1.6–1.95 之间取。
- label：2.4px 字距只适合短标签，**禁止用于长句**（会散架）；编号类改用 §2.2 变体。
- 全部档位：字号 < 24px 一律禁止（含脚注、图标旁注）。

### 2.2 固定写法（角色变体，仍是 7 档之内）

同一字号档在不同角色上有固定搭配，**照抄，不要自创组合**：

| 角色 | 写法 | 用途 |
|---|---|---|
| 副标题 | 24 / 1.6 / 400 / `#4A544E` | 页头副标题（可含 `<br>`） |
| 眉标 | 24 / 1.2 / 600 / 2.4px / `#3C6B52` | 眉标文字 |
| 编号（四宫格、编号行） | 24 / 1.2 / 800 / 1.2px / `#63736B` | 01 02 03 04 |
| 编号（案例卡） | 24 / 800 / 1.8px / `#17754A` | 案例卡前置编号 |
| 编号（步骤） | 24 / 800 / `#17754A` | 步骤序号 |
| 英文标签 | 30 / 1.2 / 600 / `#5A645E` | IPO 的 Input / Process / Output |
| 药丸文字 | 24 / 1.2 / 700 / `#0B4A32` | tag 药丸、CTA、案例按钮 |
| 链接文字 | 正文内：`#0B4A32` + `text-decoration:underline`；药丸/按钮内：`#0B4A32` + `text-decoration:none` | 正文链接 / 按钮链接 |
| 引用块 | 25 / 1.95 / 700 / `#0B3A29` + `padding-left:24px;border-left:3px solid #2FAE72` | 引用段 |
| 加粗段 | 25 / 1.75 / 800 / `#0B3A29` | About 页姓名下的引导段 |
| 行内强调 | `<b><span style="color:#17754A">…</span></b>` | 句中局部强调（span 只允许带 color） |

### 2.3 字号选择决策

1. 这是**页面标题**？→ title。
2. 这是**一个块（卡片/面板/节点/行）的标题**？→ card；块标题需要更矮（步骤、案例卡）时用 lead。
3. 这是**成段阅读文字**（≥2 行、需要舒适行距）？→ body。
4. 这是**较密正文/说明/案例描述**（空间紧、1–3 行）？→ caption。
5. 这是**标签/眉标/编号**（短、带字距）？→ label（或 §2.2 编号变体）。
6. 以上都不是 → 不要新字号，先回到第 1–5 步重新归类。

**同页字号层级**：一页内至多出现 4 档（例如 title + card + caption + label）；超过 4 档说明信息层级没收敛。

---

## 3. 间距梯度与使用规则

### 3.1 12 级间距梯度

关系性间距（组内 gap、段落间 padding）只能取这 12 个值：

| 值 | 语义 | 本 deck 的典型用法 |
|---|---|---|
| 4px | 微缝 | 保留档：仅供极紧的微调，本 deck 布局未使用 |
| 8px | 图标与文字 | 案例卡按钮内 `gap:8px` |
| 12px | 紧邻元素 | 眉标圆点与文字、圆点列表圆点与文字、tags 行 |
| 17px | 编号—正文、行内间距 | 编号行标题列 `gap:17px`、flow 链条项 `gap:17px`、标题/副标题 `padding-top:17px` |
| 22px | 同组段落 | 四宫格卡顶部行 `gap:22px` + `padding-bottom:22px`、threshold `gap:22px`、About 要点列表 `gap:22px`、案例 tall 文字行 `gap:22px` |
| 26px | 说明/段间距 | era 图注 `padding-top:26px`、threshold 条目 `padding:26px 0`、token 段间距、卡片 `padding-bottom:26px` |
| 29px | 相邻面板/列 | 双栏面板、案例、图卡的列 `gap:29px`；编号行 `column-gap:29px`；无眉标页头 `padding-bottom:29px` |
| 31px | 页头—文字块 | 页头 `padding-bottom:31px`、案例短版文字块 `padding-top:31px`、practice 步骤 `gap:31px` |
| 41px | 区段 | section `gap:41px`、编号列宽 41px、flow 节点 `padding:41px`、无眉标 h1 `padding-top:41px` |
| 48px | 卡片内边距 | 四宫格卡 `padding:48px 53px`、flow 节点左右 `48px`、封面名签右内距 `48px` |
| 56px | 章节 | flow 上下两段 `gap:56px` |
| 67px | 版心/两栏 | 版心上下 67px、两栏 `gap:67px`、双栏面板左右 `67px` |

### 3.2 就近原则（唯一正确表达方式）

1. **同一组**内的元素 → 父级 `gap`（横向或纵向统一）。
2. **组与组**之间 → 后一组的自身 `padding`（`padding-top` 为主）。
3. **带边框/背景的块**的组间距 → 外面套一层透明 `padding` 容器，**不得并进内 padding**（否则背景/边框会变高）。
4. **禁止 `margin`**（任何形式、任何值）；编辑器不认、且会破坏对齐。
5. 间距值必须落在梯度上；栅格 gap、卡片 padding 等**版式常量**直接取版式表里的值（§6），不要拿梯度近似。

### 3.3 版式结构性常量（不参与梯度）

| 常量 | 值 | 出现位置 |
|---|---|---|
| 两栏栅格 gap | 67px | profile、content-figure |
| 双面板/图卡列 gap | 29px | duo-panels、cases、card-grid-2 |
| 四宫格 gap | 43px | card-grid-4（横纵同值） |
| practice 左右 gap | 77px | practice |
| flow 箭头列宽 | 67px | flow 的 `1fr 67px 1fr 67px 1fr` |
| 编号行三列 | 41px / 310px / 1fr，column-gap 29px | numbered-rows |
| 卡片内边距 | 48×53 / 82×67 / 40×44 / 19×19×29 / 19×19×26 | 见各版式 |
| 封面横向坐标 | 115 / 360 / 86 / 120 / 204 / 48 | 见 cover |

### 3.4 间距禁止项

- 禁止 `margin`（含 `margin:0`）。
- 禁止 `padding:67 77 62 77px` 这类**单位不全**的写法（整条声明会被浏览器丢弃）。
- 禁止用负 margin / 负偏移「挤」出间距。
- 禁止同一组内混用 gap + padding 两种间距来源（择一）。
- 禁止用空 `<div>` 当 spacer（封面名签区的 `padding-top:120px` 是版式常量，属特例）。

---

## 4. 圆角、描边、阴影

### 4.1 圆角 7 档

| 档 | 值 | 用途 |
|---|---|---|
| r-8 | 8px | tag 药丸（threshold） |
| r-13 | 13px | 图标底块（50×50） |
| r-14 | 14px | 截图框、链条项 |
| r-17 | 17px | 图表/插画图块（era、threshold） |
| r-22 | 22px | 案例卡、图卡外框（cases、card-grid-2） |
| r-24 | 24px | 面板、四宫格卡、大图（faq）、About 照片框 |
| r-pill | 100px（封面名签 999px，二者等价） | 药丸/胶囊/按钮 |

规则：圆角只取上表值。图片默认**不自己写圆角**：有裁剪框时（cases 截图、About 照片）由父容器 `border-radius` + `overflow:hidden` 裁切，否则会出现双层圆角/漏边。唯一例外：campus 双图卡的图**没有**父裁剪框，图片自己写 `border-radius:14px`（见 §6.4.2）。

### 4.2 描边

| 用途 | 写法 |
|---|---|
| 页头下分隔线 | `1px solid #D9E1DC` |
| 编号行行分隔线 | `1px solid #DCE3DE` |
| 条目列表分隔线 | `1px solid #D9E1DC`（`border-top`，末项补 `border-bottom`） |
| 引用块左线 | `3px solid #2FAE72` |
| 截图框虚线 | `1px dashed #D9E1DC` |

### 4.3 阴影

只有两档，都是灰绿 10% 漫射，**不得自造阴影**：

| 档 | 值 | 用途 |
|---|---|---|
| 小阴影 | `0 10px 26px rgba(11,58,41,0.10)` | 页头 CTA 药丸（prelude） |
| 大阴影 | `0 12px 41px rgba(11,59,41,0.10)` | 整页大图（faq） |

---

## 5. 色彩使用要点

### 5.1 23 个 token 清单

| token | hex | 用途 | 限制 |
|---|---|---|---|
| surface | `#F7F8F5` | 页面底色 | 唯一底色 |
| surface-card | `#EAECEA` | 默认卡片/面板底 | 四宫格第 1 张、双栏第 1 栏、flow 两端节点、案例卡 |
| surface-card-alt | `#E8EDEA` | 交替卡片底 | 四宫格第 2 张 |
| surface-card-mint | `#E5EEE8` | 薄荷系卡片底 | 四宫格第 3 张、双栏第 2 栏、flow 中间节点、practice 下块 |
| surface-mint | `#DFF1E6` | 高亮胶囊/标签底 | 封面名签、tag |
| surface-inverse | `#0B3A29` | 反白页底 | 本 deck 不用 |
| surface-inverse-deep | `#101714` | 暗层/总览底 | 本 deck 不用 |
| text-ink | `#141C18` | 主标题/强文字 | 标题默认色 |
| text-heading | `#0B3A29` | 页内小标题 | 步内标题、引用、About 姓名段 |
| text-body | `#3B463F` | 正文 | 条目正文、说明段 |
| text-body-soft | `#4A544E` | 副标题/次级正文 | 副标题、要点、案例描述 |
| text-muted | `#5A645E` | 辅助正文 | 编号行正文、密集说明 |
| text-subtle | `#63736B` | 弱化说明/编号 | 编号、图注、弱化标签 |
| text-on-mint | `#0B4A32` | 薄荷底/按钮上的文字、链接 | 药丸文字、链接、CTA 文字 |
| accent-brand | `#2FAE72` | 品牌绿 | **仅图形/圆点/填充/描边**，禁止当文字 |
| accent-text | `#17754A` | 当文字用的绿 | 行内强调、案例编号、步骤编号 |
| accent-eyebrow | `#3C6B52` | 眉标绿 | 仅眉标文字 |
| accent-highlight | `#BFF2D2` | 薄荷高亮带/CTA 底 | 高亮渐变、CTA、按钮底 |
| line | `#D9E1DC` | 强分隔线/边框 | 页头线、条目线、截图虚线 |
| line-soft | `#DCE3DE` | 弱分隔线/占位底 | 编号行线、截图占位底 |
| inverse-text | `#D6EFE2` | 反白页正文 | 本 deck 不用 |
| inverse-label | `#7FB49A` | 反白页标签 | 本 deck 不用 |
| neutral-graphic | `#9BA8A1` | 装饰箭头/图形 | 箭头字符、流程箭头 |

### 5.2 文字 / 图形分工（最容易搞错）

| 要表达 | 用什么 | 不能用 |
|---|---|---|
| 绿色**文字**（强调/编号/链接） | `#17754A`；链接用 `#0B4A32` | `#2FAE72`（对比度 ≈2.7:1，不足 3:1） |
| 绿色**图形**（圆点/描边/填充/强调带） | `#2FAE72` | 不要为了「好看」把图形改成浅绿 |
| 薄荷底上的文字 | `#0B4A32` | `#141C18`（对比够但语义不对）、`#2FAE72` |
| 反白页 | `#0B3A29` 底 + `#D6EFE2` 文字 + `#7FB49A` 标签 | 本 deck 不用 |
| 弱化说明 | `#63736B` | 原版遗留的 `#8A968F` / `#A7B3AC`（对比度不足，已废弃） |

### 5.3 对比度规则

- 正文/说明最低 `#63736B`（在 `#F7F8F5` 上 ≈4.7:1，满足 AA 正文）。
- 更浅的灰（原版 `#8A968F`、`#A7B3AC`）一律替换为 `#63736B`；原文里 `#2FAE72` 当文字的地方替换为 `#17754A`。
- 参考值（对 `#F7F8F5`，计算值）：`#141C18` ≈16:1、`#3B463F` ≈9:1、`#4A544E` ≈7.4:1、`#5A645E` ≈5.8:1、`#3C6B52` ≈5.8:1、`#17754A` ≈5.4:1、`#63736B` ≈4.7:1、`#2FAE72` ≈2.7:1（**禁作文字**）；`#0B4A32` 在 `#DFF1E6` 上 ≈8.8:1。
- 一页最多 **2 处**强调（薄荷高亮带或 accent 文字合计），超了注意力就散了。

### 5.4 底色与卡片槽位

- 页面底色恒为 `#F7F8F5`，禁止反白页（本 deck 无）。
- 卡片底色按**固定顺序**取槽位，不随内容变化：四宫格 = `#EAECEA` / `#E8EDEA` / `#E5EEE8` / `#DFF1E6`；双栏 = `#EAECEA` + `#E5EEE8`；flow 三节点 = `#EAECEA` / `#E5EEE8` / `#EAECEA`；practice 上下块 = `#EAECEA` + `#E5EEE8`。
- 卡片底色不得换色阶、不得用同色深浅区分层级。

---

## 6. 8 种版式

### 6.0 版式总览

| # | 版式 | 页面 | 主体结构 | 关键常量 |
|---|---|---|---|---|
| 1 | cover | cover | 绝对定位图 + 垂直居中列 | `padding:0 115px`、名签 334×167 |
| 2 | profile | about | `grid:564px 1fr` gap 67 | 照片 564×672 r24 |
| 3 | content-figure | prelude、era、threshold、token、future | `grid:[W]px 1fr` gap 67 | 左图宽 1766/768/564/960/792 |
| 4 | card-grid | path、campus | `2×2` gap 43 / `2×1` gap 29 | 卡 r24/48×53、r22/19×19×26 |
| 5 | numbered-rows | dilemma | 纵向 flex，每行 `41px 310px 1fr` | 行 padding 19px 0 |
| 6 | duo-panels | learn、practice | `1fr 1fr` gap 29 / `672px 1fr` gap 77 | 面板 r24 |
| 7 | flow | ipo | 纵向 gap 56 + `1fr 67px 1fr 67px 1fr` | 节点 min-height 238 |
| 8 | cases | learn-ai-1/2、cases-1/2 | `1fr 1fr` gap 29 | 截图高 502 / 538 |
| 附 | 单图页 | faq | 主体居中单图 | 1548×619 r24（不属于 8 版式） |

参数速查（每版式的「必读数字」）：

| 版式 | 栅格列 | gap | 卡片/面板 padding | 圆角 | 主体对齐 |
|---|---|---|---|---|---|
| cover | — | — | — | 999 / pill | 垂直居中 |
| profile | 564px 1fr | 67 | — | 24 | align-items:center |
| content-figure | [W]px 1fr | 67 | — | 17 | align-items:center |
| card-grid 2×2 | 1fr 1fr / 1fr 1fr | 43 | 48px 53px | 24 | — |
| card-grid 2 | 1fr 1fr | 29 | 19px 19px 26px | 22 | align-content:start |
| numbered-rows | 41px 310px 1fr | 29（列） | 19px 0（行） | — | align-items:center（行） |
| duo-panels（双栏） | 1fr 1fr | 29 | 82px 67px | 24 | align-content:center |
| duo-panels（practice） | 672px 1fr | 77 | 40px 44px | 24 | align-items:stretch |
| flow | 1fr 67px 1fr 67px 1fr | 56（纵向） | 41px 48px | 24 | 节点内居中 |
| cases | 1fr 1fr | 29 | 19px 19px 29px | 22 / 14 | align-content:center |

**共同约束（8 种版式都适用）**

- 页头：§1.4 三变体之一；页头与主体之间固定 `gap:41px`。
- 主体：`flex:1`；常规页可用高 700px；不得越过下边距。
- 页脚：**每种版式都不写页脚元素**，只保留 62px 下边距。
- 圆角/阴影/描边：只取 §4 的档位。
- 版式之间**不得混搭**（如案例卡里塞编号行）；确需复合时按 §6.6.2 / §6.3 threshold 的「版式 + 步骤」组合方式，并保持相同 gap 常量。

---

### 6.1 cover（封面）

**用途**：开场页，一眼看到主题与讲者。全 deck 唯一的非版心页。

**结构（自上而下 / 由后到前）**

1. `section`：`padding:0 115px`，`flex column` + `justify-content:center` + `align-items:flex-start`，`position:relative`，`overflow:hidden`。
2. TRAE logo（绝对定位）：`left:115px; top:64px`，138×46，`object-fit:contain`，`mix-blend-mode:multiply`。
3. 小助手插画（绝对定位）：`right:0; bottom:67px`，780×520，`contain` + `multiply`，`opacity:0.9`。
4. 文字列容器：`display:flex;flex-direction:column;align-items:flex-start;padding-left:360px`。
5. h1 主标题 → 副标题 → 名签组（`padding-top:120px`）→ 名签胶囊 + 头像。

**顺序硬约束**：两个绝对定位图片必须写在文字列容器**之前**（DOM 顺序 = 层叠顺序，写在后面会盖住标题）。

**尺寸**

| 元素 | 值 |
|---|---|
| 画布 padding | `0 115px`（上下 0，垂直居中） |
| 主标题 | display 104 / 1.22 / 800 / 字距 −3px / `#141C18`；两个关键词 `<span style="color:#17754A">` |
| 副标题 | card 41 / 1.2 / 400 / `#4A544E`；`padding-top:31px; padding-left:86px` |
| 名签组 | `padding-top:120px` |
| 名签容器 | 334×167，`position:relative`，`flex column` + `justify-content:flex-end` |
| 胶囊 | 底 `#DFF1E6`，`border-radius:999px`，`padding:17px 48px 17px 204px` |
| 名签文字 | card 41 / 1.2 / 800 / 字距 −0.8px / `#0B3A29` |
| 头像 | 190×167，`contain`，`position:absolute;left:0;bottom:0` |
| logo / 插画 | 138×46 / 780×520 |

**可变的量**：主标题文案与两个关键词、副标题、讲者名、头像与插画资产（须透明底/白底可 multiply）。

**禁止的写法**

- 绝对定位图片写在文字容器后面（盖字）。
- 用 `top:-40px` 之类负偏移让头像上溢 —— 用父容器 167 高 + 头像 `bottom:0` 实现。
- 给 h1/副标题加 margin 或 padding 来「调位置」（定位靠外层 `padding-left` / `padding-top` 常量）。
- 主标题排到 3 行以上；副标题换行成 2 行以上。
- 用带白底的 PNG（必须 `mix-blend-mode:multiply`）。
- 去掉 `overflow:hidden`（插画会出血到画布外被编辑器裁切）。

---

### 6.2 profile（讲者介绍）

**用途**：自我介绍页（About Me）。

**结构（页头 → 主体）**

- 页头：**变体 B 无副标题**（眉标 + 标题，无 sub）。
- 主体：`flex:1; display:grid; grid-template-columns:564px 1fr; gap:67px; align-items:center`。
- 左列：照片框 564×672（`border-radius:24px; overflow:hidden; background:#EAECEA`）+ 图片 `564×672; object-fit:cover`。
- 右列：`flex column` + `justify-content:center`，依次为
  1. h2 姓名条 →卡档 41 / 1.4 / 800 / 字距 −0.9px / `#0B3A29`；
  2. 引导段 → body 25 / 1.75 / 800 / `#0B3A29` + `padding-top:22px; padding-bottom:26px; border-bottom:1px solid #D9E1DC`；
  3. 要点列表 → `flex column; gap:22px; padding-top:22px`，每项两列（圆点包裹层 + p body 25 / 1.8 / `#4A544E`），圆点包裹层 `padding-top:18px`，圆点 8×8 `#2FAE72`；
  4. 引用段 → `25 / 1.95 / 700 / #0B3A29` + `padding-top:36px; padding-left:24px; border-left:3px solid #2FAE72`。

**尺寸**

| 元素 | 值 |
|---|---|
| 页头高 | ≈153（无副标题） |
| 主体高 | 700（flex:1） |
| 两栏 | 564px + 67px + 剩余 1135px |
| 照片框 | 564×672，r24 |
| 要点列表 | 行内 gap 12，列表 gap 22 |
| 引用块 | 左线 3px `#2FAE72` |

**可变的量**：姓名/职衔文案、照片资产（竖构图，按 564×672 裁切安全区）、要点条数（3–4 条，每条 ≤2 行）、引用句。

**禁止的写法**

- 图片写百分比宽度或不写 height（必须 564×672 + `object-fit:cover`）。
- 圆点用行内 `<span>` 或列表符号 —— 必须是独立包裹 `<div>`（`<div style="padding-top:18px"><div style="width:8px;height:8px;...">`）。
- 用 margin 分隔要点（用列表 `gap:22px`）。
- 栅格不写列宽（必须 `564px 1fr`，否则照片被压扁）。
- 引用段的绿线高于文字（`border-left` 只能 3px 且随段落高度）。

---

### 6.3 content-figure（图文两栏）

**用途**：左图右文的说理页。5 个变体覆盖 prelude / era / threshold / token / future。

**通用结构**

- 页头：常规（future 用变体 C 无眉标）。
- 主体：`flex:1; display:grid; grid-template-columns:[左列宽]px 1fr; gap:67px; align-items:center`。
- 左列：图片（`object-fit:contain`，必要时 `mix-blend-mode:multiply`）。
- 右列：说明/条目（或无线条段落）。

**变体参数表（严格照抄）**

| 变体 | 页 | 左列宽 | 图尺寸 | 圆角 / 混合 | 右列 |
|---|---|---|---|---|---|
| prelude | 楔子 | 全宽 1766 | 1766×577 `contain` | — | 无右列：主体 `flex:1; display:flex; align-items:center; justify-content:center`；页头加 `position:relative`，CTA 绝对定位 `right:86px; bottom:41px` |
| era | era | 768 | 768×301 `contain` + multiply | r17 | 图下 cap：24 / 1.7 / `#63736B` 居中，`padding-top:26px`；tip：24 / 700 / `#0B3A29` 居中，`padding-top:29px`，`white-space:nowrap`；条目列表：外层 `padding-right:34px`，每条 `padding:24px 0; border-top:1px solid #D9E1DC`（末条补 `border-bottom`），h3 用 lead 30 / 1.3 / 800，正文 24 / 1.9 / `#3B463F` + `padding-left:22px` |
| threshold | threshold | 564 | 564×376 `contain` | r17 | 3 个 step：每条 `padding:26px 0; border-top:1px solid #D9E1DC`；行内 `display:flex; gap:22px`；编号 24 / 800 / `#17754A` + `padding-top:10px`；标题 lead 30 / 1.3 / 800 / `#0B3A29` + `padding-bottom:14px`；正文 24 / 1.95 / `#5A645E`；tags 行 `display:flex; gap:12px; padding-top:19px`；tag = `24 / 1.2 / 700 / #0B4A32` + `background:#DFF1E6; border-radius:8px; padding:5px 18px` |
| token | token | 960 | 960×552 `contain`（**不加 blend**） | — | `padding-left:24px; border-left:3px solid #2FAE72`；3 段 `25 / 2.0 / #3B463F`，段间 `padding-top:26px` |
| future | future | 792 | 792×446 `contain` | — | 4 段 `24 / 1.95 / #3B463F`，段间 `padding-top:24px`；页头用**变体 C 无眉标** |

**prelude 的 CTA（页头内绝对定位）**

```html
<div style="position:absolute;right:86px;bottom:41px;display:flex;align-items:center;gap:14px;background:#BFF2D2;border-radius:100px;padding:19px 36px;box-shadow:0 10px 26px rgba(11,58,41,0.10)">
  <div style="width:24px;height:24px">外链 svg（stroke #0B4A32）</div>
  <a href="https://…" style="color:#0B4A32;font-size:24px;font-weight:700;text-decoration:none">查看 Slide 对应的完整文章</a>
</div>
```

注意：CTA 的 div 是定位宿主页头（`position:relative`）的绝对定位子元素；`svg` 不得放进 `<p>`。

**可变的量**：选用哪个变体、左图资产与尺寸、右列段落数（≤4）、tag 数量（≤3）、条目条数（≤4）。

**禁止的写法**

- 图片写百分比宽度，或只写 width 不写 height（必须成对写死）。
- 给 img 加 `flex:1` 让它自己缩放（会变形）。
- 给照片也用 `mix-blend-mode:multiply`（只用于白底插画/图表；token 页不用）。
- 左列宽写死成 `768px` 后换别的图（左列宽必须随变体改，gap 恒 67）。
- tag 用行内 `<span>` —— 必须是 `<p>` 药丸。
- 右列条目用 `<ul>` —— 用独立 `<div>` + `border-top`。
- CTA 写进正文流（会破坏页头高度，必须绝对定位）。

---

### 6.4 card-grid（2 列 / 2×2 卡片网格）

**用途**：并列信息（成长路径四宫格、校园支持双图卡）。两种参数集。

#### 6.4.1 四宫格（path，2×2）

**结构**：常规页头 + 主体 `flex:1; display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:43px`。

每张卡（`flex column` + `justify-content:center`）：

1. 顶部行：`display:flex; align-items:center; gap:22px; padding-bottom:22px`
   - 编号 `01` → 24 / 1.2 / 800 / 字距 1.2px / `#63736B`；
   - 图标底 50×50，`border-radius:13px; background:#F7F8F5`，内含 25×25 svg（`stroke:#0B4A32; stroke-width:1.8`）；
   - 标题 h2 → card 41 / 1.3 / 800 / 字距 −0.5px / `#141C18`，关键词 `<span style="color:#17754A">`。
2. 正文：`25 / 1.95 / #3B463F`，`padding-left:42px`（与标题左对齐，不能省）。

**尺寸**

| 元素 | 值 |
|---|---|
| 主体 | 1766×700 |
| 列宽 | (1766 − 43) / 2 = 861.5 |
| 行高 | (700 − 43) / 2 = 328.5 |
| 卡片 padding | `48px 53px`，r24 |
| 底色槽位 | `#EAECEA` / `#E8EDEA` / `#E5EEE8` / `#DFF1E6`（按 01→04 固定） |

#### 6.4.2 双图卡（campus，2 列）

**结构**：常规页头 + 主体 `flex:1; display:grid; grid-template-columns:1fr 1fr; gap:29px; align-content:start`。

每张卡：

1. 图 830×480，`object-fit:cover`，`border-radius:14px`。
2. meta 行：`display:flex; align-items:baseline; gap:22px; padding-top:22px; padding-left:10px; padding-right:10px`
   - 编号 24 / 800 / 字距 1.8px / `#17754A`；
   - 标题 h3 → lead 30 / 1.3 / 800 / `#141C18` / `white-space:nowrap`；
   - 描述 → 24 / 1.7 / `#4A544E` / `flex:1`；
   - 药丸：`#BFF2D2; border-radius:100px; padding:11px 22px`，内含 `<a>` 24 / 700 / `#0B4A32` / `nowrap`。

**尺寸**：卡片 padding `19px 19px 26px`，r22；列宽 (1766 − 29) / 2 = 868.5；卡内图宽 868.5 − 38 ≈ 830。

**可变的量**：4 张/2 张卡的文案与图、编号、图标 svg、关键词位置。

**禁止的写法**

- 用 flex 拼网格（行高不齐、卡片高低不一）—— 必须用 grid。
- 2×2 不写 `grid-template-rows:1fr 1fr`（两行高度不等）。
- 卡片间距用 margin（用 gap）。
- 正文不写 `padding-left:42px`（正文会顶到图标列，与标题错位）。
- 双图卡写 `align-content:center`（必须 `start`，否则顶部留白不一致）。
- 双图卡的图用 `contain`（必须 `cover`）。
- 用 `<a>` 直接当药丸（药丸必须 `<div>` 包 `<a>`）。
- 卡片底色顺序打乱，或四张卡用同色。

---

### 6.5 numbered-rows（编号行列表）

**用途**：3–5 条并列困境/要点，逐行分隔。最省空间的「信息密度」版式。

**结构**：常规页头 + 主体 `flex:1; display:flex; flex-direction:column`。

每行：

```html
<div style="flex:1;display:grid;grid-template-columns:41px 310px 1fr;column-gap:29px;align-items:center;border-bottom:1px solid #DCE3DE;padding:19px 0">
```

1. 编号列：24 / 1.2 / 800 / 字距 1.2px / `#63736B`。
2. 标题列：`display:flex; align-items:center; gap:17px`，内含 40×40 svg（`stroke:#0B4A32; stroke-width:1.7`）+ h3 card 41 / 1.3 / 800 / 字距 −0.6px / `#141C18`，h3 自带薄荷高亮：
   `background:linear-gradient(180deg,transparent 62%,#BFF2D2 62%); padding:0 5px`（flex 列内需 `align-self:flex-start`）。
3. 正文列：24 / 1.85 / `#5A645E` / `padding-right:26px`。

**高亮行**（每页最多 1 行）：不放进任何 `1fr` 列，另起一个整行 `<p>`：24 / 1.85 / `#141C18` + 同款渐变 + `padding:0 5px`，与上一段用 `padding-top:16px` 分隔。

**尺寸**

| 元素 | 值 |
|---|---|
| 主体 | 1766×700 |
| 三列 | 41 + 29 + 310 + 29 + 1357（1fr） |
| 行内边距 | `19px 0`（纵向） |
| 行高 | 3 行时每行 ≈233（flex:1 均分） |
| 分隔线 | `1px solid #DCE3DE`（每行都有） |

**可变的量**：行数（3–5）、编号文字、行标题/正文、图标 svg、是否带 1 行高亮。

**禁止的写法**

- 用 `<ul>/<li>` —— 每条必须是 grid 行。
- 标题的高亮用 `span` 背景 —— 背景必须设在 h3 自身 + `align-self:flex-start`。
- 同时写 `border-top` 和 `border-bottom`（双线）；行线只能 `border-bottom`。
- 用负 margin 让分隔线贴版心边。
- 列宽写 `auto` 或百分比（必须 `41px 310px 1fr`）。
- 5 行以上仍不拆页（超预算见 §7）。

---

### 6.6 duo-panels（双栏面板）

**用途**：左右对照（学习方式的变与不变）、左侧结论 + 右侧步骤（实践）。两种参数集。

#### 6.6.1 双栏对照（learn）

**结构**：常规页头 + 主体 `flex:1; display:grid; grid-template-columns:1fr 1fr; gap:29px; align-content:center`。

每个面板（`#EAECEA`，第 2 栏 `#E5EEE8`）：

1. h3 标题：card 41 / 1.3 / 800 / 字距 −0.5px / `#141C18`，箭头等符号用 `<span style="color:#17754A">`。
2. 要点列表：`flex column; gap:38px; padding-top:36px`，每项两列（圆点包裹 `padding-top:19px` + p body 25 / 1.85 / `#4A544E`）。
3. 引用：`25 / 1.8 / 700 / #0B3A29` + `padding-top:43px; padding-left:22px; border-left:3px solid #2FAE72`。

**尺寸**：面板 padding `82px 67px`，r24；列宽 (1766 − 29) / 2 = 868.5；行高由内容决定（grid 单行 auto，`align-content:center` 负责垂直居中）。

#### 6.6.2 左面板 + 右步骤（practice）

**结构**：常规页头 + 主体 `flex:1; display:grid; grid-template-columns:672px 1fr; gap:77px; align-items:stretch`。

- 左列（`flex column`，三块）：
  1. 上块：`#EAECEA; border-radius:24px; padding:40px 44px; flex:1; display:flex; flex-direction:column; justify-content:center`；
  2. 中间箭头行：`height:65px; display:flex; align-items:center; justify-content:center`，箭头字符 lead 30 / `#9BA8A1`（`↓`）；
  3. 下块：`#E5EEE8`，其余同上；
  - 块内：标题 lead 30 / 1.5 / 800 / 字距 −0.5px / `#141C18`；副文 24 / 1.85 / `#5A645E` + `padding-top:17px`。
- 右列（3 个 step，`flex column`）：
  - 每条 `display:flex; gap:31px; padding:46px 0; border-top:1px solid #D9E1DC`（最后一条补 `border-bottom`）；
  - 编号 24 / 800 / `#17754A` + `padding-top:10px`；
  - 标题 lead 30 / 1.3 / 800 / `#141C18` + `padding-bottom:12px`；
  - 正文 24 / 1.85 / `#5A645E`。

**尺寸**：左列 672 + 77 + 右列 1017；面板 r24；步骤区上下 padding 46。

**可变的量**：面板数（固定 2/2）、底色槽位、要点条数、箭头字符、步骤条数（3）。

**禁止的写法**

- 面板间距用 margin（用 gap:29px / 77px）。
- practice 左列不写 `flex:1`（三块不撑满，页面下半截空）。
- practice 不写 `align-items:stretch`（左右高度不齐）。
- 用 svg 大图标当箭头（用 lead 30 的字符箭头，`#9BA8A1`）。
- 面板里再套一层带底色的卡片（双层背景）；面板底色只有 `#EAECEA` / `#E5EEE8` 两槽。
- 引用块左线用 `#BFBFBF` 之类非 token 灰。

---

### 6.7 flow（三节点流程 + 链式示例）

**用途**：方法论三步（IPO 学习法）；下半是链式举例。

**结构**：常规页头 + 主体 `flex:1; display:flex; flex-direction:column; justify-content:center; gap:56px`。

- 上半（流程）：`display:grid; grid-template-columns:1fr 67px 1fr 67px 1fr; align-items:stretch`。
  - 节点：`#EAECEA`（中间 `#E5EEE8`），`border-radius:24px; padding:41px 48px; min-height:238px; display:flex; align-items:center; justify-content:center`。
  - 节点内容：`display:flex; align-items:baseline; gap:19px; justify-content:center`，内含 h3 card 41 / 1.3 / 800 / `#141C18` + 英文 lead 30 / 1.2 / 600 / `#5A645E`；首字母高亮写成 `<b><span style="color:#17754A">I</span></b>nput`（**b 不吃 style，必须 b 内再包 span**）。
  - 箭头列：`display:flex; align-items:center; justify-content:center`，内为 lead 30 / `#9BA8A1` 的 `→`。
- 下半：`flex:1; display:flex; flex-direction:column; gap:56px; justify-content:center`。
  1. 小标题：24 / 1.4 / 800 / `#141C18` + `padding-bottom:20px`；
  2. 链条：`display:flex; align-items:center; gap:17px; flex-wrap:wrap`，链条项 = `<p>` 24 / 1.2 / `#3B463F` + `background:#EAECEA; border-radius:14px; padding:17px 26px`，箭头 = lead 30 / `#9BA8A1`；
  3. 收尾说明：`24 / 1.9 / #3B463F` + `width:1488px`（固定宽，保证换行位置稳定）。

**尺寸**

| 元素 | 值 |
|---|---|
| 上段 | 节点 min-height 238；箭头列 67；节点列 (1766 − 134) / 3 = 544 |
| 纵向节奏 | 上段与下段 `gap:56px` |
| 下段两层 | `gap:56px` |

**可变的量**：节点数（固定 3，对应 IPO 语义）、节点中英文、链条项数与文案（4–6 项）、说明文字。

**禁止的写法**

- 节点用固定 `height`（必须 `min-height:238px` + `align-items:center`，否则内文换行被裁）。
- 箭头用 svg/图片放大（用 30px 字符箭头 + `#9BA8A1`）。
- `<b style="color:#17754A">`（b 不吃内联 style，首字母高亮失效）。
- 链条项用行内 `<span>`（padding 不生效，必须 `<p>`）。
- 说明段用百分比宽度（必须 `width:1488px`，否则不同环境换行不一致）。
- 节点底色三块全同色（中间节点必须 `#E5EEE8`）。

---

### 6.8 cases（2 列案例图卡）

**用途**：截图 + 编号/标题/描述/链接的案例卡。`short` 与 `tall` 两种截图高度。

**结构**：常规页头 + 主体 `flex:1; display:grid; grid-template-columns:1fr 1fr; gap:29px; align-content:center`。

每张卡（`flex column`）：

1. 截图框：`height:502px`（short）/ `height:538px`（tall），`border-radius:14px; overflow:hidden; background:#DCE3DE; border:1px dashed #D9E1DC`；
2. 图片：830×502 / 830×538，`object-fit:cover`；
3. 文字区，两种排法：
   - **short**：`padding-top:31px; padding-left:10px; padding-right:10px`；标题行 `display:flex; align-items:baseline; gap:14px`（编号 24 / 800 / 字距 1.8px / `#17754A` + h3 lead 30 / 1.3 / 800 / `#141C18` / `nowrap`）；描述 24 / 1.8 / `#4A544E` + `padding-top:14px`；
   - **tall**：单行 `display:flex; align-items:center; gap:22px; padding-top:26px; padding-left:10px; padding-right:10px`，内含标题行 + 描述（`flex:1; 24 / 1.7 / #4A544E`）+ 按钮（`display:flex; align-items:center; gap:8px; background:#BFF2D2; border-radius:100px; padding:14px 29px`，内 16×16 外链 svg + `<a>` 24 / 1.2 / 700 / `#0B4A32` / `nowrap`）。

**尺寸**

| 项 | short（learn-ai-1/2） | tall（cases-1/2） |
|---|---|---|
| 卡片 padding | `19px 19px 29px` | 同 |
| 圆角 | 22 | 22 |
| 截图框高 | 502 | 538 |
| 图尺寸 | 830×502 | 830×538 |
| 文字块上距 | 31 | 26 |
| 列宽 | (1766 − 29) / 2 = 868.5 | 同 |

**可变的量**：截图高度（short/tall）、编号 01/02、标题、描述、链接地址。

**禁止的写法**

- 截图用 `object-fit:contain`（会留白框，必须 `cover`）。
- 图片写百分比宽度或不写 height。
- 在 `<p>` 里放 `<svg>`（外链图标必须放 `<div>` 里）。
- 用 `<a>` 直接当药丸背景（药丸必须 `<div>` 包 `<a>`）。
- short 版描述超过 2 行（会顶出 700 预算）。
- `align-content` 写 `start`（案例页必须 `center`，卡片垂直居中）。
- 截图框不加 `overflow:hidden`（cover 图不收圆角）。

---

### 6.9 附：单图页（faq）

不属于 8 种版式，是 content-figure 的退化形态（无文字列），仅 faq 使用。

- 页头：**变体 C 无眉标**（标题 + 副标题）。
- 主体：`flex:1; display:flex; align-items:center; justify-content:center`。
- 单图：1548×619，`object-fit:contain`，`border-radius:24px`，`box-shadow:0 12px 41px rgba(11,59,41,0.10)`。
- 可变量：图片资产；禁止：加文字、加边框、缩放超 1548 宽。

---

## 7. 页面预算与超预算处理

### 7.1 页面预算表

| 项 | 值 | 说明 |
|---|---|---|
| 画布高 | 1080 | |
| 上边距 | 67 | 固定，不可压缩 |
| 页头 | 210（常规）/ 153（无副标题）/ 193（无眉标） | 见 §1.4 |
| 页头—主体间隔 | 41 | section 的 `gap` |
| 主体 | **≤700** | `flex:1` 填充；700 是常规页的设计上限 |
| 下边距 | 62 | 页脚留白，不可压缩 |
| 内容总高 | **951** | 页头 + 41 + 主体；也等于 1080 − 67 − 62 |
| 画布占用率 | **0.88** | 951 / 1080 |
| 硬上限 | **≤0.95**（= 1026） | 报警线：内容总高 / 1080 不得超过 0.95 |

校验算式：`67 + 210 + 41 + 700 + 62 = 1080`；`210 + 41 + 700 = 951`；`951 / 1080 ≈ 0.88`。

### 7.2 各页头变体下的主体余量

页头变体让出的高度会全部给主体（`flex:1`），所以不同页头的主体「实际可得」不同：

| 页头变体 | 页头 | 主体实际可得 | 内容总高 | 占用率 |
|---|---|---|---|---|
| 常规（眉标+标题+副标题） | 210 | 700 | 951 | 0.88 |
| 无副标题（about） | 153 | 757 | 951 | 0.88 |
| 无眉标（future / faq） | 193 | 717 | 951 | 0.88 |

规则：**设计仍按主体 ≤700 做**，多出的 57 / 17px 是空气（留白），不得用来再塞一条信息。任何页若想把主体撑到 775（= 内容总高 1026 = 0.95），说明它已经没有任何呼吸空间，等同于超预算。

### 7.3 超预算处理顺序（不可跳步）

1. **删信息**：合并同类要点、删掉可省的说明句、把次要说明降到 caption 档或整段删除。
   - 不删事实与数字，不改写原文措辞（文案逐字复制，见 §9）。
   - 一页强调 ≤2 处，多出的高亮删掉。
2. **拆页**：同一版式复制成两页。
   - numbered-rows：3 + 3 或 3 + 2；
   - card-grid 四宫格：拆成两张 2×1，或 2×2 → 两页 2 列；
   - content-figure 条目：4 条拆 2+2；
   - flow 的链条示例单独成页。
3. **最后才动字号**：只在 7 档内降档（title → card → lead → body → caption），且**不得低于 24px**。
   - 禁止用减小行高/加负字距「挤」文字来省高度（行高按 §2.1 取）；
   - 禁止压缩版心 padding（67/77/62）；
   - 禁止用绝对定位/负偏移把元素塞进画布。

---

## 8. 常见错误清单

### 8.1 高频错误（12 条）

| # | 错误写法 | 后果 | 正确写法 |
|---|---|---|---|
| 1 | `padding:67 77 62 77px` | 浏览器丢弃整条声明 → 内容贴边、溢出 | 每个值都带单位：`padding:67px 77px 62px 77px` |
| 2 | 主体容器漏写 `flex:1` | 页面下半截空白 / 内容不居中 | 该撑满的容器显式 `flex:1` |
| 3 | 定位宿主漏写 `position:relative` | 绝对定位子元素跑到画布左上角 | 宿主显式 `position:relative`（封面 section、名签容器、prelude 页头） |
| 4 | 用 `margin` 表达间距；把间距并进带边框/背景块的 `padding` | 编辑器不认 margin；背景/边框随 padding 变高 | 组内用父级 `gap`，组间用自身 `padding`；带背景块外套透明 padding 容器 |
| 5 | 负偏移 `left:-7px` / `top:-40px` | 越界、被裁、与相邻元素重叠 | 提到上一级或 section 级用绝对定位 + 画布坐标；封面头像用「父容器 167 高 + 头像 `bottom:0`」实现上溢 |
| 6 | 用 `span` 加背景做高亮 | 行内背景只覆盖文字盒、对不齐、撑不满 | 背景设在 `p/h3` 自身：`background:linear-gradient(180deg,transparent 62%,#BFF2D2 62%)`；flex 列内加 `align-self:flex-start` |
| 7 | 图片用百分比宽度 | 变形、被拉伸、高度塌陷 | 写死 `width` + `height` + `object-fit:cover/contain` |
| 8 | 用 `em/rem/vw/vh/var()` | 随环境变化，跨页不一致；闭合子集不允许 | 全部写 px 绝对值 |
| 9 | 把 `p/h1/h2/h3` 当 flex 容器 | 浏览器表现异常、子元素错乱 | 外层包 `<div style="display:flex;…">` |
| 10 | 行内元素（`span/a`）当流子元素做药丸/带 padding 的块 | padding 不生效、行高错乱 | 文字药丸提升为 `<p>`，含图标/链接的药丸提升为 `<div>` |
| 11 | 绝对定位元素溢出父容器 | 被裁切，或盖住页头文字 | 提到 section 级用画布坐标；父容器保留 `overflow:hidden` 只在确实要裁切的图上 |
| 12 | 用 `#2FAE72` 当文字色 | 对比度 ≈2.7:1，看不清 | 文字绿用 `#17754A`；`#2FAE72` 只做圆点/描边/填充 |

### 8.2 同类补充（同样直接判错）

- 在 `<p>` 里放 `<svg>`。
- 用 `class` / `<style>` / `!important` / `z-index` / `float`。
- 自造颜色（不在 §5.1 的 23 个 hex 内）。
- 字号 < 24px，或用 7 档以外的字号。
- 用空 `<div>` 当 spacer 做组间距。
- 一页出现两个 title 档标题 / 两处以上高亮。
- `border-left` 引用线高于文字，或线色非 `#2FAE72`。
- 文案改写、缩写、补句，或标点/空格/`<br>` 与原版不一致。

---

## 9. 验收清单

### 9.1 机器验收

1. `check` 结果 `problems: 0`（只看自己负责的页面；别人的文件不存在导致的引用问题不算）。
2. `notes` 里以「排版」开头的问题（溢出 / 重叠 / 文字比盒子宽）必须清零。
3. 硬规则抽检：无 `margin`、`class`、`<style>`、`var()`、`em/rem`、`vw/vh`、百分比图片宽、负偏移、`z-index`、`!important`。
4. 属性抽检：字号 ∈ {104,56,41,30,25,24} 且 ≥24；颜色 ∈ 23 个 token。
5. 结构抽检：每文件只有一个 `<section>`，section 外无字符；`padding` 每个值都带 px。
6. 图片抽检：`width` + `height` 成对写死，`object-fit` 与用途匹配（截图/照片 cover，图表/插画 contain）。

### 9.2 双尺寸验收

- **成品**：1920×1080 逐页渲染，18 页无溢出、无重叠、文字不压边。
- **基准**：1600×900 原版等比 ×1.2 放大到 1920×1080，作为视觉对照。
- 两种尺寸下：页头左缩进与上边距一致、卡片不被裁、`flex:1` 撑满、箭头/编号与文字基线对齐、图片不变形。

### 9.3 逐页像素比对

- 每页与原版对应页做像素差，记录 `meanDiff`。
- 阈值：**≤ 25 通过**；**> 25 必须逐页人工看并修**（修完重测）。
- 已知必须复核的 5 处：
  1. 封面：头像底边与胶囊底边对齐，头像向上溢出胶囊；
  2. IPO 页：`→` 与三节点垂直居中对齐；
  3. 案例页：01/02 编号与标题间距、标题与描述间距；
  4. About Me：要点圆点与首行文字对齐；
  5. 引用块：左侧绿条不得高于文字。

### 9.4 文案验收

- 逐字一致：不改写、不缩写、不补句、不新增事实/数字。
- 标点、空格、全半角、`<br>` 位置与原版完全一致。
- 链接文字不变：正文内链接 `<a href="https://…" style="color:#0B4A32;text-decoration:underline">`；药丸/按钮内链接 `color:#0B4A32;font-size:24px;font-weight:700;text-decoration:none;white-space:nowrap`。两种都不得改链接文案。

---

## 10. 附录：页面 → 版式 → 变体索引

| # | id | 版式 | 变体 / 参数 | 页头 | 图 |
|---|---|---|---|---|---|
| 1 | cover | cover | — | 无页头（封面） | logo 138×46、插画 780×520、头像 190×167 |
| 2 | about | profile | 无副标题 | B | 564×672 cover |
| 3 | prelude | content-figure | 全宽图 1766×577 + 页头 CTA | A | 1766×577 contain |
| 4 | path | card-grid | 2×2 四宫格（gap 43） | A | 图标 svg |
| 5 | dilemma | numbered-rows | 3 行 + 1 高亮行 | A | 图标 svg 40×40 |
| 6 | era | content-figure | 左图 768 + 条目列表 | A | 768×301 contain+multiply |
| 7 | learn | duo-panels | 双栏对照（gap 29） | A | — |
| 8 | learn-ai-1 | cases | short（截图 502） | A | 830×502 cover ×2 |
| 9 | learn-ai-2 | cases | short（截图 502） | A | 830×502 cover ×2 |
| 10 | ipo | flow | 3 节点 + 链条 | A | — |
| 11 | practice | duo-panels | 左面板 + 右步骤（gap 77） | A | — |
| 12 | cases-1 | cases | tall（截图 538） | A | 830×538 cover ×2 |
| 13 | cases-2 | cases | tall（截图 538） | A | 830×538 cover ×2 |
| 14 | threshold | content-figure | 左图 564 + 3 step + tags | A | 564×376 contain |
| 15 | campus | card-grid | 2 列双图卡（gap 29） | A | 830×480 cover ×2 |
| 16 | token | content-figure | 左图 960 + 左线三段 | A | 960×552 contain |
| 17 | future | content-figure | 左图 792 + 4 段 | C | 792×446 contain |
| 18 | faq | 单图页（附） | — | C | 1548×619 contain |

页头变体：A = 常规（眉标+标题+副标题）；B = 无副标题；C = 无眉标。
