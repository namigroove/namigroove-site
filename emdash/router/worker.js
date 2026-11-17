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
async function worksSync(request, env) {
  const url = new URL(request.url);
  if (!env.HOOK_KEY || url.searchParams.get("key") !== env.HOOK_KEY) return new Response("forbidden", { status: 403 });
  if (!env.GH_TOKEN) return new Response("GH_TOKEN が未設定です", { status: 500 });
  const res = await fetch("https://api.github.com/repos/namigroove/namigroove-site/dispatches", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.GH_TOKEN}`,
      accept: "application/vnd.github+json",
      "user-agent": "namigroove-router",
      "x-github-api-version": "2022-11-28",
    },
    body: JSON.stringify({ event_type: "works-sync" }),
  });
  return new Response(res.ok ? "ok" : `github ${res.status}`, { status: res.ok ? 202 : 502 });
}

export default {
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
