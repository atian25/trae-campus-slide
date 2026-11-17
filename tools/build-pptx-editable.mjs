#!/usr/bin/env node
/**
 * tools/build-pptx-editable.mjs — 导出「可编辑文字」的 PowerPoint。
 *
 * 流程：
 *   1. tools/dump-layout.mjs 用 Chrome 把每页的排版信息（矩形/文字 run/颜色/圆角/图片）导成 JSON
 *   2. python-pptx 按 JSON 重建：圆角矩形、文本框、图片、图标（图标从渲染图裁一块贴回去）
 *
 * 用法：
 *   npm run pptx:editable -- --slides cover,eras,start   # 先做样张
 *   npm run pptx:editable -- --all                       # 全量 22 页
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const deck = JSON.parse(fs.readFileSync(path.join(REPO, "slide/project/deck.json"), "utf8"));
const order = deck.order;
const title = deck.title || "deck";

let targetIds;
const si = args.indexOf("--slides");
if (si >= 0) targetIds = args[si + 1].split(",").map((s) => s.trim()).filter(Boolean);
else targetIds = order;

const sample = si >= 0;
const layoutFile = path.join(REPO, ".tmp-test/layout.json");
fs.mkdirSync(path.dirname(layoutFile), { recursive: true });

// 1) dump layout
const dumpArgs = [path.join(REPO, "tools/dump-layout.mjs"), "--out", layoutFile, sample ? "--slides" : "--all"];
if (sample) dumpArgs.push(targetIds.join(","));
const d = spawnSync("node", dumpArgs, { cwd: REPO, stdio: "inherit" });
if (d.status !== 0) process.exit(1);

// 2) build pptx
fs.mkdirSync(path.join(REPO, "release"), { recursive: true });
const outFile = sample
  ? path.join(REPO, "release", `样张-可编辑-${targetIds.length}页.pptx`)
  : path.join(REPO, "release", `${title}-可编辑.pptx`);

const py = String.raw`
import json, os, sys
from pptx import Presentation
from pptx.util import Emu, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image

layout_file, render_dir, site_dir, out_file, ids_json = sys.argv[1:6]
ids = json.loads(ids_json)
lay = json.load(open(layout_file))

EMU_PER_PX = 12192000 // 1920          # 6350
def E(px): return Emu(int(round(px * EMU_PER_PX)))
PT = 0.5                                # 1920px 画布映射到 13.333in → 1px = 0.5pt

def rgb(hexs, default="141c18"):
    h = (hexs or default).lstrip("#")
    if len(h) != 6: h = default
    return RGBColor(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))

prs = Presentation()
prs.slide_width = Emu(12192000)
prs.slide_height = Emu(6858000)
blank = prs.slide_layouts[6]

def set_font(run, size_px, bold, color):
    f = run.font
    f.size = Pt(size_px * PT)
    f.bold = bool(bold)
    f.color.rgb = rgb(color)
    f.name = "PingFang SC"
    # 东亚字体
    rPr = run._r.get_or_add_rPr()
    from pptx.oxml.ns import qn
    ea = rPr.find(qn('a:ea'))
    if ea is None:
        ea = rPr.makeelement(qn('a:ea'), {})
        rPr.append(ea)
    ea.set('typeface', 'PingFang SC')

def add_rect(slide, n):
    if n.get('grad') or not n.get('fill'):
        return
    # 整页底色矩形：幻灯片背景已设，跳过（否则会盖住高亮条）
    if n['x'] <= 1 and n['y'] <= 1 and n['w'] >= 1918 and n['h'] >= 1078:
        return
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, E(n['x']), E(n['y']), E(n['w']), E(n['h']))
    shp.fill.solid(); shp.fill.fore_color.rgb = rgb(n['fill'], 'ffffff')
    if n.get('border'):
        shp.line.color.rgb = rgb(n['border'])
        shp.line.width = Pt(max(0.5, (n.get('bw') or 1) * PT))
    else:
        shp.line.fill.background()
    r = min(0.5, (n.get('radius') or 0) / max(1, min(n['w'], n['h'])))
    try: shp.adjustments[0] = r
    except Exception: pass
    shp.text_frame.text = ""

def rr_pr(run):
    return run._r.get_or_add_rPr()

def set_highlight(run, hexs='bff2d2'):
    """给文字加 PowerPoint 原生高亮（<a:highlight>），跟着文字走、可编辑"""
    from pptx.oxml.ns import qn
    rPr = rr_pr(run)
    hl = rPr.find(qn('a:highlight'))
    if hl is None:
        hl = rPr.makeelement(qn('a:highlight'), {})
        rPr.insert(0, hl)
    for child in list(hl):
        hl.remove(child)
    clr = hl.makeelement(qn('a:srgbClr'), {'val': hexs})
    hl.append(clr)

def add_text(slide, n):
    pl, pr, pt, pb = n.get('pl') or 0, n.get('pr') or 0, n.get('pt') or 0, n.get('pb') or 0
    lh = n.get('lh') or (n.get('s') or 24) * 1.5
    # 单行判定放宽到 1.55 倍行高，避免 tag/胶囊这类矮框被误判成多行而换行
    single = (n['h'] - pt - pb) <= lh * 1.55
    tb = slide.shapes.add_textbox(E(n['x'] + pl), E(n['y'] + pt), E(max(10, n['w'] - pl - pr)), E(max(10, n['h'] - pt - pb) + 6))
    tf = tb.text_frame
    tf.word_wrap = not single
    tf.margin_left = 0; tf.margin_right = 0; tf.margin_top = 0; tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE if single else MSO_ANCHOR.TOP
    p = tf.paragraphs[0]
    p.alignment = {'center': PP_ALIGN.CENTER, 'right': PP_ALIGN.RIGHT, 'justify': PP_ALIGN.JUSTIFY}.get(n.get('align') or 'left', PP_ALIGN.LEFT)
    if n.get('lh') and n.get('s'):
        p.line_spacing = n['lh'] / n['s']
    for r in n['runs']:
        run = p.add_run(); run.text = r['t']
        set_font(run, r.get('s') or n.get('s') or 24, r.get('b'), r.get('c'))
        if n.get('grad'):
            set_highlight(run)

def add_pic(slide, rect_box, img_path, fit='cover', radius=0):
    iw, ih = Image.open(img_path).size
    bw, bh = rect_box['w'], rect_box['h']
    if fit == 'cover':
        # 以较短边铺满，按比例裁掉另一边
        if iw / bh > bw / ih:
            pic = slide.shapes.add_picture(img_path, E(rect_box['x']), E(rect_box['y']), height=E(bh))
        else:
            pic = slide.shapes.add_picture(img_path, E(rect_box['x']), E(rect_box['y']), width=E(bw))
    else:
        ratio = min(bw / iw, bh / ih)
        w, h = iw * ratio, ih * ratio
        pic = slide.shapes.add_picture(img_path, E(rect_box['x'] + (bw - w) / 2), E(rect_box['y'] + (bh - h) / 2), width=E(w), height=E(h))
    return pic

for sid in ids:
    page = lay.get(sid)
    if not page:
        continue
    s = prs.slides.add_slide(blank)
    bg = s.background.fill; bg.solid(); bg.fore_color.rgb = rgb(page.get('bg'), 'f7f8f5')

    # 1) 先铺所有图形底（卡片、分割线、胶囊底）
    for n in page['nodes']:
        if n['kind'] == 'rect':
            add_rect(s, n)
    # 3) 最后文字/图片/图标
    for n in page['nodes']:
        if n['kind'] == 'text':
            add_text(s, n)
        elif n['kind'] == 'img':
            src = (n.get('src') or '').split('?')[0]
            poster = src if os.path.isabs(src) else os.path.join(site_dir, src)
            vid = n.get('video')
            if vid:
                vpath = vid.split('?')[0]
                if not os.path.isabs(vpath):
                    vpath = os.path.join(site_dir, vpath)
                if os.path.exists(vpath) and os.path.exists(poster):
                    mv = s.shapes.add_movie(vpath, E(n['x']), E(n['y']), E(n['w']), E(n['h']),
                                            poster_frame_image=poster, mime_type='video/mp4')
                    mv.name = 'Video ' + os.path.basename(vpath)
                    continue
            if os.path.exists(poster):
                add_pic(s, n, poster, 'cover' if n.get('fit') == 'cover' else 'contain')
        elif n['kind'] == 'icon':
            shot = os.path.join(render_dir, sid + '.png')
            if os.path.exists(shot):
                im = Image.open(shot)
                pad = 2
                box = (int(n['x']) - pad, int(n['y']) - pad, int(n['x'] + n['w']) + pad, int(n['y'] + n['h']) + pad)
                box = (max(0, box[0]), max(0, box[1]), min(im.width, box[2]), min(im.height, box[3]))
                crop = im.crop(box)
                tmp = os.path.join('/tmp', 'icon_' + sid + '_' + str(len(s.shapes)) + '.png')
                crop.save(tmp)
                s.shapes.add_picture(tmp, E(n['x'] - 2), E(n['y'] - 2), width=E(n['w'] + 4), height=E(n['h'] + 4))

prs.save(out_file)
print(len(ids), '页 →', out_file)
`;

const r = spawnSync("python3", ["-c", py, layoutFile, path.join(REPO, ".tmp-test/render"), path.join(REPO, "release/site"), outFile, JSON.stringify(targetIds)], { encoding: "utf8" });
process.stdout.write(r.stdout || "");
if (r.status !== 0) { process.stderr.write(r.stderr || "生成失败"); process.exit(1); }
console.log(`pptx -> release/${path.basename(outFile)}  ${(fs.statSync(outFile).size / 1048576).toFixed(1)} MB`);
