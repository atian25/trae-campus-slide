# AI 时代的机遇和挑战：今天的学生，如何走向明天的世界

分享人：天猪 · TRAE Campus

## 目录结构

- `article/`  原文资料（飞书文档同步下来的 markdown 与配图）
- `slide/`    网页幻灯片
  - `deck.html`  **唯一源文件**，所有页面、样式、脚本都在这一个文件里
  - `img/`       配图（`tz_dog7.png` 是天猪抠图的原始素材，`tz-dog-cut.png` 由它去背生成）
  - `server.mjs` 本地预览用的 Node 静态服务
  - `build.ts`   发布构建：把图片内嵌成单文件站点
- `package.json`  脚本入口：`preview` / `build` / `deploy`
- `release/`  对外产物（18 张 PNG、PDF、单文件 HTML），不进 Git
  - `trae-campus-slide-tz/` Cloudflare 部署工程（`void.config.ts` + `public/index.html`），同样不进 Git

## 预览

    npm run preview            # 等价于 node slide/server.mjs，默认 8765
    # 打开 http://127.0.0.1:8765/

操作：← → / 空格 / **鼠标滚轮** 翻页，数字键跳页，Home/End 首末页，Esc 缩略图总览，`?clean` 隐藏页码与底部提示（导出时用）。

## 构建与部署

    npm install                # 首次：装 sharp（图片压缩）与 void（部署）
    npm run build              # 生成单文件站点 release/trae-campus-slide-tz/public/index.html
    npm run deploy             # build + void deploy --platform cloudflare
    npm run pdf                # 高画质 PDF -> release/AI时代的机遇和挑战.pdf

线上：<https://trae-campus-slide-tz.atian25.workers.dev>

PDF 由 `slide/pdf.mjs` 生成：先用 `build.ts --hq` 打一版原图分辨率、质量 96 的单文件，再用无头 Chrome 的打印协议导出 18 页（每页 1600×900，`@page` 与 `@media print` 写在 `deck.html` 里）。

## 若干约定

- 版心 1600×900，所有尺寸走 `--u` 流体单位，导出 2 倍图即 3200×1800
- 单色薄荷绿体系，一页最多两处高亮
- 不用「——」，标题不重复

## 版本管理

Git 已初始化，`release/` 产物、`node_modules/` 依赖目录不入库（见 `.gitignore`）。
构建脚本是 TypeScript，直接由 Node 24 的 type stripping 运行，无需编译或额外工具链。
