# EmDash 試験環境(music / movie / お知らせ)

## 構成
- `seed/seed.json` … 記事177本(Hugoの記事から `tools/build-seed.mjs` で生成)
- `src/` … 表示ページ(元のURLそのまま: `/music/slug/` `/movie/slug/` `/YYYY/MM/DD/slug/`)
- YouTube / Spotify などの埋め込みは Portable Text の `embed` ブロックとして保持
- 試験段階は noindex(`src/layouts/Site.astro`)。本番に回す時に外す

## ローカルで動かす(Node 22.23.4 以上が必要)
    pnpm install
    pnpm dev            # http://localhost:4321
    node tools/load.mjs http://localhost:4321   # 記事を投入(初回のみ)

## Cloudflare に載せる(あなたのPCで実行)
    pnpm install
    npx wrangler login
    npx wrangler d1 create namigroove-blog        # 出力された database_id を wrangler.jsonc に書く
    npx wrangler r2 bucket create my-emdash-media
    pnpm deploy                                   # https://namigroove-blog.<サブドメイン>.workers.dev
    node tools/load.mjs https://namigroove-blog.<サブドメイン>.workers.dev   # 記事投入
管理画面は `/_emdash/admin`(パスキーでログイン)。

## 画像について
試験環境では画像を `https://www.namigroove.com/wp-content/...` の絶対URLで参照しています(今のサイトから配信)。
本番(同一ドメイン)では `ASSET_BASE="" node tools/build-seed.mjs` で相対パスにできます。

## 本番のサブパス運用(後日)
`router/worker.js` の考え方で、namigroove.com をCloudflareに置き、記事系パスだけEmDashへ振り分けます。
`/music/works/` は今のサイトのままにする必要があります(ルーターで除外済み)。
