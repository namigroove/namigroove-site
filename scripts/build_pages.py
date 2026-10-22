#!/usr/bin/env python3
"""静的ページを、WordPressが出していたURL(/tools/ など)と同じ場所に並べる。

  python3 scripts/build_pages.py <リポジトリのルート> <出力先>

- 各HTMLの <link rel="canonical"> のパスに index.html として置く(例: ear.html → /tools/ear/)
- 元のファイル(ear.html など)も、そのまま残す(古いリンクが切れない)
- ページ内の相対リンクを、新しいURLに直す
- namigroove.github.io の絶対URLを、サイト内の絶対パスに直す
"""
import os, re, shutil, sys
from urllib.parse import urlparse

src, out = sys.argv[1], sys.argv[2]
SKIP = {".git", ".github", "scripts", "node_modules", "__pycache__"}
GH = "https://namigroove.github.io/namigroove-site/"
HOST = "www.namigroove.com"

# 1) 全部コピー
for dp, dns, fns in os.walk(src):
    dns[:] = [d for d in dns if d not in SKIP]
    for fn in fns:
        s = os.path.join(dp, fn)
        d = os.path.join(out, os.path.relpath(s, src))
        os.makedirs(os.path.dirname(d), exist_ok=True)
        shutil.copy2(s, d)

# 2) ページ → 新しいパス
pages = {}
for fn in sorted(os.listdir(src)):
    if not fn.endswith(".html"):
        continue
    t = open(os.path.join(src, fn), encoding="utf8").read()
    m = re.search(r'<link rel="canonical" href="([^"]+)"', t)
    if not m:
        continue
    u = urlparse(m.group(1))
    if u.netloc != HOST:
        continue
    pages[fn] = u.path
# works.html と profile.html は同じ /works/ を指す。works.html を優先
if "profile.html" in pages and "works.html" in pages and pages["profile.html"] == pages["works.html"]:
    del pages["profile.html"]

ROOT_DIRS = ("img/", "data/", "fonts/", "audio/", "i18n/")

def fix(text, is_page):
    text = text.replace(GH, "/")
    if not is_page:
        return text
    # 他ページへのリンク: "tools.html#x" → "/tools/#x"
    def link(m):
        q, name, tail = m.group(1), m.group(2), m.group(3)
        if name + ".html" in pages:
            p = pages[name + ".html"]
            return f'{q}{p}{tail}'
        return m.group(0)
    text = re.sub(r'''(["'])([a-z0-9\-]+)\.html((?:[#?][^"']*)?)(?=["'])''', lambda m: link(m) if re.match(r"^[a-z0-9\-]+$", m.group(2)) else m.group(0), text)
    # index.html も "/" に
    text = re.sub(r'''(["'])index\.html((?:[#?][^"']*)?)(?=["'])''', lambda m: f'{m.group(1)}/{m.group(2)}', text)
    # 相対の資源: "img/..." → "/img/..."(href/src/fetch/url(...))
    for d in ROOT_DIRS:
        text = re.sub(r'''(["'(])''' + re.escape(d), lambda m, d=d: f'{m.group(1)}/{d}', text)
    # manifest / sw などの相対名
    text = re.sub(r'''(["'])((?:manifest[\w\-]*\.webmanifest|sw\.js|nami-[\w\-]+\.js|favs\.js))''', r'\1/\2', text)
    return text

for fn, p in pages.items():
    t = open(os.path.join(src, fn), encoding="utf8").read()
    t = fix(t, True)
    dest = os.path.join(out, p.strip("/"), "index.html") if p != "/" else os.path.join(out, "index.html")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w", encoding="utf8").write(t)

# 3) js / webmanifest / json の中の github.io も直す
for dp, _, fns in os.walk(out):
    for fn in fns:
        if fn.endswith((".js", ".webmanifest", ".json", ".css")):
            f = os.path.join(dp, fn)
            try:
                t = open(f, encoding="utf8").read()
            except Exception:
                continue
            if GH in t:
                open(f, "w", encoding="utf8").write(t.replace(GH, "/"))

print("pages:", len(pages))
for fn, p in pages.items():
    print(f"  {fn:16s} -> {p}")
