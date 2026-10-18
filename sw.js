/* なみぐる！TOOLS:オフライン用のサービスワーカー
   - チューナー&メトロノームとツール一覧は、最初に開いたときにまとめて保存する
   - ほかのツールも、一度開いたページは電波がなくても開ける
   - ページは「ネット優先(つながらなければ保存した版)」、画像・フォント・スクリプトは「保存した版を先に使って裏で更新」 */
const VER = "ng-tools-v1";
const ASSET_HOSTS = ["namigroove.github.io", "fonts.googleapis.com", "fonts.gstatic.com", "cdn.jsdelivr.net"];
const SKIP = /googletagmanager|google-analytics|gtag|recaptcha|doubleclick/;

const scopeUrl = new URL(self.registration.scope);
const onWP = scopeUrl.pathname.endsWith("/tools/"); /* namigroove.com の /tools/ 以下か、GitHub Pages か */
/* 先に保存しておくページ */
const PRE_PAGES = onWP ? ["", "tuner/"] : ["tools.html", "tuner.html"];

async function cacheAssetsOf(cache, html, base) {
  const urls = new Set();
  const re = /(?:src|href)\s*=\s*"([^"]+\.(?:css|js|woff2?|webp|png|jpg|svg|webmanifest)(?:\?[^"]*)?)"/g;
  let m;
  while ((m = re.exec(html))) urls.add(new URL(m[1].replace(/&amp;/g, "&"), base).href);
  /* Google Fonts のCSS */
  const gf = html.match(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]+/);
  if (gf) urls.add(gf[0].replace(/&amp;/g, "&"));
  /* CSS の中の url(...)(フォントファイル) */
  const cssUrl = /url\(["']?([^"')]+\.woff2?)["']?\)/g;
  while ((m = cssUrl.exec(html))) urls.add(new URL(m[1], base).href);
  await Promise.all([...urls].filter(u => !SKIP.test(u)).map(async u => {
    try {
      const res = await fetch(u, { mode: "cors", credentials: "omit" }).catch(() => fetch(u, { mode: "no-cors" }));
      if (!res || (!res.ok && res.type !== "opaque")) return;
      await cache.put(u, res.clone());
      if (/fonts\.googleapis\.com/.test(u)) { /* フォントCSSの中身も保存 */
        const css = await res.text();
        const fu = [...css.matchAll(/url\(([^)]+)\)/g)].map(x => x[1].replace(/["']/g, ""));
        await Promise.all(fu.map(f => fetch(f, { mode: "cors" }).then(r => r.ok && cache.put(f, r)).catch(() => {})));
      }
    } catch (e) {}
  }));
}

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VER);
    for (const p of PRE_PAGES) {
      const url = new URL(p, scopeUrl).href;
      try {
        const res = await fetch(url, { credentials: "same-origin" });
        if (!res.ok) continue;
        await cache.put(url, res.clone());
        await cacheAssetsOf(cache, await res.text(), url);
      } catch (err) {}
    }
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VER) await caches.delete(k);
    await self.clients.claim();
  })());
});

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, ng) => setTimeout(() => ng(new Error("timeout")), ms))]);

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || SKIP.test(req.url)) return;
  const url = new URL(req.url);

  /* ページ:ネット優先。3.5秒でつながらなければ保存した版 */
  if (req.mode === "navigate") {
    if (!url.href.startsWith(scopeUrl.href)) return;
    e.respondWith((async () => {
      const cache = await caches.open(VER);
      const key = url.origin + url.pathname;
      try {
        const res = await withTimeout(fetch(req), 3500);
        if (res.ok) {
          cache.put(key, res.clone());
          res.clone().text().then(h => cacheAssetsOf(cache, h, key)).catch(() => {});
        }
        return res;
      } catch (err) {
        const hit = await cache.match(key) || await cache.match(key + "/");
        if (hit) return hit;
        return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>オフライン</title><body style="font-family:sans-serif;text-align:center;padding:48px 16px;color:#101f45;background:#f5f8fe"><h1 style="font-size:20px">いまはオフラインです</h1><p>このページはまだ保存されていません。<br>電波のあるところで一度開いておくと、次からオフラインでも使えます。</p><p><a href="' + new URL(PRE_PAGES[1], scopeUrl).href + '">チューナー&amp;メトロノームを開く</a></p>', { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
    })());
    return;
  }

  /* 画像・フォント・スクリプト:保存した版を先に返して、裏で更新 */
  const isStatic = /\.(?:css|js|woff2?|webp|png|jpe?g|svg|gif|json|webmanifest|mp3|mp4|wasm)(?:$|\?)/i.test(url.pathname + url.search);
  if ((url.origin === scopeUrl.origin && isStatic) || ASSET_HOSTS.includes(url.hostname) || /wp-content\/uploads/.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(VER);
      const hit = await cache.match(req, { ignoreVary: true }) || await cache.match(url.href, { ignoreSearch: false });
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      const res = await net;
      return res || new Response("", { status: 504 });
    })());
  }
});
