// WordPress(namigroove.com)の「ミュージック」「ムービー」を data/works.json に取り込むスクリプト
// 使い方: node scripts/sync-wordpress.mjs              (WordPressから取得)
//         node scripts/sync-wordpress.mjs music.json movie.json (保存済みデータで試す)
import { readFileSync, writeFileSync } from "node:fs";

const SITE = "https://www.namigroove.com";
const WORKS_PATH = new URL("../data/works.json", import.meta.url);

// 作品一覧に入れないタイトル(まとめページなど)
const SKIP_TITLES = ["なみぐる_Works", "なみぐる – ずんだバンド2025"];

async function fetchAll(type) {
  let out = [];
  for (let page = 1; page < 10; page++) {
    const url = `${SITE}/wp-json/wp/v2/${type}?per_page=100&page=${page}&_embed=wp:featuredmedia`;
    const res = await fetch(url, { headers: { "User-Agent": "namigroove-site-sync" } });
    if (!res.ok) {
      if (page === 1) throw new Error(`${type} を取得できませんでした (${res.status})`);
      break;
    }
    const items = await res.json();
    out = out.concat(items);
    if (items.length < 100) break;
  }
  return out;
}

const posts = process.argv[2]
  ? [...JSON.parse(readFileSync(process.argv[2], "utf8")), ...JSON.parse(readFileSync(process.argv[3], "utf8"))]
  : [...(await fetchAll("music")), ...(await fetchAll("movie"))];

const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/[​⁡]/g, "").trim();

// 曲名の比較用(【】・カッコ書き・feat以降・remix表記・記号を無視して、ひらがな/カナ/漢字/英数だけ残す)
const key = (s) => decode(s).toLowerCase()
  .replace(/【[^】]*】/g, " ")
  .replace(/\((?:official|original)[^)]*\)/g, " ")
  .split(/\s+(?:\/|／)\s+|\s+feat[.\s]/)[0]
  .replace(/namigroove\s*(?:remix|flip)|electro swing remix|remix|なみぐる/g, " ")
  .replace(/[^a-z0-9ぁ-んァ-ヶー一-龠々]/g, "");
const sameSong = (a, b) => a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a));

function parse(raw) {
  const title0 = decode(raw);
  const tags = [...title0.matchAll(/【([^】]*)】/g)].map((m) => m[1]).join(" ");
  let type = "original";
  if (/提供|編曲|作詞|客演|アニメ|MV/.test(tags)) type = "provide";
  else if (/参加/.test(tags)) type = "join";
  else if (/remix|flip|リミックス/i.test(title0) && !/Remix EP/i.test(tags)) type = "remix";
  const clean = title0
    .replace(/【[^】]*】/g, " ")
    .replace(/\((?:Official|Original)[^)]*\)/gi, " ")
    .replace(/\s+/g, " ").trim();
  const [head, ...rest] = clean.split(/\s+(?:\/|／)\s+|／/);
  let by = rest.join(" / ").replace(/なみぐる|namigroove/gi, "").replace(/^[\s\-–&]+|[\s\-–&]+$/g, "").trim();
  if (!by && /EP|Album|Single/i.test(tags)) by = tags.replace(/_/g, " ");
  return { title: head.replace(/\s+なみぐる\s+feat\..*$/, "").trim(), by, type };
}

function thumb(p) {
  const fm = (((p._embedded || {})["wp:featuredmedia"]) || [])[0];
  if (fm && fm.source_url) return fm.source_url;
  const html = (p.content && p.content.rendered) || "";
  const yt = html.match(/(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([\w-]{11})/);
  return yt ? `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` : undefined;
}

const data = JSON.parse(readFileSync(WORKS_PATH, "utf8"));
const works = data.works;
const added = [], linked = [];

// 新しい投稿から順に処理(同じ曲がミュージックとムービーにある場合は先に来た方を採用)
posts.sort((a, b) => (a.date < b.date ? 1 : -1));
for (const p of posts) {
  const raw = (p.title && p.title.rendered) || "";
  if (SKIP_TITLES.some((t) => decode(raw).includes(t))) continue;
  if (works.some((w) => w.wp === p.id)) continue;
  const parsed = parse(raw);
  const k = key(raw);
  if (!k) continue;

  // すでに一覧にある曲なら、WordPressのページへのリンクと画像だけ補う
  const same = works.find((w) => sameSong(key(w.title), k));
  if (same) {
    if (!same.wp) {
      same.wp = p.id;
      if (!same.url) same.url = p.link;
      if (!same.img) { const t = thumb(p); if (t) same.img = t; }
      linked.push(same.title);
    }
    continue;
  }

  const item = {
    title: parsed.title,
    by: parsed.by,
    type: parsed.type,
    year: Number(String(p.date).slice(0, 4)),
    url: p.link,
    wp: p.id,
    auto: true,
  };
  const t = thumb(p);
  if (t) item.img = t;
  works.push(item);
  added.push(item.title);
}

// 年の新しい順に並べ直す(同じ年の中は元の順番のまま)
const order = new Map(works.map((w, i) => [w, i]));
works.sort((a, b) => (b.year - a.year) || (order.get(a) - order.get(b)));

if (!added.length && !linked.length) {
  console.log("WordPressからの新しい作品はありませんでした");
  process.exit(0);
}
data.updated = new Date().toISOString().slice(0, 10);
writeFileSync(WORKS_PATH, `{\n "updated": "${data.updated}",\n "works": [\n` +
  works.map((w) => "  " + JSON.stringify(w)).join(",\n") + "\n ]\n}\n");
console.log(`追加 ${added.length}件 / リンク付与 ${linked.length}件`);
if (added.length) console.log("追加:\n- " + added.join("\n- "));
