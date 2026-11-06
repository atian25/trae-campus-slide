# AI 时代的机遇和挑战：今天的学生，如何走向明天的世界

分享人：天猪 · TRAE Campus

## 目录结构

- `article/`  原文资料（飞书文档同步下来的 markdown 与配图）
- `slide/`    网页幻灯片
  - `deck.html`  **唯一源文件**，所有页面、样式、脚本都在这一个文件里
  - `img/`       配图（`tz_dog7.png` 是天猪抠图的原始素材，`tz-dog-cut.png` 由它去背生成）
  - `server.mjs` 本地预览用的 Node 静态服务
  - `build.py`   只负责生成发布单文件（开发时用不到）
- `release/`  对外产物（18 张 PNG、PDF、单文件 HTML），不进 Git
  - `trae-campus-slide-tz/` Cloudflare 部署工程（`public/index.html` 为整份单文件站点），同样不进 Git

## 预览

    cd slide
    node server.mjs            # 默认 8765，也可 node server.mjs 8080
    # 打开 http://127.0.0.1:8765/

操作：← → / 空格 / **鼠标滚轮** 翻页，数字键跳页，Home/End 首末页，Esc 缩略图总览，`?clean` 隐藏页码与底部提示（导出时用）。

## 构建与导出（需要时才跑）

    cd slide
    python3 build.py --publish     # -> ../release/AI时代的机遇和挑战-单文件.html（图片内嵌）

PDF：用单文件版加打印样式（`@page{size:1600px 900px;margin:0}`，每页 `.p` 固定 1600×900 且 `page-break-after:always`），再用 Chrome 无头 `--print-to-pdf --no-pdf-header-footer` 输出。

## 若干约定

- 版心 1600×900，所有尺寸走 `--u` 流体单位，导出 2 倍图即 3200×1800
- 单色薄荷绿体系，一页最多两处高亮
- 不用「——」，标题不重复

## 版本管理

Git 已初始化，`release/` 产物与常见的 Node / Python 依赖目录不入库（见 `.gitignore`）。
