/**
 * 发布构建：把 slide/deck.html 里引用的 img/ 图片内嵌成 data URI，产出单文件站点。
 * 用法：node slide/build.ts    （等价于 npm run build）
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "slide", "deck.html");
const OUT = path.join(ROOT, "release", "trae-campus-slide-tz", "public", "index.html");
const BG = "#F7F8F5";

// 仅发布态使用：按显示尺寸压缩（开发态预览始终用原图）
const MAXW: Record<string, number> = {
  "research-crop.png": 1600,
  "learn-1.png": 900, "learn-2.png": 900, "learn-3.png": 900, "learn-4.png": 900,
  "case-1.png": 1400, "case-2.png": 1400, "case-3.png": 1400, "case-4.png": 1400,
};

// 带透明通道的图必须保留 alpha：jpg 会合成底色，配合 mix-blend-mode 会露出方框
const KEEP_ALPHA = new Set(["trae.png", "trae-pet-2.png", "tz-dog-cut.png"]);

async function dataUri(rel: string): Promise<string> {
  const file = path.join(ROOT, "slide", rel);
  const name = path.basename(file);
  const cap = MAXW[name] ?? 1600;
  const img = sharp(file).resize({ width: cap, withoutEnlargement: true });
  const buf = KEEP_ALPHA.has(name)
    ? await img.png({ compressionLevel: 9 }).toBuffer()
    : await img.flatten({ background: BG }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  const mime = KEEP_ALPHA.has(name) ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const html = await readFile(SRC, "utf8");
const refs = [...new Set([...html.matchAll(/src="(img\/[^"]+)"/g)].map((m) => m[1]))];
const uris = new Map<string, string>();
await Promise.all(refs.map(async (ref) => { uris.set(ref, await dataUri(ref)); }));

const out = html.replace(/src="(img\/[^"]+)"/g, (_m, ref: string) => `src="${uris.get(ref)}"`);

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, out, "utf8");
const mb = (Buffer.byteLength(out) / 1024 / 1024).toFixed(2);
console.log(`build -> ${path.relative(ROOT, OUT)}  ${mb} MB，内嵌 ${refs.length} 张`);
