// works.html に「検索エンジン向けの作品一覧」を書き込むスクリプト
// data/works.json から、構造化データ(JSON-LD)と、JavaScriptなしでも読めるリンク一覧(noscript)を作る
// 使い方: node scripts/build-works-seo.mjs   (作品一覧を自動更新したあとにも実行される)
import { readFileSync, writeFileSync } from "node:fs";

const HTML = new URL("../works.html", import.meta.url);
const WORKS = new URL("../data/works.json", import.meta.url);
const TYPE = { original: "オリジナル", provide: "楽曲提供", remix: "リミックス", perform: "演奏・参加", join: "参加" };
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const works = JSON.parse(readFileSync(WORKS, "utf8")).works.filter((w) => !w.hidden && w.title && w.url);

const ld = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": ["Person", "MusicGroup"], "@id": "https://www.namigroove.com/#artist", name: "なみぐる", alternateName: ["namigroove", "NAMIGROOVE"], url: "https://www.namigroove.com/" },
    {
      "@type": "CollectionPage",
      "@id": "https://www.namigroove.com/works/#page",
      url: "https://www.namigroove.com/works/",
      name: "Works – なみぐる！",
      inLanguage: "ja",
      isPartOf: { "@id": "https://www.namigroove.com/#website" },
      about: { "@id": "https://www.namigroove.com/#artist" },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: works.length,
        itemListElement: works.map((w, i) => {
          const r = { "@type": "MusicRecording", name: w.title, url: w.url, byArtist: { "@id": "https://www.namigroove.com/#artist" } };
          if (w.img) r.image = w.img;
          if (w.year) r.datePublished = String(w.year);
          const d = [TYPE[w.type], w.by].filter(Boolean).join(" / ");
          if (d) r.description = d;
          return { "@type": "ListItem", position: i + 1, item: r };
        }),
      },
    },
  ],
};
const ldTag = `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
const ns = `<noscript><ul class="ns-works">${works.map((w) => `<li><a href="${esc(w.url)}">${esc(w.title)}</a>${w.by ? ` – ${esc(w.by)}` : ""}${w.year ? `(${w.year})` : ""}</li>`).join("")}</ul></noscript>`;

let html = readFileSync(HTML, "utf8");
const put = (name, body) => {
  const re = new RegExp(`<!--${name}:start-->[\\s\\S]*?<!--${name}:end-->`);
  if (!re.test(html)) throw new Error(`works.html に <!--${name}:start--> の印がありません`);
  html = html.replace(re, `<!--${name}:start-->${body}<!--${name}:end-->`);
};
put("works-ld", ldTag);
put("works-ns", ns);
writeFileSync(HTML, html);
console.log(`works.html を更新しました(${works.length}作品)`);
