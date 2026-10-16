// YouTubeチャンネルの新着動画を data/works.json に追加するスクリプト
// 使い方: node scripts/sync-youtube.mjs            (YouTubeから取得)
//         node scripts/sync-youtube.mjs feed.xml   (保存済みフィードで試す)
import { readFileSync, writeFileSync } from "node:fs";

const CHANNEL_ID = "UCggV1GgBVYxT4NGpt2VYyMQ"; // @namigroove
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const WORKS_PATH = new URL("../data/works.json", import.meta.url);

// 動画タイトルにこの言葉があれば作品一覧に入れない
const SKIP_WORDS = ["#shorts", "切り抜き", "告知", "配信アーカイブ"];

const xml = process.argv[2]
  ? readFileSync(process.argv[2], "utf8")
  : await fetchFeed();

// YouTubeのフィードはまれに一時エラーを返すので、少し待って最大3回試す
async function fetchFeed() {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(FEED_URL).catch(() => null);
    if (r && r.ok) return r.text();
    console.log(`YouTubeフィードの取得に失敗 (${r ? r.status : "通信エラー"})、再試行します`);
    await new Promise((ok) => setTimeout(ok, 5000));
  }
  console.log("YouTubeフィードを取得できなかったので、今回はスキップします");
  process.exit(0);
}

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const pick = (block, re) => (block.match(re) || [])[1];

const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
  id: pick(e, /<yt:videoId>([^<]+)<\/yt:videoId>/),
  raw: decode(pick(e, /<title>([^<]*)<\/title>/) || ""),
  published: pick(e, /<published>([^<]+)<\/published>/) || "",
  link: pick(e, /<link rel="alternate" href="([^"]+)"/) || "",
})).filter((v) => v.id);

// 「【提供】曲名 / なみぐる feat.〇〇」→ 曲名・クレジット・種別に分ける
function parse(raw) {
  const lower = raw.toLowerCase();
  let type = "original";
  if (/【演奏】/.test(raw)) type = "perform";
  else if (/【(提供|編曲|作詞|客演|アニメ楽曲提供)/.test(raw)) type = "provide";
  else if (/remix|flip|リミックス/.test(lower)) type = "remix";
  else if (/【参加】/.test(raw)) type = "join";

  const noTag = raw.replace(/【[^】]*】/g, "").trim();
  const [head, ...rest] = noTag.split(/\s+\/\s+|／/);
  const by = rest.join(" / ")
    .replace(/なみぐる|namigroove/gi, "")
    .replace(/^[\s\-–&]+|[\s\-–&]+$/g, "")
    .trim();
  return { title: head.trim(), by, type };
}

const norm = (s) => s.toLowerCase().replace(/【[^】]*】/g, "")
  .replace(/[\s()（）\-–—_~〜・、。！!？?「」『』☆]/g, "");

const text = readFileSync(WORKS_PATH, "utf8");
const data = JSON.parse(text);
const works = data.works;

const added = [], linked = [], fresh = [];
for (const v of videos) {
  if (v.link.includes("/shorts/")) continue;
  if (SKIP_WORDS.some((w) => v.raw.toLowerCase().includes(w.toLowerCase()))) continue;
  if (works.some((w) => w.yt === v.id)) continue;

  const p = parse(v.raw);
  const url = `https://www.youtube.com/watch?v=${v.id}`;

  // 手で登録済みの同じ曲があれば、動画リンクだけ足す
  const same = works.find((w) => !w.yt && norm(w.title) && norm(p.title).startsWith(norm(w.title)));
  if (same) {
    Object.assign(same, { yt: v.id, url });
    linked.push(same.title);
    continue;
  }

  fresh.push({
    title: p.title,
    by: p.by,
    type: p.type,
    year: Number(v.published.slice(0, 4)) || new Date().getFullYear(),
    img: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
    url,
    yt: v.id,
    auto: true, // 自動追加の印。内容を直したら消してOK
  });
  added.push(p.title);
}

works.unshift(...fresh); // フィードは新しい順なので、その順のまま先頭へ

if (!added.length && !linked.length) {
  console.log("新しい動画はありませんでした");
  process.exit(0);
}

data.updated = new Date().toISOString().slice(0, 10);
const out = `{\n "updated": "${data.updated}",\n "works": [\n` +
  works.map((w) => "  " + JSON.stringify(w)).join(",\n") + "\n ]\n}\n";
writeFileSync(WORKS_PATH, out);

if (added.length) console.log("追加:\n- " + added.join("\n- "));
if (linked.length) console.log("動画リンクを追加:\n- " + linked.join("\n- "));
