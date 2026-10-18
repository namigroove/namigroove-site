/* なみぐる！TOOLS:お気に入り(この端末のブラウザに保存)
   - ツール一覧:各カードの☆で登録すると、いちばん上の「お気に入り」に並ぶ
   - 各ツールのページ:見出しの横の☆で登録
   - コード進行:ピアノ・コード表・ジャムモードの☆で登録(3ツール共通) */
(function(){
"use strict";
var KEY="ngTools.favs",subs=[];
function load(){try{var v=JSON.parse(localStorage.getItem(KEY));if(v&&typeof v==="object")return {tool:Array.isArray(v.tool)?v.tool:[],prog:Array.isArray(v.prog)?v.prog:[]};}catch(e){}return {tool:[],prog:[]};}
function save(d){try{localStorage.setItem(KEY,JSON.stringify(d));}catch(e){}}
function has(kind,id){return load()[kind].indexOf(id)>=0;}
function toggle(kind,id){var d=load(),a=d[kind],i=a.indexOf(id),on=i<0;if(on)a.unshift(id);else a.splice(i,1);save(d);subs.forEach(function(f){try{f(kind,id,on);}catch(e){}});if(window.ngTrack)window.ngTrack(on?"fav_add":"fav_remove",{kind:kind,id:id});return on;}
function list(kind){return load()[kind].slice();}
function onChange(f){subs.push(f);}
/* 進行の名前からID(各ツールの共有リンクと同じ作り方) */
function pid(s){var h=5381;for(var i=0;i<s.length;){var c=s.codePointAt(i);h=((h<<5)+h+c)>>>0;i+=c>0xffff?2:1;}return h.toString(36);}
/* ツールのリンク先からID:tuner.html#tuner と /tools/tuner/#tuner を同じに扱う */
function toolId(href){
  try{var u=new URL(href,location.href);if(!/namigroove\.(com|github\.io)$/.test(u.hostname.replace(/^www\./,""))&&u.protocol!=="file:")return u.href;
    var p=u.pathname.replace(/\/index\.html$/,"/").replace(/\.html$/,"").replace(/\/$/,"");var seg=p.split("/").pop()||"tools";if(seg==="namigroove-site")seg="tools";
    return seg+(u.hash||"");}catch(e){return href;}
}
var STAR_ON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="currentColor"/></svg>';
var STAR_OFF='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
function paint(btn,on,label){btn.setAttribute("aria-pressed",on?"true":"false");btn.innerHTML=on?STAR_ON:STAR_OFF;btn.title=on?"お気に入りから外す":"お気に入りに追加";btn.setAttribute("aria-label",(label?label+"を":"")+(on?"お気に入りから外す":"お気に入りに追加"));}
var CSS=".ng-fav{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;padding:0;border-radius:50%;border:1px solid var(--line);background:var(--chip,#fff);color:var(--ink-soft);cursor:pointer;flex:none;-webkit-tap-highlight-color:transparent;transition:transform .12s,color .12s}"+
".ng-fav svg{width:18px;height:18px}.ng-fav[aria-pressed=\"true\"]{color:#e0a020;border-color:#e0a020}.ng-fav:active{transform:scale(.9)}"+
".ng-fav-h1{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.ng-fav-h1 h1{margin:0}"+
".cards>li{position:relative}.cards>li>.ng-fav{position:absolute;top:10px;right:10px;width:30px;height:30px;z-index:1}.cards>li>.ng-fav svg{width:16px;height:16px}"+
".cards>li[hidden],.hub-sec[hidden],.cards[hidden]{display:none}.ng-fav-sec[hidden]{display:none}.ng-fav-empty{font-size:13px;color:var(--ink-soft);margin:0 0 12px}"+
".ng-fav-p{width:28px;height:28px;border-radius:999px}.ng-fav-p svg{width:15px;height:15px}";
function css(){if(document.getElementById("ng-fav-css"))return;var s=document.createElement("style");s.id="ng-fav-css";s.textContent=CSS;document.head.appendChild(s);}
/* 星ボタンを作る(kind・idを指定) */
function button(kind,id,label,cls){css();var b=document.createElement("button");b.type="button";b.className="ng-fav"+(cls?" "+cls:"");paint(b,has(kind,id),label);
  b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();var on=toggle(kind,id);paint(b,on,label);});
  onChange(function(k,i,on){if(k===kind&&i===id)paint(b,on,label);});return b;}
