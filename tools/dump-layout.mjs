#!/usr/bin/env node
/**
 * tools/dump-layout.mjs — 把每页幻灯片的排版信息导出成 JSON（供「可编辑 pptx」使用）。
 *
 * 原理：给 release/site/index.html 注入一段脚本，用 Chrome `--dump-dom` 跑一遍，
 * 把元素矩形（换算回 1920×1080 画布坐标）、文字 run、颜色、圆角、图片等信息
 * 写进 <pre id="__LAYOUT__">，再用正则取回来。不需要 CDP。
 *
 * 规则：
 *   - <img> → 图片节点；<svg>/<x-icon> → 图标节点（导出时从渲染图裁一块贴回）
 *   - 有块级子元素的容器 → 递归子元素
 *   - 只有内联子元素（span/b/i…）的容器 → **整段合成一个文本框**，文字 run 保留各自样式
 *
 * 用法：
 *   node tools/dump-layout.mjs --slides cover,eras,start --out /tmp/layout.json
 *   node tools/dump-layout.mjs --all --out /tmp/layout.json
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(REPO, "release/site");
const args = process.argv.slice(2);
const outFile = (() => {
  const i = args.indexOf("--out");
  return i >= 0 ? args[i + 1] : "/tmp/layout.json";
})();

const deck = JSON.parse(fs.readFileSync(path.join(REPO, "slide/project/deck.json"), "utf8"));
const order = deck.order;
let targets;
const si = args.indexOf("--slides");
if (si >= 0) targets = args[si + 1].split(",").map((s) => s.trim()).filter(Boolean);
else if (args.includes("--all")) targets = order;
else {
  console.error("用法：--slides a,b,c 或 --all");
  process.exit(1);
}

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (fs.existsSync(mac)) return mac;
  for (const bin of ["google-chrome", "chromium", "chromium-browser"]) {
    const r = spawnSync("which", [bin], { encoding: "utf8" });
    if (r.status === 0) return r.stdout.trim();
  }
  throw new Error("找不到 Chrome；用 CHROME_PATH=… 指定。");
}

const INJECT = `
<script>
(function () {
  var BLOCK = { div: 1, p: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1, ul: 1, ol: 1, li: 1, table: 1, section: 1, header: 1, footer: 1 };
  var SKIP = { img: 1, video: 1, svg: 1, 'x-icon': 1, br: 1, aside: 1 };
  function num(v) { return parseFloat(v) || 0; }
  function hex(c) {
    if (!c) return null;
    var m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/.exec(c);
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
    return [m[1], m[2], m[3]].map(function (n) { return ('0' + parseInt(n, 10).toString(16)).slice(-2); }).join('');
  }
  function collectRuns(root, acc) {
    for (var n = root.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) {
        var t = n.textContent.replace(/\\s+/g, ' ');
        if (t.trim()) {
          var pcs = getComputedStyle(n.parentElement || root);
          acc.push({ t: t, b: parseInt(pcs.fontWeight, 10) >= 600, c: hex(pcs.color) || '141c18', s: num(pcs.fontSize) });
        }
      } else if (n.nodeType === 1) {
        var tag = n.tagName.toLowerCase();
        if (SKIP[tag]) continue;
        if (getComputedStyle(n).display === 'none') continue;
        collectRuns(n, acc);
      }
    }
    return acc;
  }
  function dump() {
    var pre = document.getElementById('__LAYOUT__');
    try {
      var sec = document.querySelector('.slide.on .fit > section') || document.querySelector('.slide.on section');
      if (!sec) throw new Error('no-section');
      var host = sec.closest('.fit') || sec;
      var hr = host.getBoundingClientRect();
      var scale = hr.width / 1920;
      var nodes = [];
      var out = { id: sec.id, bg: hex(getComputedStyle(sec).backgroundColor) || 'f7f8f5', nodes: nodes };

      function box(el) {
        var r = el.getBoundingClientRect();
        return { x: +((r.left - hr.left) / scale).toFixed(1), y: +((r.top - hr.top) / scale).toFixed(1),
                 w: +(r.width / scale).toFixed(1), h: +(r.height / scale).toFixed(1) };
      }
      function style(el) {
        var cs = getComputedStyle(el);
        var bw = num(cs.borderTopWidth);
        return {
          fill: hex(cs.backgroundColor),
          grad: !!(cs.backgroundImage && cs.backgroundImage.indexOf('gradient') >= 0),
          bw: bw,
          border: bw > 0 ? (hex(cs.borderTopColor) || 'd9e1dc') : null,
          radius: num(cs.borderTopLeftRadius),
          align: cs.textAlign,
          lh: num(cs.lineHeight),
          size: num(cs.fontSize),
          pl: num(cs.paddingLeft),
          pr: num(cs.paddingRight),
          pt: num(cs.paddingTop),
          pb: num(cs.paddingBottom),
          display: cs.display
        };
      }
      function walk(el) {
        var tag0 = el.tagName.toLowerCase();
        var next0 = el.nextElementSibling;
        // 媒体节点优先处理（被播放器隐藏的 img 也要能取到框）
        if (tag0 === 'img') {
          var vattr = el.getAttribute('data-video') || null;
          var host0 = el;
          if (vattr && next0 && next0.tagName.toLowerCase() === 'video') host0 = next0;
          nodes.push(Object.assign({ kind: 'img', src: el.getAttribute('src'), fit: getComputedStyle(host0).objectFit || 'contain', video: vattr }, box(host0)));
          return;
        }
        if (tag0 === 'video') {
          nodes.push(Object.assign({ kind: 'img', src: el.getAttribute('poster'), fit: getComputedStyle(el).objectFit || 'contain', video: el.getAttribute('src') }, box(el)));
          return;
        }
        var st = style(el);
        if (st.display === 'none' || getComputedStyle(el).visibility === 'hidden') return;
        var r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        if (tag0 === 'svg' || tag0 === 'x-icon') {
          nodes.push(Object.assign({ kind: 'icon' }, box(el)));
          return;
        }
        if (st.fill || st.grad || st.bw || st.radius) {
          nodes.push(Object.assign({ kind: 'rect', fill: st.fill, grad: st.grad, border: st.border, bw: st.bw, radius: st.radius }, box(el)));
        }

        var kids = [];
        for (var i = 0; i < el.children.length; i++) {
          var k = el.children[i];
          var kt = k.tagName.toLowerCase();
          if (kt === 'aside' || kt === 'br') continue;
          if (getComputedStyle(k).display === 'none') continue;
          kids.push(k);
        }
        var hasLeaf = kids.some(function (k) { var t2 = k.tagName.toLowerCase(); return t2 === 'img' || t2 === 'video' || t2 === 'svg' || t2 === 'x-icon'; });
        var hasBlockKid = hasLeaf || kids.some(function (k) { return BLOCK[k.tagName.toLowerCase()]; });

        if (!hasBlockKid) {
          var runs = collectRuns(el, []);
          if (runs.length) {
            nodes.push(Object.assign({ kind: 'text', runs: runs, align: st.align, lh: st.lh, s: st.size, grad: st.grad, pl: st.pl, pr: st.pr, pt: st.pt, pb: st.pb }, box(el)));
          }
          return;
        }
        for (var j = 0; j < kids.length; j++) walk(kids[j]);
      }
      walk(sec);
      pre.textContent = JSON.stringify(out);
    } catch (e) {
      pre.textContent = JSON.stringify({ error: String((e && e.message) || e) });
    }
  }
  window.addEventListener('load', function () { setTimeout(dump, 500); });
})();
</script>
`;

const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
const tmpHtml = path.join(SITE, "__dump.html");
fs.writeFileSync(tmpHtml, html.replace("</body>", `${INJECT}<pre id="__LAYOUT__" style="display:none"></pre></body>`));

const chrome = findChrome();
const profile = path.join(REPO, ".tmp-test/chrome-profile-dump");
fs.mkdirSync(profile, { recursive: true });

const result = {};
for (const id of targets) {
  const idx = order.indexOf(id);
  if (idx < 0) { console.error(`跳过未知页 ${id}`); continue; }
  const r = spawnSync(chrome, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
    "--window-size=1920,1080", `--user-data-dir=${profile}`,
    "--virtual-time-budget=6000", "--dump-dom",
    `file://${tmpHtml}#${idx + 1}`,
  ], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const dom = r.stdout || "";
  const m = /<pre id="__LAYOUT__"[^>]*>([\s\S]*?)<\/pre>/.exec(dom);
  if (!m) { console.error(`${id}: 没拿到布局`); continue; }
  const raw = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'");
  try {
    const lay = JSON.parse(raw);
    if (lay.error) { console.error(`${id}: ${lay.error}`); continue; }
    result[id] = lay;
    const counts = lay.nodes.reduce((a, n) => ((a[n.kind] = (a[n.kind] || 0) + 1), a), {});
    console.log(`${id}: ${lay.nodes.length} 个节点 ${JSON.stringify(counts)}`);
  } catch (e) {
    console.error(`${id}: JSON 解析失败 ${e.message}`);
  }
}
fs.rmSync(tmpHtml, { force: true });
fs.writeFileSync(outFile, JSON.stringify(result, null, 1));
console.log(`→ ${outFile}`);
