# chimera/ — /tools/chimera/ に置く CHIMERA

[jamesondh/chimera-vocal-synth](https://github.com/jamesondh/chimera-vocal-synth)(MIT)を、`build.sh` に書いた**固定したコミット**でビルドし、
`overlay/` の歌声レンダラー(英語の歌詞+音符 → WAV 書き出し)を足して `/tools/chimera/` に公開します。

- `/tools/chimera/` … 歌声レンダラー(`overlay/studio.html` と `overlay/src/studio/main.ts`)
- `/tools/chimera/app.html` … CHIMERA 本体のアプリ(そのまま)
- ビルドは `.github/workflows/build-site.yml` の中で動く(Rust + wasm32 と bun が必要)。失敗してもサイト全体の公開は止まらない
- CHIMERA を新しくするときは `build.sh` の `SHA` を変えて、動作を確かめる
- 上書きしているのは `index.html`(本体は `app.html` に移動)・`vite.config.ts`・`src/wasm/engine.ts` の辞書の場所(1行)だけ
