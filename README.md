# AI 时代的机遇和挑战：今天的学生，如何走向明天的世界

天猪 · TRAE Campus 高校分享

一套 18 页的 16:9 网页幻灯片，纯 HTML/CSS/JS 手写，不依赖前端框架。构建时把图片压缩内嵌成单文件，部署到 Cloudflare Workers。

## 相关链接

| 内容 | 地址 |
| --- | --- |
| 知乎回答 | <https://www.zhihu.com/question/2076658003068052960/answer/2102009083041674168> |
| 飞书文档 | <https://my.feishu.cn/wiki/KUvWwdDzfiBI2Vkzjzwc7S6SnTe> |
| 在线幻灯片 | <https://trae-campus-slide-tz.atian25.workers.dev> |
| PDF（每次构建覆盖更新） | <https://github.com/atian25/trae-campus-slide/releases/tag/pdf-latest> |

## 目录

| 路径 | 说明 |
| --- | --- |
| `slide/deck.html` | 幻灯片本体。文件里从上到下是 18 个 `<section class="p">`，一个 section 就是一页，样式和翻页脚本也都在这里 |
| `slide/img/` | 配图。`deck.html` 里用 `<img src="img/xxx.png">` 引用，构建时统一压缩后内嵌进 HTML |
| `slide/server.mjs` | 本地预览用的静态服务 |
| `slide/build.ts` | 构建：压缩图片 → 内嵌成单文件 → `release/site/index.html` |
| `slide/pdf.mjs` | 导出 PDF：用无头 Chrome 打印 |
| `article/` | 分享内容对应的原文快照（Markdown + 17 张配图），方便回头查原始素材 |
| `release/` | 构建产物，不进 Git：`site/` 站点目录、PDF |
| `void.config.ts` | Cloudflare 部署配置：worker 名 `trae-campus-slide-tz` 和账号 ID |

## 本地预览

```sh
npm install
npm run preview     # http://127.0.0.1:8765
```

操作：← → / 空格 / 鼠标滚轮翻页，数字键跳页，Home/End 首末页，Esc 缩略图总览；网址加 `?clean` 隐藏页码和底部提示。

## 修改内容

- **改页面**：直接编辑 `slide/deck.html`，一个 `<section class="p">` 是一页，顺序就是放映顺序
- **改尺寸**：版心固定 1600×900，所有尺寸都写成 `calc(var(--u) * N)`，`--u` 会随窗口自适应，不要写死 px
- **加图片**：放进 `slide/img/`，在 `deck.html` 里用相对路径引用即可，构建时会自动压缩
- **配色**：米白底 `#F7F8F5`、薄荷 `#BFF2D2` / `#2FAE72`、深绿 `#0B3A29`，一页最多两处高亮

## 命令

| 命令 | 作用 |
| --- | --- |
| `npm run preview` | 启动本地预览（8765 端口） |
| `npm run build` | 构建站点到 `release/site/` |
| `npm run deploy` | 构建并部署到 Cloudflare Workers |
| `npm run pdf` | 生成高画质 PDF 到 `release/` |

## 自动部署

`.github/workflows/deploy.yml`：push 到 `main`（或手动触发）后依次执行

1. `npm ci` + `npm run build`
2. `npm run pdf` 导出 PDF
3. 把 PDF 覆盖更新到 Release（tag 固定为 `pdf-latest`，每次都只保留这一个 release 和一个 PDF 资产）
4. `void deploy` 发布到 Cloudflare Workers（配置了 `CLOUDFLARE_API_TOKEN` 才执行）

需要在仓库 Secrets 里配置 `CLOUDFLARE_API_TOKEN`（模板选 **Edit Cloudflare Workers**）；账号 ID 已写在 `void.config.ts` 里。

## 约定

- 不用「——」，标题不重复，语气保持口语化
- 页码在右上、章节眉标在左上
