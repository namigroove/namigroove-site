/* なみぐるカーソル:ページ読み込み中(Now Loading)と404ページで、マウスカーソルをなみぐるにする */
(function () {
  if (window.namiCursor) return;
  // タッチ操作だけの端末(スマホなど)にはカーソルがないので何もしない
  if (window.matchMedia && !window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var SRC = "https://namigroove.github.io/namigroove-site/img/cursor-nami.webp";
  var SIZE = 56, el = null, x = -100, y = -100, raf = 0, pinned = false;

  var css = document.createElement("style");
  css.textContent =
    "html.nami-cursor-on,html.nami-cursor-on *{cursor:none!important}" +
    ".nami-cursor{position:fixed;left:0;top:0;width:" + SIZE + "px;height:auto;pointer-events:none;z-index:2147483647;" +
    "image-rendering:pixelated;opacity:0;transition:opacity .15s;will-change:transform}" +
    ".nami-cursor.show{opacity:1}";
  (document.head || document.documentElement).appendChild(css);
  new Image().src = SRC; // 先に読み込んでおく

  function place() {
    raf = 0;
    if (el) el.style.transform = "translate(" + (x - 6) + "px," + (y - 6) + "px)";
  }
  function move(e) {
    x = e.clientX; y = e.clientY;
    if (el) { el.classList.add("show"); if (!raf) raf = requestAnimationFrame(place); }
  }
  function on() {
    if (el) return;
    el = document.createElement("img");
    el.src = SRC; el.alt = ""; el.className = "nami-cursor"; el.setAttribute("aria-hidden", "true");
    (document.body || document.documentElement).appendChild(el);
    document.documentElement.classList.add("nami-cursor-on");
    if (x >= 0) { el.classList.add("show"); place(); }
  }
  function off() {
    if (pinned || !el) return;
    el.remove(); el = null;
    document.documentElement.classList.remove("nami-cursor-on");
  }
  document.addEventListener("mousemove", move, { passive: true });
  document.addEventListener("mouseleave", function () { if (el) el.classList.remove("show"); });

  window.namiCursor = {
    on: on,
    off: off,
    // 404ページなど、ずっとなみぐるのままにする
    pin: function () { pinned = true; on(); }
  };

  // 読み込み中はなみぐる、読み込みが終わったら元のカーソルに戻す
  if (document.readyState !== "complete") {
    on();
    window.addEventListener("load", function () { setTimeout(off, 250); });
    setTimeout(off, 10000); // 万一loadが来なくても戻す
  }
  // 別のページへ移動するあいだもなみぐる(戻るボタンで戻ってきたら解除)
  window.addEventListener("beforeunload", function () { on(); setTimeout(off, 8000); });
  window.addEventListener("pageshow", function (e) { if (e.persisted) off(); });

  // WordPressの404ページ
  function check404() {
    if (document.body && document.body.classList.contains("error404")) window.namiCursor.pin();
  }
  if (document.body) check404(); else document.addEventListener("DOMContentLoaded", check404);
})();
