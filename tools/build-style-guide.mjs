#!/usr/bin/env node
/**
 * tools/build-style-guide.mjs —— 生成「卡片样式指南」
 *
 *   node tools/build-style-guide.mjs   →  docs/style-guide.html（同时被 npm run site 拷进站点）
 *
 * 目的：把 20 页里沉淀下来的卡片 / 分组元素做成一张可视化清单，
 * 每种给「规格 + 实例」，实例按 1920 画布等比缩放，和真实页面一致。
 */
import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(import.meta.dirname, "..");
const FONT = path.join(REPO, "tools/assets/anthropicons.woff2");
const MAP = path.join(REPO, "tools/assets/anthropicons.json");
const OUT_DIR = path.join(REPO, "docs");
const OUT = path.join(OUT_DIR, "style-guide.html");

const fontB64 = fs.readFileSync(FONT).toString("base64");
const iconMap = JSON.parse(fs.readFileSync(MAP, "utf8"));

/** 1920 宽的片段等比缩放到 width 盒子 */
const stage = (w, inner) => `
<div class="stage-wrap" data-w="${w}">
  <div class="stage" style="width:${w}px">${inner}</div>
</div>`;

const spec = (rows) =>
  `<div class="spec">${rows.map(([k, v]) => `<span><i>${k}</i>${v}</span>`).join("")}</div>`;

const section = (id, name, rows, example, note = "") => `
<section id="${id}">
  <h2>${name}</h2>
  ${spec(rows)}
  ${note ? `<p class="note">${note}</p>` : ""}
  ${example}
</section>`;

/* ---------- 各卡片样式的示例（数值与 slide 里一致） ---------- */

const icon = (name, size, color) => `<x-icon name="${name}" style="width:${size}px; height:${size}px; color:${color}"></x-icon>`;

const CARD_IMG = stage(1766, `
<div style="display:flex; flex-direction:row; gap:22px; width:1766px; padding:24px 0">
  ${[
    { n: "01", t: "校园活动", d: "工作坊、线下 Meetups", img: "#d6dcd8", link: true },
    { n: "02", t: "高校通识课", d: "校企合作，优化教学课件", img: "#d6dcd8", link: true },
    { n: "03", t: "线上直播课", d: "线上分享、直播答疑", img: "ph", link: false },
  ]
    .map(
      (c) => `
  <div style="display:flex; flex-direction:column; flex:1; padding:16px 16px 20px; background:#eaecea; border-radius:22px">
    ${
      c.img === "ph"
        ? `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; height:280px; background:#dee5e0; border:1px dashed #b9c4be; border-radius:14px">${icon("Play", 44, "#7fb49a")}<p style="font-size:24px;line-height:1.5;color:#63736b">照片位（虚线占位）</p></div>`
        : `<div style="height:280px; background:${c.img}; border-radius:14px; display:flex; align-items:center; justify-content:center"><p style="font-size:24px;color:#8a968f">图片 538×280 · object-fit:cover</p></div>`
    }
    <div style="display:flex; flex-direction:row; gap:16px; align-items:center; padding:16px 0 0">
      <div style="display:flex; flex-direction:column; gap:8px; flex:1">
        <div style="display:flex; flex-direction:row; gap:12px; align-items:baseline">
          <p style="font-size:24px; font-weight:800; line-height:1; letter-spacing:2.4px; color:#17754a">${c.n}</p>
          <h3 style="font-size:30px; font-weight:800; line-height:1.4; letter-spacing:-0.4px; color:#141c18">${c.t}</h3>
        </div>
        <p style="padding-left:46px; font-size:24px; line-height:1.55; color:#4a544e">${c.d}</p>
      </div>
      ${
        c.link
          ? `<div style="display:flex; flex-direction:row; gap:6px; align-items:center; padding:8px 16px; background:#bff2d2; border-radius:100px">${icon("Link", 26, "#0b4a32")}<p style="font-size:24px; font-weight:700; line-height:1; color:#0b4a32">了解详情</p></div>`
          : ""
      }
    </div>
  </div>`,
    )
    .join("")}
</div>`);

