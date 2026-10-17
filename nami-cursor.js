/* クリック・タップした場所で、ドット絵の泡がふくらんで弾ける */
(function () {
  if (window.namiBubble) return; window.namiBubble = true;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var PX = 3;                       // ドット1粒の大きさ
  var COLORS = ["#6fb7e5", "#9fd6ff", "#ffffff", "#396cdf"];
  var cv, ctx, items = [], raf = 0, dpr = 1;
  function setup() {
    cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    cv.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483646";
    document.body.appendChild(cv); ctx = cv.getContext("2d"); resize();
    window.addEventListener("resize", resize);
  }
  function resize() { dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
  function dot(x, y, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x / PX) * PX, Math.round(y / PX) * PX, PX, PX); }
  // ドットで描いた円(泡)
  function ring(cx, cy, r, alpha) {
    ctx.globalAlpha = alpha;
    var n = Math.max(8, Math.round(r * 1.6));
    for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r, "#6fb7e5"); }
    dot(cx - r * 0.45, cy - r * 0.45, "#ffffff"); dot(cx - r * 0.45 + PX, cy - r * 0.45, "#ffffff"); dot(cx - r * 0.45, cy - r * 0.45 + PX, "#ffffff");
    ctx.globalAlpha = 1;
  }
  function spawn(x, y) {
    items.push({ kind: "bubble", x: x, y: y, t: 0 });
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function pop(b) {
    var n = 10;
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2 + Math.random() * 0.4, sp = 1.6 + Math.random() * 1.8;
      items.push({ kind: "bit", x: b.x + Math.cos(a) * 12, y: b.y + Math.sin(a) * 12, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6, t: 0,
        c: COLORS[i % COLORS.length], s: Math.random() < 0.35 ? 2 : 1 });
    }
  }
  function tick() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
    var next = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i]; it.t++;
      if (it.kind === "bubble") {
        var k = it.t / 12;                       // 約0.2秒でふくらむ
        var r = 4 + 10 * (1 - Math.pow(1 - Math.min(1, k), 2));
        ring(it.x, it.y - it.t * 0.4, r, 1);
        if (it.t >= 12) { it.y -= it.t * 0.4; pop(it); } else next.push(it);
      } else {
        it.x += it.vx; it.y += it.vy; it.vy += 0.06; it.vx *= 0.96;
        var life = 1 - it.t / 32;
        if (life > 0) {
          ctx.globalAlpha = life;
          for (var dx = 0; dx < it.s; dx++) for (var dy = 0; dy < it.s; dy++) dot(it.x + dx * PX, it.y + dy * PX, it.c);
          ctx.globalAlpha = 1; next.push(it);
        }
      }
    }
    items = next;
    raf = items.length ? requestAnimationFrame(tick) : 0;
    if (!raf) ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  function onDown(e) {
    if (e.button && e.button !== 0) return;
    if (!cv) setup();
    if (items.length > 120) return;
    spawn(e.clientX, e.clientY);
  }
  function start() { document.addEventListener("pointerdown", onDown, { passive: true }); }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();

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
