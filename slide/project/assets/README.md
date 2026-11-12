# project/assets —— 图片资产

## 文件名为什么是 32 位十六进制

claude-slides 的 Slides 格式用 `/_blob/<id>` 引用图片，存盘路径必须是
`project/assets/<id>.<ext>`：`deck:check` 和编辑器都按 **id** 去找文件。

> 实测：把 `f09f78…53ed.png` 改名成 `cover-mascot.png` 后，`npm run deck:check`
> 立刻报 `引用的 /_blob/f09f78…53ed 不存在`。所以**真正的文件不能改成语义名**。

## 为了人看着方便，额外放了一份「语义名软链」

每个 `<id>.<ext>` 旁边都有一个同名软链：

```
cover-mascot.png  ->  f09f78094514d4b82ef6b77f2d4353ed.png
```

- 软链**只是别名**，方便在 Finder / 编辑器里认出是哪张图；
- 真身仍是 `<id>.<ext>`，删改软链不影响构建，**别把软链指向的文件挪走**；
- 新增图片时：先用 `node <claude-slides>/scripts/artifact.mjs upload slide <file>`
  得到 id，再把语义名登记进 `tools/asset-names.json`，然后建软链：

```sh
python3 - <<'PY'
import json, pathlib
A = pathlib.Path('slide/project/assets')
for bid, sem in json.load(open('tools/asset-names.json')).items():
    for ext in ('.jpg', '.png', '.webp'):
        if (A / f'{bid}{ext}').exists():
            link = A / (sem + ext)
            link.unlink(missing_ok=True)
            link.symlink_to(f'{bid}{ext}')
            break
PY
```

## 部署时的文件名

`tools/asset-names.json` 里 id → 语义名 的映射，也会被 `tools/build-site.mjs` 用来生成
线上文件名（`release/site/assets/<语义名>.<ext>`），所以**站点和 PDF 里都是语义名**。

`index.json` 是 id → mime 的索引，由上传工具维护，不要手改。
