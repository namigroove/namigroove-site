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

  // ヘッダーメニューの最後に「EN」(Google翻訳で英語表示)を追加
  function addEN() {
    var ul = document.querySelector("#header-nav ul");
    if (!ul || document.getElementById("toEN") || /translate\.goog$/.test(location.hostname)) return;
    var li = document.createElement("li"), a = document.createElement("a");
    a.id = "toEN"; a.textContent = "EN"; a.lang = "en"; a.target = "_blank"; a.rel = "noopener";
    a.title = "Translate this page into English (Google Translate)";
    a.href = "https://translate.google.com/translate?sl=ja&tl=en&u=" + encodeURIComponent(location.href.split("#")[0]);
    a.style.cssText = "border:1px solid rgba(255,255,255,.6)!important;border-radius:999px!important;padding:0 8px!important;font-size:11px!important;line-height:1.6";
    li.appendChild(a); ul.appendChild(li);
  }
  var _run = run; run = function () { _run(); addEN(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
