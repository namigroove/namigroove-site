/* なみぐる！ WordPressページ用の小さな調整(シェアボタン)
   読み込み:子テーマ functions.php の「なみぐる新デザインJS」ブロック。消せば元に戻る */
(function () {
  var X_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
  var LINK_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>';
  var STORY_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none"/></svg>';

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
        toast("リンクをコピーしました。インスタのストーリーにリンクスタンプで貼ってね");
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
      a.setAttribute("aria-label", "インスタのストーリーでシェア");
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
      a.classList.add("ng-share", "ng-line"); a.setAttribute("aria-label", "LINEで送る");
      // LINEの後ろに「リンクをコピー」ボタンを追加
      var wrap = a.parentElement, box = wrap.cloneNode(false);
      var b = document.createElement("a");
      b.className = "l-h-100 ng-share ng-copy"; b.setAttribute("role", "button"); b.setAttribute("tabindex", "0");
      b.setAttribute("aria-label", "リンクをコピー"); b.title = "リンクをコピー"; b.innerHTML = LINK_ICON;
      var copy = function (e) {
        e.preventDefault();
        var done = function () { toast("リンクをコピーしました"); };
        if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, function () { prompt("このURLをコピーしてね", location.href); });
        else prompt("このURLをコピーしてね", location.href);
      };
      b.addEventListener("click", copy);
      b.addEventListener("keydown", function (e) { if (e.key === "Enter") copy(e); });
      box.appendChild(b); wrap.after(box);
    });
    if (!document.getElementById("ng-share-style")) {
      var st = document.createElement("style"); st.id = "ng-share-style";
      st.textContent = 'a.ng-copy{display:inline-flex!important;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#396cdf;cursor:pointer}a.ng-copy svg{width:20px;height:20px}';
      document.head.appendChild(st);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
