// 日付と URL の決め方(取り込んだ記事と、管理画面で新しく書いた記事の両方に対応)
// 取り込んだ記事: orig_date(元の日付)と legacy_url(元のURL)を使う
// 新しい記事: 公開日時(なければ作成日時)を日本時間にして使う。URLは music/movie は /種類/スラッグ/、お知らせは /年/月/日/スラッグ/
const jst = (d) => new Date(new Date(d).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 19);
export function entryDate(e) {
  if (e.data.orig_date) return String(e.data.orig_date);
  const d = e.data.publishedAt || e.data.published_at || e.publishedAt || e.data.createdAt || e.data.created_at || e.createdAt;
  return d ? jst(d) : "";
}
export function entryUrl(coll, e) {
  if (e.data.legacy_url) return e.data.legacy_url;
  if (coll === "posts") {
    const d = entryDate(e).slice(0, 10);
    if (d) return `/${d.replaceAll("-", "/")}/${e.id}/`;
  }
  return `/${coll}/${e.id}/`;
}

// サムネ: thumb欄 → アイキャッチ → 本文の最初の画像 → 本文のYouTube動画のサムネ(管理画面で新しく書いた記事用)
export function entryThumb(e) {
  const d = e.data;
  if (d.thumb) return d.thumb;
  const f = d.featured_image;
  if (f) {
    const u = typeof f === "string" ? f : f.src || f.url || f.asset?.url;
    if (u) return u;
  }
  let s = "";
  try { s = JSON.stringify(d.content ?? ""); } catch { return ""; }
  const img = s.match(/"(?:url|src)":"(https?:[^"]+\.(?:webp|png|jpe?g|gif)(?:\?[^"]*)?|\/_emdash\/api\/media\/file\/[^"]+)"/i);
  if (img) return img[1];
  const yt = s.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|"kind":"youtube","id":")([\w-]{11})/) || s.match(/"id":"([\w-]{11})","kind":"youtube"/);
  return yt ? `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` : "";
}
