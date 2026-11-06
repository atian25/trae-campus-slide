#!/usr/bin/env python3
"""开发期只做「外链原图」，不压缩、不转码，图片质量 = 原始稿。

用法：
  python3 build.py              # 开发态：只提示用 server.mjs 预览，不产出文件
  python3 build.py --publish    # 发布态：把图片内嵌成单文件，输出到 ../release/AI时代的机遇和挑战-单文件.html
"""
import base64, io, os, re, shutil, sys
from PIL import Image

SRC, PUB_OUT = "deck.html", "../release/AI时代的机遇和挑战-单文件.html"

# 仅发布态使用：按显示尺寸压缩（开发态完全不碰图片）
MAXW = {
    "research-crop.png": 1600, "trae-help.png": 1600,
    "learn-1.png": 900, "learn-2.png": 900, "learn-3.png": 900, "learn-4.png": 900,
    "case-1.png": 1400, "case-2.png": 1400, "case-3.png": 1400, "case-4.png": 1400,
}

# 这些图带透明通道，发布态必须保留 alpha（jpg 会合成底色，配合 mix-blend-mode 会露框）
KEEP_ALPHA = {"trae.png", "trae-pet-2.png", "tz-dog-cut.png"}

def data_uri(path, quality=80):
    name = os.path.basename(path)
    if name in KEEP_ALPHA:
        im = Image.open(path).convert("RGBA")
        cap = MAXW.get(name, 1600)
        if im.size[0] > cap:
            im = im.resize((cap, round(im.size[1] * cap / im.size[0])), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "PNG", optimize=True)
        b = buf.getvalue()
        return "data:image/png;base64," + base64.b64encode(b).decode(), len(b)
    im = Image.open(path)
    if im.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", im.size, (247, 248, 245))
        im = im.convert("RGBA")
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    cap = MAXW.get(os.path.basename(path), 1600)
    if im.size[0] > cap:
        im = im.resize((cap, round(im.size[1] * cap / im.size[0])), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=quality, optimize=True)
    b = buf.getvalue()
    return "data:image/jpeg;base64," + base64.b64encode(b).decode(), len(b)

html = open(SRC, encoding="utf-8").read()

if "--publish" not in sys.argv:
    print("开发态直接访问 deck.html：node server.mjs 后打开 http://127.0.0.1:8765/")
    print("需要单文件版时执行：python3 build.py --publish")
    sys.exit(0)

used = {}
def repl(m):
    p = m.group(1)
    if p not in used:
        used[p] = data_uri(p)
    return 'src="%s"' % used[p][0]

out, n = re.subn(r'src="(img/[^"]+)"', repl, html)
open(PUB_OUT, "w", encoding="utf-8").write(out)
print("publish ->", PUB_OUT, round(os.path.getsize(PUB_OUT) / 1024 / 1024, 2), "MB，内嵌", n, "张")