/* 文字列で星ボタンを作る(進行の一覧などを innerHTML で作るとき用) */
function html(kind,id,label,cls){var on=has(kind,id);return '<button type="button" class="ng-fav '+(cls||"")+'" data-fav-kind="'+kind+'" data-fav-id="'+id+'" aria-pressed="'+on+'" title="'+(on?"お気に入りから外す":"お気に入りに追加")+'" aria-label="'+(label?label+"を":"")+(on?"お気に入りから外す":"お気に入りに追加")+'">'+(on?STAR_ON:STAR_OFF)+'</button>';}
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("button[data-fav-id]");if(!b)return;e.preventDefault();e.stopPropagation();
  var on=toggle(b.getAttribute("data-fav-kind"),b.getAttribute("data-fav-id"));paint(b,on,"");},true);
onChange(function(kind,id,on){document.querySelectorAll('button[data-fav-id="'+id+'"][data-fav-kind="'+kind+'"]').forEach(function(b){paint(b,on,"");});});

/* ---------- ページに自動でつける ---------- */
function hub(){
  var lists=[].slice.call(document.querySelectorAll("ul.cards"));if(!lists.length)return;css();
  var cards=[];lists.forEach(function(ul){[].slice.call(ul.children).forEach(function(li){var a=li.querySelector("a.card");if(!a)return;var id=toolId(a.getAttribute("href")),h=a.querySelector("h2");li.appendChild(button("tool",id,h?h.textContent:""));cards.push({id:id,li:li});});});
  var sec=document.createElement("section");sec.className="ng-fav-sec";
  sec.innerHTML='<div class="hub-sec"><p class="eyebrow">FAVORITES</p><h2 class="hub-h">お気に入り</h2></div><p class="ng-fav-empty">ツールの☆を押すと、ここに並びます(この端末のブラウザに保存)。</p><ul class="cards ng-fav-list"></ul>';
  var firstHead=(lists[0].previousElementSibling&&lists[0].previousElementSibling.classList.contains("hub-sec"))?lists[0].previousElementSibling:null;
  lists[0].parentNode.insertBefore(sec,firstHead||lists[0]);
  /* お気に入りがあるときだけ、残りの先頭に「そのほか」の見出しを出す */
  var other=null;if(!firstHead){other=document.createElement("div");other.className="hub-sec ng-fav-other";other.innerHTML='<p class="eyebrow">TOOLS</p><h2 class="hub-h">そのほかのツール</h2>';lists[0].parentNode.insertBefore(other,lists[0]);}
  function render(){var ids=list("tool"),ul=sec.querySelector(".ng-fav-list");ul.innerHTML="";
    ids.forEach(function(id){var c=cards.filter(function(x){return x.id===id;})[0];if(!c)return;var li=c.li.cloneNode(true);li.hidden=false;var old=li.querySelector(".ng-fav");if(old)old.remove();var h=li.querySelector("h2");li.appendChild(button("tool",id,h?h.textContent:""));ul.appendChild(li);});
    var n=ul.children.length;sec.querySelector(".ng-fav-empty").hidden=n>0;ul.hidden=!n;
    /* お気に入りにしたカードは下の一覧から外す(2重に出ないように)。空になった見出しも隠す */
    cards.forEach(function(c){c.li.hidden=ids.indexOf(c.id)>=0;});
    lists.forEach(function(l){var empty=![].slice.call(l.children).some(function(li){return !li.hidden;});l.hidden=empty;var h=l.previousElementSibling;if(h&&h.classList.contains("hub-sec")&&h!==sec)h.hidden=empty;});
    if(other)other.hidden=!n||lists[0].hidden;}
  render();onChange(function(k){if(k==="tool")render();});
}
function page(){
  var h1=document.querySelector("main .intro h1");if(!h1||document.querySelector("ul.cards"))return;css();
  var id=toolId(location.href.split("#")[0]);if(id==="tuner")id="tuner#tuner";
  var wrap=document.createElement("div");wrap.className="ng-fav-h1";h1.parentNode.insertBefore(wrap,h1);wrap.appendChild(h1);wrap.appendChild(button("tool",id,h1.textContent));
}
function init(){hub();page();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.NamiFav={has:has,toggle:toggle,list:list,onChange:onChange,pid:pid,toolId:toolId,button:button,html:html};
})();