const CARD_FLOW = stage(1766, `
<div style="display:flex; flex-direction:row; gap:0; width:1766px; padding:24px 0">
  ${[
    ["Book", "输入", "Input", "接触新知识，获取信息与观点。", "#eaecea"],
    ["Lightbulb", "思考", "Process", "主动思考、分析归纳，形成自己的理解与判断。", "#dff1e6"],
    ["Play", "输出", "Output", "分享思考、撰写文章、动手实践。", "#eaecea"],
  ]
    .map(
      (c, i) => `
  ${i ? `<div style="width:84px; display:flex; align-items:center; justify-content:center"><svg aria-label="向右" viewBox="0 0 54 30" style="width:60px;height:33px"><path d="M3 15h31" stroke="#17754a" stroke-width="9" stroke-linecap="round" fill="none"></path><path d="M31 4 52 15 31 26Z" fill="#17754a"></path></svg></div>` : ""}
  <div style="display:flex; flex-direction:column; flex:1; padding:36px 26px; background:${c[4]}; border-radius:20px">
    <div style="display:flex; flex-direction:row; gap:14px; align-items:center; justify-content:center">${icon(c[0], 44, "#17754a")}<p style="font-size:41px; font-weight:800; line-height:1.2; letter-spacing:-0.6px; color:#141c18">${c[1]}</p><p style="font-size:41px; font-weight:800; line-height:1.2; letter-spacing:-0.6px; color:#17754a">${c[2]}</p></div>
    <p style="padding-top:18px; font-size:24px; line-height:1.7; color:#4a544e; text-align:center">${c[3]}</p>
  </div>`,
    )
    .join("")}
</div>`);

const CARD_NUM = stage(1766, `
<div style="display:flex; flex-direction:row; gap:29px; width:1766px; padding:24px 0">
  ${[
    ["01", "从身边的小需求开始", "先服务自己、家人，或者身边有相似需求的一小群人，解决生活中的实际问题。"],
    ["02", "边学边做，不断迭代", "遇到不懂的就借助 AI 学习，在实践中验证想法，根据反馈持续改进。"],
  ]
    .map(
      (c) => `
  <div style="display:flex; flex-direction:column; gap:12px; flex:1; padding:26px 30px; background:#eaecea; border-radius:20px">
    <div style="display:flex; flex-direction:row; gap:16px; align-items:baseline">
      <p style="font-size:24px; font-weight:700; line-height:1; letter-spacing:1.2px; color:#2fae72">${c[0]}</p>
      <p style="font-size:30px; font-weight:800; line-height:1.5; letter-spacing:-0.4px; color:#141c18">${c[1]}</p>
    </div>
    <p style="padding-left:46px; font-size:24px; line-height:1.6; color:#4a544e">${c[2]}</p>
  </div>`,
    )
    .join("")}
</div>`);

const CARD_PAIR = stage(1766, `
<div style="display:flex; flex-direction:row; gap:0; width:1766px; padding:24px 0; align-items:stretch">
  <div style="display:flex; flex-direction:column; flex:0 0 820px; padding:26px 26px; background:#eaecea; border-radius:20px">
    <div style="display:flex; flex-direction:row; gap:14px; align-items:baseline"><p style="font-size:24px;font-weight:700;line-height:1;letter-spacing:1.2px;color:#2fae72">过去</p><p style="font-size:41px;font-weight:800;line-height:1.2;letter-spacing:-0.6px;color:#141c18">工业化生产</p></div>
    <p style="padding-top:14px; padding-left:46px; font-size:24px; line-height:1.7; color:#4a544e">一个想法要变成产品，往往需要专业团队、时间和预算。</p>
  </div>
  <div style="flex:1; display:flex; align-items:center; justify-content:center"><svg aria-label="向右" viewBox="0 0 54 30" style="width:60px;height:33px"><path d="M3 15h31" stroke="#17754a" stroke-width="9" stroke-linecap="round" fill="none"></path><path d="M31 4 52 15 31 26Z" fill="#17754a"></path></svg></div>
  <div style="display:flex; flex-direction:column; flex:0 0 820px; padding:26px 26px; background:#dff1e6; border-radius:20px">
    <div style="display:flex; flex-direction:row; gap:14px; align-items:baseline"><p style="font-size:24px;font-weight:700;line-height:1;letter-spacing:1.2px;color:#17754a">现在</p><p style="font-size:41px;font-weight:800;line-height:1.2;letter-spacing:-0.6px;color:#141c18">AI Coding</p></div>
    <p style="padding-top:14px; padding-left:46px; font-size:24px; line-height:1.7; color:#4a544e">非专业开发者也能把想法做成产品。</p>
  </div>
</div>`);

