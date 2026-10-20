/* なみぐる！ WordPressページ用の小さな調整(シェアボタン)
   読み込み:子テーマ functions.php の「なみぐる新デザインJS」ブロック。消せば元に戻る */
(function () {
  var X_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
  var LINK_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg>';
  var LINK_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg>';
  var LINE_ICON = '<svg width="26" height="26" viewBox="2.2 3 19.6 19" aria-hidden="true"><path fill="#fff" d="M12 3.5c-5.2 0-9.3 3.4-9.3 7.6 0 3.8 3.3 6.9 7.7 7.5.4.1.6.3.6.6l-.1 2.1c0 .4.3.6.7.4 2.4-1.4 7.7-4.6 9.3-7.7.6-1 .9-1.9.9-2.9 0-4.2-4.2-7.6-9.8-7.6z"/><text x="12" y="13.6" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="6.2" fill="#06c755">LINE</text></svg>';
  var STORY_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12"/></svg>';

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "ng-toast"; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("show"); }, 10);
    setTimeout(function () { t.classList.remove("show"); setTimeout(function () { t.remove(); }, 300); }, 2600);
  }

  function shareStory(e) {
    e.preventDefault();
    var data = { title: document.title, url: location.href };
    if (navigator.share) {
      navigator.share(data).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href).then(function () {
        toast("リンクをコピーしました");
      });
    }
  }

  function run() {
    document.querySelectorAll("a.twitter").forEach(function (a) {
      try {
        var u = new URL(a.href);
        a.href = "https://x.com/intent/post" + u.search;
      } catch (err) {}
      a.innerHTML = X_ICON;
      a.classList.add("ng-share", "ng-x");
      a.setAttribute("aria-label", "Xでシェア");
      a.target = "_blank"; a.rel = "noopener";
    });
    document.querySelectorAll("a.facebook").forEach(function (a) {
      a.removeAttribute("href");
      a.setAttribute("role", "button");
      a.setAttribute("tabindex", "0");
      a.setAttribute("aria-label", "リンクを共有"); a.title = "リンクを共有";
      a.innerHTML = STORY_ICON;
      a.classList.add("ng-share", "ng-story");
      a.classList.remove("facebook");
      a.addEventListener("click", shareStory);
      a.addEventListener("keydown", function (e) { if (e.key === "Enter") shareStory(e); });
    });
    document.querySelectorAll("a.hatebu").forEach(function (a) {
      (a.parentElement && a.parentElement.children.length === 1 ? a.parentElement : a).remove();
    });
    document.querySelectorAll("a.line").forEach(function (a) {
      a.classList.add("ng-share", "ng-line"); a.setAttribute("aria-label", "LINEで送る"); a.innerHTML = LINE_ICON;
      // 並び順:X → LINE → リンクを共有
      var group = a.parentElement && a.parentElement.parentElement;
      var story = group && group.querySelector("a.ng-story");
      if (story && story.parentElement !== a.parentElement) a.parentElement.after(story.parentElement);
    });
    if (!document.getElementById("ng-share-style")) {
      var st = document.createElement("style"); st.id = "ng-share-style";
      st.textContent = 'a.ng-story{background:#396cdf!important}a.ng-line{display:inline-flex!important;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#06c755}a.ng-line svg{width:26px;height:26px}a.ng-copy{display:inline-flex!important;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#4a5a80;cursor:pointer}a.ng-copy svg{width:20px;height:20px}';
      document.head.appendChild(st);
    }
  }

  // ヘッダーメニューの最後に「EN」(自前辞書で英語表示。nami-i18n.js)
  function addEN() {
    var ul = document.querySelector("#header-nav ul");
    if (!ul || document.getElementById("toEN")) return;
    var li = document.createElement("li"), a = document.createElement("a");
    a.id = "toEN"; a.setAttribute("translate", "no"); a.setAttribute("data-lang", "");
    a.textContent = "EN"; a.lang = "en"; a.href = "?lang=en"; /* 方式(辞書/Google翻訳)は nami-i18n.js がページに応じて切り替える */
    a.style.cssText = "border:1px solid rgba(255,255,255,.6)!important;border-radius:999px!important;padding:0 8px!important;font-size:11px!important;line-height:1.6";
    li.appendChild(a); ul.appendChild(li);
    document.querySelectorAll("#header-nav a").forEach(function (x) { if (/^(Works|Tools|Links?)$/.test(x.textContent.trim())) x.setAttribute("translate", "no"); });
    if (!window.NamiI18n && !document.getElementById("nami-i18n-js")) {
      var s = document.createElement("script"); s.id = "nami-i18n-js";
      s.src = "https://namigroove.github.io/namigroove-site/nami-i18n.js?v=5"; document.body.appendChild(s);
    }
  }
  var _run = run; run = function () { _run(); addEN(); addTools(); };
  // ヘッダーメニューの「Works」の後ろに「Tools」を追加
  function addTools() {
    var ul = document.querySelector("#header-nav ul");
    if (!ul || document.getElementById("ngTools")) return;
    var links = ul.querySelectorAll(":scope > li > a"), after = null;
    for (var i = 0; i < links.length; i++) { if (/^\s*works\s*$/i.test(links[i].textContent)) { after = links[i].parentElement; break; } }
    var li = after ? after.cloneNode(false) : document.createElement("li"), a = document.createElement("a");
    li.removeAttribute("id"); li.classList.remove("current-menu-item", "current_page_item");
    a.id = "ngTools"; a.setAttribute("translate", "no"); a.href = "/tools/"; a.textContent = "Tools";
    li.appendChild(a);
    if (after) after.after(li); else ul.insertBefore(li, ul.firstChild);
    for (var j = 0; j < links.length; j++) { if (/^\s*リンク\s*$/.test(links[j].textContent)) links[j].parentElement.classList.add("ng-opt"); }
  }
  // ページによって要素がなくても、あとの処理(404など)が止まらないように
  var safeRun = function () { try { run(); } catch (e) {} };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", safeRun); else safeRun();

  // ページ内リンク(#faq など)の飛び先が折りたたみなら開いてから移動
  function openHash(h) {
    if (!h || h.length < 2) return;
    var el = document.getElementById(decodeURIComponent(h.slice(1)));
    if (!el) return;
    var d = el.tagName === "DETAILS" ? el : el.closest("details");
    if (d) d.open = true;
    setTimeout(function () { el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 30);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var h = a.getAttribute("href");
    var el = h.length > 1 && document.getElementById(decodeURIComponent(h.slice(1)));
    if (el && (el.tagName === "DETAILS" || el.closest("details"))) { e.preventDefault(); history.replaceState(null, "", h); openHash(h); }
  });
  window.addEventListener("load", function () { openHash(location.hash); });

  // 404ページ:なみぐるの案内と、主なページへのボタン
  function page404() {
    if (!document.body.classList.contains("error404") || document.querySelector(".ng-404")) return;
    var host = document.querySelector("#main .post") || document.querySelector("#main article, #main, main") || document.body;
    var box = document.createElement("div");
    box.className = "ng-404";
    box.innerHTML =
      '<p class="ng-404-msg">お探しのページは、波にさらわれてしまったみたいです。</p>' +
      '<p class="ng-404-sub">URLが変わったか、ページが移動した可能性があります。</p>' +
      '<p class="ng-404-btns"><a href="/">トップページへ</a><a href="/works/">Works</a><a href="/contact/">お問い合わせ</a></p>' +
      '<svg class="ng-404-wave" viewBox="0 0 1200 48" preserveAspectRatio="none" aria-hidden="true"><path class="w2" d="M0 22 Q100 8 200 22 T400 22 T600 22 T800 22 T1000 22 T1200 22 T1400 22 T1600 22 T1800 22 T2000 22 T2200 22 T2400 22 L2400 48 L0 48 Z" fill="currentColor" opacity=".45"/><path class="w1" d="M0 26 Q150 10 300 26 T600 26 T900 26 T1200 26 T1500 26 T1800 26 T2100 26 T2400 26 L2400 48 L0 48 Z" fill="currentColor"/></svg>';
    host.appendChild(box);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", page404); else page404();
  // ページ下のMusic・Movie一覧(最新12件)の下に「一覧を見る」リンク
  function mediaMore() {
    [["music", "/music/"], ["movie", "/movie/"]].forEach(function (m) {
      var sec = document.getElementById(m[0]);
      if (!sec || sec.querySelector(".ng-media-more")) return;
      var box = sec.querySelector(".scroll-container");
      if (!box) return;
      var p = document.createElement("p");
      p.className = "ng-media-more";
      p.innerHTML = '<a href="' + m[1] + '">' + (m[0] === "music" ? "Music" : "Movie") + 'の一覧を見る →</a>';
      box.parentNode.appendChild(p);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mediaMore); else mediaMore();
})();
