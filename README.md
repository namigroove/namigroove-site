# namigroove-site

なみぐる！公式サイト(namigroove.com)の新トップまわりのファイル。

- `index.html` トップ
- `profile.html` これまでのお仕事(年表・お取引先・出演・ボカコレ)
- `contact.html` 制作依頼ページの試作(本番は WordPress の /contact/ を Contact Form 7 で運用)
- `data/works.json` 作品一覧。1作品=1行。手で足すときもこのファイルに1行追加
- `scripts/sync-youtube.mjs` YouTube の新着を works.json に追加するスクリプト
- `.github/workflows/sync-youtube.yml` 毎朝6時ごろに上のスクリプトを自動実行

フォント:マルミーニャM(x12y12pxMaruMinyaM / 作者:患者長ひっく)