const CARD_PANEL = stage(1766, `
<div style="display:flex; flex-direction:row; gap:29px; width:1766px; padding:24px 0">
  <div style="display:flex; flex-direction:column; gap:16px; flex:1; padding:34px 36px; background:#eaecea; border-radius:24px">
    <div style="display:flex; flex-direction:row; gap:12px; align-items:center"><div style="width:4px;height:30px;background:#2fae72;border-radius:2px"></div><p style="font-size:30px;font-weight:800;line-height:1.5;letter-spacing:-0.4px;color:#141c18">不变的是 · 道</p></div>
    <div style="display:flex; flex-direction:row; gap:12px; align-items:start"><span style="flex:0 0 auto;padding-top:3px">${icon("Book", 28, "#17754a")}</span><div><p style="font-size:25px;font-weight:800;line-height:1.5;color:#141c18">通用基础依然重要</p><p style="font-size:24px;line-height:1.6;color:#5a645e">数学、逻辑、阅读理解、表达能力，是驾驭 AI 的根基。</p></div></div>
  </div>
  <div style="display:flex; flex-direction:column; gap:16px; flex:1; padding:34px 36px; background:#dff1e6; border-radius:24px">
    <div style="display:flex; flex-direction:row; gap:12px; align-items:center"><div style="width:4px;height:30px;background:#2fae72;border-radius:2px"></div><p style="font-size:30px;font-weight:800;line-height:1.5;letter-spacing:-0.4px;color:#141c18">变化的是 · 术</p></div>
    <div style="display:flex; flex-direction:row; gap:12px; align-items:start"><span style="flex:0 0 auto;padding-top:3px">${icon("Lightning", 28, "#17754a")}</span><div><p style="font-size:25px;font-weight:800;line-height:1.5;color:#141c18">人机协作成为常态</p><p style="font-size:24px;line-height:1.6;color:#5a645e">AI 检索、交互问答、辅助分析与创造。</p></div></div>
  </div>
</div>`);

const CARD_WHITE = stage(1766, `
<div style="display:flex; flex-direction:row; gap:29px; width:1766px; padding:24px 0">
  ${[
    ["Search", "洞察力", "发现值得解决的问题", "理解真实需求，发现被忽略的痛点，判断什么值得做。"],
    ["PaperPlane", "执行力", "把想法真正做出来、做好", "动手验证、持续改进，解决实际使用中的问题。"],
  ]
    .map(
      (c) => `
  <div style="display:flex; flex-direction:column; gap:16px; flex:1; padding:30px 30px; background:#ffffff; border:1px solid #d9e1dc; border-radius:16px">
    <div style="display:flex; flex-direction:row; gap:16px; align-items:center">${icon(c[0], 44, "#2fae72")}<p style="font-size:41px;font-weight:800;line-height:1.2;letter-spacing:-0.6px;color:#141c18">${c[1]}</p><p style="font-size:30px;font-weight:800;line-height:1.5;letter-spacing:-0.4px;color:#17754a">${c[2]}</p></div>
    <p style="padding-left:60px; font-size:24px; line-height:1.6; color:#4a544e">${c[3]}</p>
  </div>`,
    )
    .join("")}
</div>`);

const CARD_QUOTE = stage(1400, `
<div style="display:flex; flex-direction:column; gap:14px; width:1400px; padding:34px 38px; background:#ffffff; border:1px solid #d9e1dc; border-radius:24px; border-left:4px solid #2fae72">
  <p style="font-size:24px; line-height:1.6; color:#63736b">2025 年春节，DeepSeek R1 回答它是否达到了通用人工智能（AGI）</p>
  <p style="font-size:25px; line-height:1.8; color:#3b463f">“意识不是二进制开关，而是一个连续的光谱。”</p>
</div>`);

const EL_KICKER = stage(1766, `
<div style="display:flex; flex-direction:row; gap:14px; align-items:center; width:1766px; padding:30px 0">
  ${icon("Lightbulb", 40, "#2fae72")}
  <p style="font-size:30px; font-weight:800; line-height:1.5; letter-spacing:-0.4px; color:#141c18">纸上得来终觉浅，绝知此事要躬行：</p>
</div>`);

const EL_HINT = stage(1766, `
<div style="display:flex; flex-direction:row; gap:14px; align-items:center; width:1766px; padding:30px 0">
  <p style="font-size:30px; line-height:1.4; color:#3b463f">🤷</p>
  <p style="font-size:24px; line-height:1.6; color:#63736b">人人都有一台智能手机，可以随时随地拍照，但我们还是拍不出能让女朋友满意的旅游照。</p>
</div>`);

const EL_TAG = stage(1766, `
<div style="display:flex; flex-direction:row; gap:10px; align-items:center; width:1766px; padding:30px 0">
  ${["洞察力", "执行力", "好奇心", "品味"].map((t) => `<p style="font-size:24px; line-height:1; font-weight:700; letter-spacing:1px; color:#0b4a32; background:#dff1e6; border-radius:8px; padding:6px 18px">${t}</p>`).join("")}
  <span style="width:24px"></span>
  <div style="display:flex; flex-direction:row; gap:6px; align-items:center; padding:8px 16px; background:#bff2d2; border-radius:100px">${icon("Link", 26, "#0b4a32")}<p style="font-size:24px;font-weight:700;line-height:1;color:#0b4a32">了解详情</p></div>
</div>`);

