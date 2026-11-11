#!/usr/bin/env bash
# CHIMERA(jamesondh/chimera-vocal-synth, MIT)を固定したコミットでビルドし、
# 歌声レンダラー(overlay/)を足して、$1 に書き出す。
# 使い方: chimera/build.sh <出力先ディレクトリ>   (Rust + wasm32 ターゲット と bun が必要)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$(realpath -m "$1")"
SHA="6259e880f5d0108b862e98cefd930aa8c5bc0dc5"
BASE="${CHIMERA_BASE:-/tools/chimera/}"
WORK="$(mktemp -d)"
git clone --quiet https://github.com/jamesondh/chimera-vocal-synth "$WORK/src"
cd "$WORK/src"
git checkout --quiet "$SHA"
# 本体のアプリは app.html へ。index.html は歌声レンダラーにする
cp index.html app.html
cp "$HERE/overlay/studio.html" index.html
mkdir -p src/studio
cp "$HERE/overlay/src/studio/main.ts" src/studio/main.ts
cp "$HERE/overlay/vite.config.ts" vite.config.ts
# 辞書の場所をサブパスに合わせる
sed -i 's#url = "/data/cmudict.txt.gz"#url = import.meta.env.BASE_URL + "data/cmudict.txt.gz"#' src/wasm/engine.ts
grep -q 'import.meta.env.BASE_URL + "data/cmudict' src/wasm/engine.ts
bun install --frozen-lockfile
bun run wasm
bunx tsc --noEmit
CHIMERA_BASE="$BASE" bunx vite build
cp LICENSE dist/LICENSE.txt
rm -rf "$OUT"
mkdir -p "$(dirname "$OUT")"
cp -r dist "$OUT"
find "$OUT" -name '*.map' -delete
echo "chimera: built to $OUT"
