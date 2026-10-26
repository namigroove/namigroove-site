// Hugo の記事(blog/content)を EmDash の seed.json に変換する
import fs from "node:fs";
import path from "node:path";
import { markdownToPortableText } from "emdash/client";

const SRC = process.argv[2] || "../namigroove-site/blog/content";
const BASE = process.env.ASSET_BASE ?? "https://www.namigroove.com"; // 本番(同一ドメイン)は ASSET_BASE="" で相対パスのまま
const seed = JSON.parse(fs.readFileSync("seed/seed.base.json", "utf8"));

function parse(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split("\n")) {
    const k = line.match(/^(\w+):\s*(.*)$/);
    if (!k) continue;
    let v = k[2].trim();
    if (v.startsWith("[")) { try { v = JSON.parse(v); } catch {} }
    else if (/^".*"$/.test(v)) { try { v = JSON.parse(v); } catch { v = v.slice(1, -1); } }
    else if (v === "true") v = true; else if (v === "false") v = false;
    fm[k[1]] = v;
  }
  return { fm, body: m[2] };
}

const SC = /{{%\s*(\w+)((?:\s+\w+="[^"]*")*)\s*%}}/g;
function attrs(s) { const o = {}; for (const m of s.matchAll(/(\w+)="([^"]*)"/g)) o[m[1]] = m[2]; return o; }
let key = 0;
function toPT(body) {
  const out = [];
  let last = 0, m;
  const push = (md) => { if (md.trim()) out.push(...markdownToPortableText(md)); };
  while ((m = SC.exec(body))) {
    push(body.slice(last, m.index));
    out.push({ _type: "embed", _key: "e" + key++, kind: m[1], ...attrs(m[2]) });
    last = m.index + m[0].length;
  }
  push(body.slice(last));
  return out;
}
const abs = (u) => (u && u.startsWith("/") ? BASE + u : u);
const fixImages = (pt) => { for (const b of pt) if (b._type === "image") { if (b.asset && typeof b.asset.url === "string") b.asset.url = abs(b.asset.url); } return pt; };

seed.content = { music: [], movie: [], posts: [] };
const cats = new Set();
for (const type of ["music", "movie", "posts"]) {
  const dir = path.join(SRC, type);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md") && !x.startsWith("_"))) {
    const p = parse(path.join(dir, f));
    if (!p || !p.fm.title) continue;
    const { fm } = p;
    const c = Array.isArray(fm.categories) ? fm.categories : [];
    c.forEach((x) => cats.add(x));
    seed.content[type].push({
      id: `${type}-${fm.slug}`,
      slug: fm.slug,
      status: fm.draft ? "draft" : "published",
      data: {
        title: fm.title,
        orig_date: fm.date,
        legacy_url: fm.url,
        thumb: abs(fm.image) || "",
        content: fixImages(toPT(p.body)),
      },
      ...(type === "posts" && c.length ? { taxonomies: { category: c.map((x) => slugify(x)) } } : {}),
    });
  }
}
function slugify(s) { return "c" + [...s].map((ch) => ch.charCodeAt(0).toString(16)).join("").slice(0, 40); }
seed.taxonomies[0].terms = [...cats].map((x) => ({ slug: slugify(x), label: x }));
fs.writeFileSync("seed/seed.json", JSON.stringify(seed, null, 1));
console.log(Object.fromEntries(Object.entries(seed.content).map(([k, v]) => [k, v.length])), [...cats]);