const EL_LIST = stage(1766, `
<div style="display:flex; flex-direction:column; width:1766px; padding:10px 0">
  ${[
    ["01", "学难致用", "学校虽然在积极推进课程改革，并与企业共建 AI 通识课。"],
    ["02", "实践无门", "企业更倾向用资深的人驾驭 AI，应届生直接失去了手把手实践的机会。"],
  ]
    .map(
      (c, i) => `
  <div style="display:flex; flex-direction:row; gap:31px; padding:24px 0; ${i ? "border-top:1px solid #d9e1dc;" : ""}">
    <p style="flex:0 0 auto; font-size:24px; font-weight:800; line-height:1; letter-spacing:1.2px; color:#8a968f; padding-top:6px">${c[0]}</p>
    <h3 style="flex:0 0 300px; font-size:30px; font-weight:800; line-height:1.4; letter-spacing:-0.4px; color:#141c18">${c[1]}</h3>
    <p style="font-size:24px; line-height:1.7; color:#4a554e">${c[2]}</p>
  </div>`,
    )
    .join("")}
</div>`);

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TRAE Campus 幻灯片 · 卡片样式指南</title>
<style>
@font-face{font-family:'AnthropiconsFZ';src:url(data:font/woff2;base64,${fontB64}) format('woff2');font-weight:400 700;font-display:block}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#f2f3f1;color:#141c18;font-family:'Noto Sans SC','PingFang SC','Hiragino Sans GB',system-ui,sans-serif;
  -webkit-font-smoothing:antialiased}
