/* nami-i18n.js — 自前辞書による日英切り替え(Google翻訳不使用)
   使い方: <script src="nami-i18n.js"></script> を </body> 直前に。
   ページ固有の訳は NamiI18n.add({"日本語":"English"}) で追加。 */
(()=>{
const EN={
  "ツール一覧":"All tools","依頼":"Contact","リンク":"Links",
  "なみぐる！のツール":"namigroove's Tools",
  "更新履歴":"Changelog","もっと見る":"Show more",
  "#namigroovetools を作った理由":"Why I made #namigroovetools",
  "← ツール一覧へ":"← Back to tools"
};
const SKIP=/^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE|KBD|TEXTAREA|SVG|CANVAS)$/;
const ATTR=["title","placeholder","aria-label","alt"];
const q=new URLSearchParams(location.search);
let LANG=q.get("lang")||"";
if(LANG!=="en"&&LANG!=="ja"){try{LANG=localStorage.getItem("nami-lang")||"ja"}catch(e){LANG="ja"}}
if(LANG!=="en")LANG="ja";

const tr=s=>LANG==="en"&&EN[s]?EN[s]:s;

const cache=new WeakMap();           // Text/Element → 原文(日本語)
const skipped=el=>!!(el.closest&&el.closest('[translate="no"]'));

function textNodes(root){
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
    if(!n.nodeValue.trim())return NodeFilter.FILTER_REJECT;
    const p=n.parentElement; if(!p||SKIP.test(p.tagName)||skipped(p))return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT;}});
  const a=[];while(w.nextNode())a.push(w.currentNode);return a;
}
function apply(root=document.body){
  textNodes(root).forEach(n=>{
    if(!cache.has(n))cache.set(n,n.nodeValue);          // 初回に原文を保存
    const o=cache.get(n),t=o.trim();
    n.nodeValue=LANG==="en"&&EN[t]?o.replace(t,EN[t]):o; // 前後の空白は保持。ja時は復元
  });
  root.querySelectorAll("["+ATTR.join("],[")+"]").forEach(el=>{
    if(skipped(el))return;
    const m=cache.get(el)||{};cache.set(el,m);
    ATTR.forEach(k=>{if(!el.hasAttribute(k))return;
      if(!(k in m))m[k]=el.getAttribute(k);
      el.setAttribute(k,LANG==="en"&&EN[m[k]]?EN[m[k]]:m[k]);});
  });
  document.documentElement.lang=LANG;
  if(document.title){ if(!document._ot)document._ot=document.title; document.title=tr(document._ot); }
  links();
}
/* 内部リンクに ?lang=en を引き継ぐ(英語時のみ。日本語時は除去) */
function links(){
  document.querySelectorAll("a[href]").forEach(a=>{
    if(a.matches("[data-lang]"))return;
    let u;try{u=new URL(a.getAttribute("href"),location.href)}catch(e){return}
    if(!/^https?:$/.test(u.protocol)||!/(namigroove\.com|github\.io)$/.test(u.hostname))return;
    if(u.pathname===location.pathname&&u.hash&&!u.search&&u.href.split("#")[0]===location.href.split("#")[0])return;
    if(LANG==="en")u.searchParams.set("lang","en");else u.searchParams.delete("lang");
    a.setAttribute("href",u.href);
  });
}
function set(l,push){
  if(l===LANG)return;LANG=l;
  try{localStorage.setItem("nami-lang",l)}catch(e){}
  const u=new URL(location.href);l==="en"?u.searchParams.set("lang","en"):u.searchParams.delete("lang");
  history.replaceState(null,"",u);
  apply();sync();
}
/* 切替ボタン: <a data-lang href="?lang=en">EN</a> 。JS無効でもリンクとして動く */
function sync(){
  document.querySelectorAll("a[data-lang]").forEach(a=>{
    const to=LANG==="en"?"ja":"en",u=new URL(location.href);
    to==="en"?u.searchParams.set("lang","en"):u.searchParams.delete("lang");
    a.href=u.search||u.pathname;a.textContent=to==="en"?"EN":"JP";a.lang=to;
    a.title=to==="en"?"Switch to English":"日本語に切り替え";
    a.dataset.to=to;
  });
}
document.addEventListener("click",e=>{
  const a=e.target.closest&&e.target.closest("a[data-lang]");
  if(a){e.preventDefault();set(a.dataset.to||"en");}
});
window.tr=tr;
window.NamiI18n={tr,apply,add:d=>Object.assign(EN,d),get lang(){return LANG},set};
window.addEventListener("DOMContentLoaded",()=>{sync();if(LANG==="en")apply();});
})();
