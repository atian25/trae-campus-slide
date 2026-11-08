# Statement

反白观点页：深绿底 + 一句 104px 宣言 + 引用块，用于开场、转场或收尾。

## 用途

一页只说一件事。放在开场（定调）、章节之间（转场）或结尾（致谢/号召）时，用深绿底把节奏压下来，让读者只记住那一句话。全 deck 建议不超过 2 页。

## 结构

1. **画布**：1920×1080，`background: surface-inverse`（#0B3A29），`padding: 67px 77px 62px 77px`，纵向 flex，`gap:41px`。
2. **顶部标签**：13px 圆点 `accent-brand` + `label` 档 24px / 1.2 / 600 / 字距 2.4px / `inverse-label`。
3. **宣言**：`display` 档 104px / 1.22 / 800 / -3px，`inverse-text`（#D6EFE2）；与标签间距 41px，整块垂直居中。
4. **可选的副题**：24px / 1.7 / 400 / `inverse-label`，`padding-top:26px`。
5. **装饰箭头**：文本 `↓`，30px / `neutral-graphic`，与下面引用块相隔 41px。
6. **引用块**：左侧 3px `accent-brand` 竖线、左缩进 31px；引文用 `lead` 档 30px / 1.55 / 800 / `inverse-text`；署名 24px / 1.7 / 400 / `inverse-label`，`padding-top:22px`，以「—— 」开头。

## 数值

| 项 | 值 |
| --- | --- |
| 底色 | `surface-inverse` #0B3A29 |
| 版心 | `padding: 67px 77px 62px 77px`，主体高 951 |
| 标签 | 24px / 1.2 / 600 / 2.4px，`inverse-label` |
| 宣言 | 104px / 1.22 / 800 / -3px，`inverse-text` |
| 副题 | 24px / 1.7 / 400，`padding-top:26px` |
| 引用竖线 | 3px `accent-brand`，左缩进 31px |
| 引文 | 30px / 1.55 / 800，`inverse-text` |
| 署名 | 24px / 1.7 / 400，`inverse-label` |

## 规则

- 一页只有一个 104px 宣言；不再放第二个标题、不再放卡片。
- 反白页正文一律 `inverse-text`；标签与署名一律 `inverse-label`，不要用纯白（#FFFFFF 不在 token 里）。
- 深绿底上不叠加阴影（`shadow-elevation` 只用于浅色底）；不使用高亮带 `accent-highlight`，它在这个底色上会抢戏。
- 宣言里不换行两次以上；超过 12 个汉字就改用 title 档 56px，而不是缩小字距。
- 引用块只放一段引文，长度控制在 80–100 字（约两行 30px）。

## 不要这样做

- 不要把 Statement 做成「深色版的 Content Page」：没有页头分隔线、没有眉标行、没有两栏。
- 不要在反白页用 `text-body` / `text-ink`，它们在 #0B3A29 上不可读。
- 不要用图片或插画当背景，深绿本身就是版式的一部分。

## 消费者提供

一句宣言、可选副题、一段引文与署名（或去掉引用块，只留宣言 + 副题）。

## 预览

`preview.html` 是一张 1920×1080 画布，外层 480×270 + `overflow:hidden`，内部 `transform:scale(0.25)`；只引用 `../../tokens.css`，静态、无脚本、无外部资源。
