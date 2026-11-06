# 原文资料（飞书同步）

本目录是飞书原稿的本地快照，由 lark-cli docs +fetch 拉取，最近一次同步：2026-11-06。

- 原文.md：正文（图片引用已替换为本地 images/ 路径）
- images/01.png ~ images/17.png：文中全部 17 张图片，按出现顺序编号

源文档：https://my.feishu.cn/wiki/KUvWwDzfiBI2Vkzjzwc7S6SnTe

## 同步方式

1. lark-cli docs +fetch --doc <源文档链接> --as user --doc-format markdown > /tmp/doc.json
2. 按正文中 https://feishu.cn/file/<token> 的出现顺序，逐个 lark-cli docs +media-download --token <token> --as user --overwrite --output images/NN.png
