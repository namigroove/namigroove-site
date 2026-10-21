// WordPress(namigroove.com)の ミュージック / ムービー / 投稿 を Markdown に書き出す試作スクリプト
// WordPress には何も書き込みません(公開されている REST API を読むだけ)。
// 使い方: node scripts/wp-to-markdown.mjs --out migrate-out [--types music,movie,posts] [--no-images] [--from fixture.json]
// 出力:   <out>/content/<種類>/<slug>.md  …記事(front matter + Markdown本文)
//         <out>/static/wp-content/uploads/…  …本文とサムネイルで使われている画像(元と同じパス)
//         <out>/REPORT.md  …変換結果と、手直しが必要な箇所の一覧
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const TurndownService = require("turndown");

const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : (process.argv[i + 1]?.startsWith("--") || i + 1 >= process.argv.length ? true : process.argv[i + 1]); };
const OUT = arg("out", "migrate-out");
const TYPES = String(arg("types", "music,movie,posts")).split(",");
const NO_IMG = process.argv.includes("--no-images");
const FROM = arg("from", null);
const SITE = "https://www.namigroove.com";
const UA = { "User-Agent": "namigroove-site-migrate-preview" };

const decode = (s) => String(s ?? "").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();

async function fetchAll(type) {
  let out = [];
  for (let page = 1; page < 20; page++) {
    const url = `${SITE}/wp-json/wp/v2/${type}?per_page=100&page=${page}&_embed=wp:featuredmedia,wp:term`;
    const res = await fetch(url, { headers: UA });
    if (!res.ok) { if (page === 1) throw new Error(`${type} を取得できませんでした (${res.status})`); break; }
    const items = await res.json();
    out = out.concat(items);
    if (items.length < 100) break;
  }
  return out;
}

// ---- HTML → Markdown ----
const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-", emDelimiter: "*" });
td.keep(["iframe", "video", "audio", "table", "thead", "tbody", "tr", "th", "td"]);
td.addRule("figcaption", { filter: "figcaption", replacement: (c) => (c.trim() ? `\n\n*${c.trim()}*\n\n` : "") });
td.addRule("figure", { filter: "figure", replacement: (c) => `\n\n${c.trim()}\n\n` });
td.addRule("empty-block", { filter: (n) => ["DIV", "SPAN"].includes(n.nodeName) && !n.textContent.trim() && !n.querySelector("img,iframe,video"), replacement: () => "" });

function cleanHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<div[^>]*id="ez-toc-container"[\s\S]*?<\/nav><\/div>/gi, "")   // 目次プラグインの目次(Hugo側で作り直す)
    .replace(/<!--[\s\S]*?-->/g, "");
}

const report = { types: {}, shortcodes: [], images: { ok: 0, fail: [], bytes: 0 }, tags: {}, warnings: [] };
const imgSeen = new Map();

function imgPath(u) {
  try { const x = new URL(u, SITE); if (!/(^|\.)namigroove\.com$/.test(x.hostname) || !x.pathname.startsWith("/wp-content/uploads/")) return null; return x.pathname; } catch { return null; }
}
async function saveImage(pathname) {
  if (imgSeen.has(pathname)) return;
  imgSeen.set(pathname, true);
  if (NO_IMG || FROM) return;
  try {
    const res = await fetch(SITE + pathname, { headers: UA });
    if (!res.ok) throw new Error(res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    const f = join(OUT, "static", pathname); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, buf);
    report.images.ok++; report.images.bytes += buf.length;
  } catch (e) { report.images.fail.push(pathname + " (" + e.message + ")"); }
}

