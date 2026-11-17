// namigroove.com の前に置く「振り分け係」。
//  - 記事系のパスだけ EmDash(namigroove-blog) に渡す
//  - それ以外は、今まで通り GitHub Pages(オリジン)へそのまま通す
//  - EmDash が 5xx を返したら、GitHub Pages 側にある同じ記事(Hugo版)に自動で切り替える
const TO_EMDASH = [
  /^\/music\/?$/,
  /^\/music\/(?!works\/?$)[^/]+\/?$/, // /music/works/ は今のサイトのまま
  /^\/movie\/?$/,
  /^\/movie\/[^/]+\/?$/,
  /^\/posts\/?$/,
  /^\/search\/?$/,
  /^\/works-feed\.json$/, // 作品一覧の自動更新が読む記事リスト
  /^\/\d{4}\/\d{2}\/\d{2}\/[^/]+\/?$/,
  /^\/_astro\//,
];

// EmDashで記事を公開・保存したときに呼ばれる受け口。GitHubに「作品一覧を作り直して」と知らせる。
//  呼び出し: POST https://www.namigroove.com/hooks/works-sync?key=<HOOK_KEY>
//  必要な秘密の値(wrangler secret put): HOOK_KEY(受け口の合言葉)、GH_TOKEN(GitHubの細かい権限のトークン。Contents: Read and write)
async function dispatchWorksSync(env) {
  return fetch("https://api.github.com/repos/namigroove/namigroove-site/dispatches", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.GH_TOKEN}`,
      accept: "application/vnd.github+json",
      "user-agent": "namigroove-router",
      "x-github-api-version": "2022-11-28",
    },
    body: JSON.stringify({ event_type: "works-sync" }),
  });
}

async function worksSync(request, env) {
  const url = new URL(request.url);
  if (!env.HOOK_KEY || url.searchParams.get("key") !== env.HOOK_KEY) return new Response("forbidden", { status: 403 });
  if (!env.GH_TOKEN) return new Response("GH_TOKEN が未設定です", { status: 500 });
  const res = await dispatchWorksSync(env);
  return new Response(res.ok ? "ok" : `github ${res.status}`, { status: res.ok ? 202 : 502 });
}

// 5分おきに記事リストを見て、直近(7分以内)に更新された記事があれば、GitHubに作品一覧の更新を頼む。
// (EmDashに公開の通知を出す仕組みを入れなくても、公開から最大5分ほどで反映される)
const WINDOW_MS = 7 * 60 * 1000;
async function checkFeed(env) {
  try {
    if (!env.GH_TOKEN) { console.log("works-sync: GH_TOKEN が未設定"); return; }
    const res = await env.BLOG.fetch(new Request("https://www.namigroove.com/works-feed.json"));
    if (!res.ok) { console.log("works-sync: 記事リストが取れません HTTP", res.status); return; }
    const { items } = await res.json();
    const latest = Math.max(0, ...items.map((i) => (i.modified ? Date.parse(i.modified) : 0)).filter(Number.isFinite));
    const ageMin = (Date.now() - latest) / 60000;
    if (Date.now() - latest <= WINDOW_MS) {
      const g = await dispatchWorksSync(env);
      console.log(`works-sync: 更新あり(${ageMin.toFixed(1)}分前) → GitHubへ通知 HTTP ${g.status}`);
    } else {
      console.log(`works-sync: 更新なし(最新は${ageMin.toFixed(1)}分前)`);
    }
  } catch (e) {
    console.log("works-sync: エラー", String(e && e.message || e));
  }
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(checkFeed(env));
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/hooks/works-sync") return worksSync(request, env);
    if (request.method !== "GET" && request.method !== "HEAD") return fetch(request);
    if (!TO_EMDASH.some((r) => r.test(url.pathname))) return fetch(request);
    try {
      const res = await env.BLOG.fetch(request.clone());
      if (res.status < 500) return res;
    } catch (e) {}
    return fetch(request); // フォールバック: GitHub Pages
  },
};
