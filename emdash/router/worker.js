// 将来のサブパス運用用ルーター(試験段階では使わない)
// namigroove.com を Cloudflare に置き、記事系パスだけ EmDash、それ以外は今の GitHub Pages に流す。
const EMDASH = "https://namigroove-blog.<あなたのサブドメイン>.workers.dev"; // EmDash の Worker
const PAGES = "https://namigroove.github.io/namigroove-site";           // 今のサイト

// EmDash 側に回すパス。/music/works/ などの固定ページは今のサイトのまま。
const KEEP_ON_PAGES = [/^\/music\/works\//];
const TO_EMDASH = [/^\/music\/[^/]+\/?$/, /^\/movie\/[^/]+\/?$/, /^\/posts\/?$/, /^\/\d{4}\/\d{2}\/\d{2}\/[^/]+\/?$/, /^\/_emdash\//];

export default {
  async fetch(req) {
    const u = new URL(req.url);
    const toEm = !KEEP_ON_PAGES.some((r) => r.test(u.pathname)) && TO_EMDASH.some((r) => r.test(u.pathname));
    const origin = toEm ? EMDASH : PAGES;
    return fetch(new Request(origin + u.pathname + u.search, req));
  },
};