const q = (s) => JSON.stringify(String(s ?? ""));
async function convert(type, p) {
  const slug = p.slug, title = decode(p.title?.rendered);
  const url = new URL(p.link).pathname;
  const cleaned = cleanHtml(p.content?.rendered ?? "");
  // ショートコードの検出(手直し対象として記録)
  for (const m of cleaned.matchAll(/\[(\/?[a-z][\w-]*)(?:\s[^\]]*)?\]/gi)) report.shortcodes.push(`${type}/${slug}: ${m[0]}`);
  for (const m of cleaned.matchAll(/<([a-z][a-z0-9-]*)/gi)) report.tags[m[1].toLowerCase()] = (report.tags[m[1].toLowerCase()] || 0) + 1;
  // 画像: 本文内とサムネイル
  const used = new Set();
  for (const m of cleaned.matchAll(/(?:src|href|srcset)="([^"]+)"/gi)) for (const u of m[1].split(",")) { const pa = imgPath(u.trim().split(" ")[0]); if (pa && /\.(png|jpe?g|gif|webp|svg|mp4)$/i.test(pa)) used.add(pa); }
  const fm = p._embedded?.["wp:featuredmedia"]?.[0];
  const thumb = fm?.source_url ? imgPath(fm.source_url) : null;
  if (thumb) used.add(thumb);
  for (const pa of used) await saveImage(pa);
  let html = cleaned.replace(/(src|href)="(https?:\/\/(?:www\.)?namigroove\.com)(\/wp-content\/uploads\/[^"]+)"/gi, '$1="$3"');
  html = html.replace(/\ssrcset="[^"]*"/gi, "").replace(/\ssizes="[^"]*"/gi, "");
  let md = td.turndown(html).replace(/\n{3,}/g, "\n\n").trim();
  const cats = (p._embedded?.["wp:term"] ?? []).flat().filter((t) => t.taxonomy === "category").map((t) => decode(t.name));
  const front = ["---", `title: ${q(title)}`, `date: ${q(p.date)}`, `lastmod: ${q(p.modified ?? p.date)}`, `slug: ${q(slug)}`, `url: ${q(url)}`, `type: ${q(type)}`,
    `wp_id: ${p.id}`, `draft: ${p.status && p.status !== "publish" ? "true" : "false"}`];
  if (cats.length) front.push(`categories: [${cats.map(q).join(", ")}]`);
  if (thumb) front.push(`image: ${q(thumb)}`);
  front.push("---", "");
  const file = join(OUT, "content", type, `${slug}.md`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, front.join("\n") + md + "\n");
  (report.types[type] ||= []).push({ slug, title, chars: md.length, iframes: (md.match(/<iframe/g) || []).length, images: used.size });
}

mkdirSync(OUT, { recursive: true });
let data;
if (FROM) data = JSON.parse(readFileSync(FROM, "utf8"));
for (const type of TYPES) {
  const items = FROM ? (data[type] ?? []) : await fetchAll(type);
  for (const p of items) await convert(type, p);
  console.log(type, items.length);
}

// ---- レポート ----
const L = ["# 変換レポート", "", `実行: ${new Date().toISOString()}`, ""];
for (const [t, a] of Object.entries(report.types)) L.push(`- ${t}: ${a.length} 件(iframe 計 ${a.reduce((s, x) => s + x.iframes, 0)}、画像参照 計 ${a.reduce((s, x) => s + x.images, 0)})`);
L.push("", `画像: 取得 ${report.images.ok} 点(${(report.images.bytes / 1048576).toFixed(1)} MB)、失敗 ${report.images.fail.length} 点`, "");
if (report.shortcodes.length) { L.push("## ショートコード(手直しが必要)", ...report.shortcodes.map((s) => "- " + s), ""); }
if (report.images.fail.length) { L.push("## 取得できなかった画像", ...report.images.fail.map((s) => "- " + s), ""); }
L.push("## 元HTMLのタグ出現数(上位)", ...Object.entries(report.tags).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `- ${k}: ${v}`), "");
L.push("## 記事一覧", ...Object.entries(report.types).flatMap(([t, a]) => [`### ${t}`, ...a.map((x) => `- ${x.slug} | ${x.title} | ${x.chars}文字`)]));
writeFileSync(join(OUT, "REPORT.md"), L.join("\n") + "\n");
console.log("REPORT:", join(OUT, "REPORT.md"));
