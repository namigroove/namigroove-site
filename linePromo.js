/* なみぐる！TOOLS:ファイル処理中だけ出る、LINEスタンプの小さなお知らせ
   使い方: ngPromo.start() で処理の開始、ngPromo.stop() で終了(1.5秒以上かかったときだけ表示) */
(function(){
  var KEY="ng_promo_off",URL="https://store.line.me/stickershop/product/26675197/ja",
      IMG="https://namigroove.github.io/namigroove-site/img/line-stamp-card.webp",
      timer=null,box=null,closed=false,hover=false,pending=false;
  function off(){try{return localStorage.getItem(KEY)==="1"}catch(e){return false}}
  function css(){
    if(document.getElementById("ng-promo-css"))return;
    var s=document.createElement("style");s.id="ng-promo-css";
    s.textContent=".ng-promo{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(34px,calc(env(safe-area-inset-bottom) + 22px));z-index:60;width:min(236px,calc(100vw - 24px));display:flex;gap:10px;align-items:center;padding:10px 12px 10px 10px;background:#fff;color:#101f45;border:2px solid #396cdf;border-radius:14px;box-shadow:3px 3px 0 rgba(57,108,223,.45);font:13px/1.5 'MaruMinyaM','Hiragino Sans','Yu Gothic UI',sans-serif;opacity:0;transform:translateY(8px);transition:opacity .25s,transform .25s}"+
    ".ng-promo.on{opacity:1;transform:none}.ng-promo a.m{display:flex;gap:10px;align-items:center;color:inherit;text-decoration:none;min-width:0}"+
    ".ng-promo img{width:56px;height:56px;border-radius:10px;flex:none}.ng-promo b{display:block;font-weight:inherit;color:#2c5ccc}.ng-promo small{display:block;color:#4a5a80;font-size:12px}"+
    ".ng-promo .x{position:absolute;top:-10px;right:-10px;width:24px;height:24px;border-radius:50%;border:2px solid #396cdf;background:#fff;color:#396cdf;font:14px/1 sans-serif;cursor:pointer;padding:0}"+
    ".ng-promo .nv{position:absolute;left:12px;bottom:-22px;border:0;background:none;color:#4a5a80;font:inherit;font-size:11px;text-decoration:underline;cursor:pointer;padding:0}"+
    "@media(prefers-color-scheme:dark){.ng-promo{background:#121d40;color:#e6ecfb}.ng-promo b{color:#7fa3f5}.ng-promo small,.ng-promo .nv{color:#9fb0d6}.ng-promo .x{background:#121d40}}"+
    "@media(prefers-reduced-motion:reduce){.ng-promo{transition:none}}";
    document.head.appendChild(s);
  }
  function build(){
    css();
    var d=document.createElement("div");d.className="ng-promo";d.setAttribute("role","complementary");d.setAttribute("aria-label","なみぐるからのお知らせ");
    d.innerHTML='<a class="m" href="'+URL+'" target="_blank" rel="noopener"><img src="'+IMG+'" alt="" width="56" height="56"><span><b>LINEスタンプ発売中</b><small>なみぐるのスタンプ</small></span></a>'+
      '<button type="button" class="x" aria-label="閉じる">×</button><button type="button" class="nv">もう表示しない</button>';
    d.querySelector(".x").onclick=function(){closed=true;hide(true)};
    d.querySelector(".nv").onclick=function(){try{localStorage.setItem(KEY,"1")}catch(e){}closed=true;hide(true)};
    d.addEventListener("mouseenter",function(){hover=true});
    d.addEventListener("mouseleave",function(){hover=false;if(pending)hide()});
    document.body.appendChild(d);return d;
  }
  function show(){
    if(box||closed||off())return;
    box=build();requestAnimationFrame(function(){box&&box.classList.add("on")});
  }
  function hide(force){
    if(!box)return;
    if(hover&&!force){pending=true;return}
    var b=box;box=null;pending=false;hover=false;b.classList.remove("on");setTimeout(function(){b.remove()},300);
  }
  window.ngPromo={
    start:function(){if(off()||closed)return;clearTimeout(timer);timer=setTimeout(show,1500)},
    stop:function(){clearTimeout(timer);timer=null;setTimeout(hide,400)}
  };
})();
