// 作品一覧の自動更新用: 公開済みの music・movie 記事を JSON で返す(GitHub側の scripts/sync-wordpress.mjs が読む)
import { getEmDashCollection } from "emdash";
import { entryDate, entryUrl, entryThumb } from "../lib/entry.js";

export const prerender = false;

// 本文のYouTube動画ID(最初の1本)
function ytId(e) {
  let s = "";
  try { s = JSON.stringify(e.data.content ?? ""); } catch { return ""; }
  const m = s.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|"kind":"youtube","id":")([\w-]{11})/) || s.match(/"id":"([\w-]{11})","kind":"youtube"/);
  return m ? m[1] : "";
}

export async function GET() {
  const items = [];
  for (const coll of ["music", "movie"]) {
    const { entries } = await getEmDashCollection(coll);
    for (const e of entries) {
      if (!e.data.title) continue;
      items.push({
        coll,
        id: e.id,
        wp: e.data.wp_id ? Number(e.data.wp_id) : null,
        title: e.data.title,
        date: entryDate(e),
        url: entryUrl(coll, e),
        thumb: entryThumb(e) || "",
        yt: ytId(e),
      });
    }
  }
  items.sort((a, b) => b.date.localeCompare(a.date));
  return new Response(JSON.stringify({ updated: new Date().toISOString(), items }), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" },
  });
}
