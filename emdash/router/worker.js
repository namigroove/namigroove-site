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
  /^\/\d{4}\/\d{2}\/\d{2}\/[^/]+\/?$/,
  /^\/_astro\//,
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") return fetch(request);
    if (!TO_EMDASH.some((r) => r.test(url.pathname))) return fetch(request);
    try {
      const res = await env.BLOG.fetch(request.clone());
      if (res.status < 500) return res;
    } catch (e) {}
    return fetch(request); // フォールバック: GitHub Pages
  },
};