header{max-width:1200px;margin:0 auto;padding:56px 24px 8px}
header h1{font-size:34px;font-weight:800;letter-spacing:-0.5px}
header p{margin-top:10px;font-size:15px;line-height:1.8;color:#5a645e}
header .tips{margin-top:16px;padding:14px 18px;background:#fff;border:1px solid #d9e1dc;border-radius:12px;font-size:14px;line-height:1.8;color:#3b463f}
main{max-width:1200px;margin:0 auto;padding:8px 24px 80px}
section{margin-top:34px;background:#f7f8f5;border:1px solid #e2e6e1;border-radius:18px;padding:22px 24px 18px}
section h2{font-size:20px;font-weight:800;letter-spacing:-0.2px}
.spec{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.spec span{font-size:12px;line-height:1.9;color:#3b463f;background:#fff;border:1px solid #d9e1dc;border-radius:8px;padding:1px 10px}
.spec i{font-style:normal;color:#8a968f;margin-right:6px}
.note{margin-top:10px;font-size:13px;line-height:1.7;color:#7c8a83}
/* 1920 画布等比缩放（JS 计算 scale 与容器高度） */
.stage-wrap{position:relative;margin:16px 0 0;width:100%;overflow:hidden}
.stage{position:absolute;top:0;left:0;transform-origin:top left}
x-icon{display:inline-flex;align-items:center;justify-content:center;font-family:'AnthropiconsFZ',sans-serif;font-style:normal;font-weight:400;line-height:1;overflow:hidden}
footer{max-width:1200px;margin:0 auto;padding:0 24px 60px;font-size:13px;color:#8a968f;line-height:1.8}
</style>
</head>
<body>
<header>
  <h1>TRAE Campus 幻灯片 · 卡片样式指南</h1>
  <p>把 20 页里沉淀下来的卡片与分组元素整理成一张清单：每种给出「规格」和「等比缩放的实例」。实例的比例、圆角、字号、间距都取自真实页面。</p>
  <div class="tips">用法：改版式时先在这里认领一种样式（例如「图文卡」「分组标题」），再按规格套到页面里；新样式如果没有登记在这里，说明它还没成为规范。</div>
</header>
<main>
${section(
  "card-image",
  "① 图文卡",
  [["底色", "#EAECEA"], ["圆角", "22"], ["内距", "18 18 24"], ["图", "536×372 · r14 · object-fit:cover"], ["编号", "24 / 800 / #17754A"], ["标题", "30 / 800"], ["说明", "24 / #5A645E · 第二行缩进 46"], ["链接", "24/600 #17754A + ↗ 箭头（弱化，无底色）"]],
  CARD_IMG,
  "说明放不进标题行就落到第二行，缩进 46（编号宽 + 12）；右侧「了解详情」用文字 + ↗ 箭头，相对两行文字垂直居中。图片位可换成虚线占位（如 03）。",
)}

${section(
  "card-flow",
  "② 阶段流程卡",
  [["底色", "交替 #EAECEA / #DFF1E6"], ["圆角", "20"], ["内距", "36 26"], ["图标", "44"], ["关键词", "41 / 800（英文用绿色）"], ["说明", "24 · 居中"], ["连接", "加粗箭头 SVG 60×33"]],
  CARD_FLOW,
)}

${section(
  "card-numbered",
  "③ 编号文字卡",
  [["底色", "#EAECEA 或白底描边"], ["圆角", "20"], ["内距", "26 30"], ["编号", "24 / 700 / #2FAE72"], ["标题", "30 / 800"], ["说明", "24 · 缩进 46"]],
  CARD_NUM,
)}

${section(
  "card-pair",
  "④ 对比卡",
  [["底色", "左 #EAECEA / 右 #DFF1E6"], ["圆角", "20"], ["卡宽", "定宽 820（两卡 + 中间箭头）"], ["标题", "41 / 800"], ["说明", "24 · 缩进 46"]],
  CARD_PAIR,
  "对照关系也可以换成 VS 笔刷图（第 11 页）。",
)}

${section(
  "card-panel",
  "⑤ 面板卡",
  [["底色", "#EAECEA / #DFF1E6"], ["圆角", "24"], ["内距", "34 36"], ["面板标题", "30/800 + 左侧 4×30 绿条"], ["条目", "图标 28 + 标题 25/800 + 说明 24"]],
  CARD_PANEL,
)}

${section(
  "card-white",
  "⑥ 白描边卡",
  [["底色", "#FFFFFF"], ["描边", "1px #D9E1DC"], ["圆角", "16"], ["内距", "30 30"], ["标题", "41 / 800 + 30 绿色短句"], ["说明", "24 · 缩进 60"]],
  CARD_WHITE,
  "说明缩进 = 图标 44 + 间距 16。",
)}

${section(
  "card-quote",
  "⑦ 引用卡",
  [["底色", "#FFFFFF"], ["描边", "1px #D9E1DC"], ["圆角", "24"], ["内距", "34 38"], ["引语", "25 / #3B463F"], ["来源", "24 / #63736B"]],
  CARD_QUOTE,
)}

${section(
  "el-kicker",
  "分组标题（kicker）",
  [["图标", "40"], ["文字", "30 / 800 / #141C18"], ["位置", "卡片外，作为一组内容的分组标签"]],
  EL_KICKER,
  "用在第 12 / 15 / 16 / 17 页。",
)}

${section(
  "el-hint",
  "提示行（hint）",
  [["图标", "emoji 或 36 图标"], ["文字", "24 / #63736B"], ["位置", "页面底部，卡片外"]],
  EL_HINT,
)}

${section(
  "el-tag",
  "胶囊标签（tag）",
  [["能力标签", "#DFF1E6 · r8 · 24/700 · 6×18"], ["链接胶囊", "#BFF2D2 · r100 · 24/700 · 8×16"], ["间距", "8–10"]],
  EL_TAG,
)}

${section(
  "el-list",
  "编号列表行",
  [["无底色", "靠分隔线分组"], ["编号", "24 / 800 / #8A968F"], ["标题", "30 / 800"], ["说明", "24 / 1.7"]],
  EL_LIST,
  "用在第 4 / 5 页。",
)}
</main>
<footer>
  由 <code>tools/build-style-guide.mjs</code> 生成；规格与 <code>slide/project/slides/*.html</code> 保持一致。
  实例按 1920 画布等比缩放显示，真实页面为 1920×1080。
</footer>
<script>
function fitStages() {
  for (const wrap of document.querySelectorAll('.stage-wrap')) {
    const stage = wrap.firstElementChild;
    const base = Number(wrap.dataset.w) || 1766;
    const k = wrap.clientWidth / base;
    stage.style.transform = 'scale(' + k + ')';
    wrap.style.height = Math.ceil(stage.offsetHeight * k) + 'px';
  }
}
addEventListener('resize', fitStages);
addEventListener('load', fitStages);

const CP = ${JSON.stringify(iconMap)};
for (const el of document.querySelectorAll('x-icon')) {
  el.textContent = String.fromCodePoint(CP[el.getAttribute('name')] || 0xE000);
  const h = el.style.height || '24px';
  el.style.fontSize = h;
  if (!el.style.width) el.style.width = h;
}
fitStages();
</script>
</body>
</html>`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`style-guide -> docs/style-guide.html  ${(html.length / 1024).toFixed(0)} KB`);
