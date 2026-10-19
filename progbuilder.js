/* なみぐる！TOOLS:自分でコード進行を作るエディタ(ジャムモード・ピアノ・コード表で共通)
   進行は [ルートの度数(キーからの半音), コードの種類, ベースの度数(分数コードのときだけ。なければnull), 長さ(1以外のときだけ。0.5=半分)] の配列。
   作った進行は端末に保存して、どのツールでも同じものが使える */
(function(){
"use strict";
var TYPES=["","m","7","M7","m7","6","m6","9","M9","m9","add9","madd9","6/9","sus4","sus2","7sus4","9sus4","13","m11","dim","dim7","m7(♭5)","aug","7(♯5)","mM7","7(♭9)","7(♯9)","7(♯11)","M7(♯11)"];
var KEYN=["C","D♭","D","E♭","E","F","F♯","G","A♭","A","B♭","B"],SHP=["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
var LNS=[0.25,0.5,1,2],LNN={"0.25":"1/4","0.5":"1/2","1":"1","2":"2"};
var MAX=16,DEF=[[5,"M7"],[4,"m7"],[2,"m7"],[7,"7sus4"]],SKEY="ngTools.myProg";
function pc(m){return ((m%12)+12)%12;}
function ok(a){return Array.isArray(a)&&a.length>0&&a.length<=MAX&&a.every(function(c){return Array.isArray(c)&&c[0]>=0&&c[0]<12&&TYPES.indexOf(c[1])>=0&&(c[2]==null||(c[2]>=0&&c[2]<12))&&(c[3]==null||LNS.indexOf(c[3])>=0);});}
/* 後ろの使っていない値(ベースなし・長さ1)を取りのぞく */
function norm(c){if(c[3]===1)c.length=3;if(c.length===3&&c[2]==null)c.length=2;return c;}
function clone(a){return a.map(function(c){return c.slice();});}
function enc(a){return a.map(function(c){return c[0].toString(16)+(c[2]!=null?c[2].toString(16):"-")+c[1]+(c[3]!=null&&c[3]!==1?"@"+c[3]:"");}).join(",");}
function dec(t){try{var a=String(t).split(",").map(function(x){var at=x.indexOf("@"),ln=at>=0?parseFloat(x.slice(at+1)):1;if(at>=0)x=x.slice(0,at);var c=[parseInt(x[0],16),x.slice(2)];if(x[1]!=="-")c.push(parseInt(x[1],16));if(ln!==1){if(c.length<3)c.push(null);c.push(ln);}return c;});return ok(a)?a:null;}catch(e){return null;}}
function load(){var a=null;try{a=JSON.parse(localStorage.getItem(SKEY));if(!ok(a))a=JSON.parse(localStorage.getItem("ngTools.jamMy"));}catch(e){}return ok(a)?a:clone(DEF);}
function save(a){try{localStorage.setItem(SKEY,JSON.stringify(a));}catch(e){}}
function name(c,key){var r=pc(c[0]+key);return (c[1]==="dim7"&&[1,3,8].indexOf(r)>=0?SHP:KEYN)[r]+c[1]+(c[2]!=null?"/"+KEYN[pc(c[2]+key)]:"");}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");}
var CSS=".nb-hint{font-size:12px;color:var(--ink-soft);margin:0 0 8px}"+
".nb-seq{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 6px}"+
".nb-seq button{font:500 15px var(--f-body,inherit);padding:8px 14px;border-radius:12px;border:2px solid var(--line);background:var(--chip,#fff);color:var(--ink);cursor:pointer;min-width:3em;-webkit-tap-highlight-color:transparent}"+
".nb-seq button[aria-pressed=\"true\"]{border-color:var(--coral);background:var(--wash)}"+
".nb-seq button.add{border-style:dashed;color:var(--sea)}"+
".nb-ed{border-top:1px dashed var(--line);margin-top:10px;padding-top:4px}"+
".nb-lbl{font-size:12px;color:var(--ink-soft);margin:12px 0 6px}"+
".nb .seg{display:flex;flex-wrap:wrap;gap:4px}"+
".nb .seg button{min-width:2.8em}"+
".nb-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;align-items:center}"+
".nb-row select{max-width:100%}"+
".nb-seq button small{font-size:10px;margin-left:3px;color:var(--sea)}";
function css(){if(document.getElementById("nb-css"))return;var s=document.createElement("style");s.id="nb-css";s.textContent=CSS;document.head.appendChild(s);}
/* el に編集画面を作る。opt.key():今のキー、opt.onChange(進行):変わったとき、opt.types:使える種類(省略で全部) */
function mount(el,opt){
  css();opt=opt||{};var types=opt.types?TYPES.filter(function(t){return opt.types.indexOf(t)>=0;}):TYPES;
  var my=opt.initial&&ok(opt.initial)?clone(opt.initial):load(),i=0;
  my=my.filter(function(c){return types.indexOf(c[1])>=0;});if(!my.length)my=clone(DEF);
  var key=function(){return opt.key?opt.key():0;};
  var presets=(window.NamiProg&&window.NamiProg.LIST)||[];
  el.classList.add("nb");
  el.innerHTML='<p class="nb-hint">コードをタップして、ルート・種類・ベースを選んでね。「＋」で追加(最大'+MAX+'コード)。作った進行はこの端末に保存されて、ジャムモード・ピアノ・コード表で共通です。</p>'+
    '<div class="nb-seq" data-r="seq"></div><div class="nb-ed">'+
    '<p class="nb-lbl">ルート</p><div class="seg" data-r="root"></div>'+
    '<p class="nb-lbl">種類</p><div class="seg" data-r="type"></div>'+
    '<p class="nb-lbl">ベース(分数コード)</p><div class="seg" data-r="bass"></div>'+
    '<p class="nb-lbl">長さ(1=ふつう。1/2で半分、2で2倍)</p><div class="seg" data-r="len"></div>'+
    '<div class="nb-row"><button class="btn" type="button" data-a="left">← 左へ</button><button class="btn" type="button" data-a="right">右へ →</button><button class="btn" type="button" data-a="del">このコードを消す</button></div></div>'+
    '<div class="nb-row">'+(presets.length?'<select class="sel" data-r="pre" aria-label="プリセットの進行をコピー"><option value="">プリセットからコピー…</option>'+presets.map(function(p,k){return '<option value="'+k+'">'+esc(p.n)+'</option>';}).join("")+'</select>':'')+
    '<button class="btn" type="button" data-a="reset">はじめから作る</button></div>';
  var q=function(r){return el.querySelector('[data-r="'+r+'"]');};
  function render(){
    var k=key(),c=my[i];
    q("seq").innerHTML=my.map(function(x,j){return '<button type="button" data-i="'+j+'" aria-pressed="'+(j===i)+'">'+esc(name(x,k))+(x[3]!=null&&x[3]!==1?'<small>×'+LNN[x[3]]+'</small>':'')+'</button>';}).join("")+(my.length<MAX?'<button type="button" class="add" data-add="1" aria-label="コードを追加">＋</button>':'');
    q("root").innerHTML=KEYN.map(function(n,r){return '<button type="button" data-v="'+r+'" aria-pressed="'+(pc(c[0]+k)===r)+'">'+n+'</button>';}).join("");
    q("type").innerHTML=types.map(function(t){return '<button type="button" data-v="'+esc(t)+'" aria-pressed="'+(c[1]===t)+'">'+(t===""?"メジャー":esc(t))+'</button>';}).join("");
    q("bass").innerHTML='<button type="button" data-v="" aria-pressed="'+(c[2]==null)+'">なし</button>'+KEYN.map(function(n,r){return '<button type="button" data-v="'+r+'" aria-pressed="'+(c[2]!=null&&pc(c[2]+k)===r)+'">'+n+'</button>';}).join("");
    q("len").innerHTML=LNS.map(function(l){return '<button type="button" data-v="'+l+'" aria-pressed="'+((c[3]||1)===l)+'">'+LNN[l]+'</button>';}).join("");
    el.querySelector('[data-a="del"]').disabled=my.length<2;el.querySelector('[data-a="left"]').disabled=i===0;el.querySelector('[data-a="right"]').disabled=i===my.length-1;
  }
  function changed(){save(my);render();if(opt.onChange)opt.onChange(clone(my));}
  el.addEventListener("click",function(e){
    var b=e.target.closest("button");if(!b||!el.contains(b))return;var box=b.parentNode.getAttribute("data-r"),a=b.getAttribute("data-a"),k=key(),c=my[i];
    if(box==="seq"){if(b.getAttribute("data-add")){my.splice(i+1,0,c.slice());i++;changed();}else{i=+b.getAttribute("data-i");render();if(opt.onSelect)opt.onSelect(i);}return;}
    if(box==="root"){var r=pc(+b.getAttribute("data-v")-k);c[0]=r;if(c[2]===r)c[2]=null;norm(c);changed();return;}
    if(box==="type"){c[1]=b.getAttribute("data-v");changed();return;}
    if(box==="bass"){var v=b.getAttribute("data-v");if(v===""||pc(+v-k)===c[0])c[2]=null;else c[2]=pc(+v-k);norm(c);changed();return;}
    if(box==="len"){var l=+b.getAttribute("data-v");if(c.length<3)c[2]=null;c[3]=l;norm(c);changed();return;}
    if(a==="del"&&my.length>1){my.splice(i,1);i=Math.min(i,my.length-1);changed();}
    if(a==="left"&&i>0){var t=my[i-1];my[i-1]=my[i];my[i]=t;i--;changed();}
    if(a==="right"&&i<my.length-1){var t2=my[i+1];my[i+1]=my[i];my[i]=t2;i++;changed();}
    if(a==="reset"){my=[[0,"M7"]];i=0;changed();}
  });
  var pre=q("pre");if(pre)pre.addEventListener("change",function(){var p=presets[+pre.value];pre.value="";if(!p)return;var a=p.c.slice(0,MAX).map(function(c,j){var x=c.slice(0,3);if(p.ln&&p.ln[j]&&p.ln[j]!==1){if(x.length<3)x.push(null);x[3]=p.ln[j];}return norm(x);}).filter(function(c){return types.indexOf(c[1])>=0;});if(!a.length)return;my=clone(a);i=0;changed();});
  render();
  return {get:function(){return clone(my);},set:function(a){if(ok(a)){my=clone(a);i=Math.min(i,my.length-1);save(my);render();}},render:render,select:function(j){i=Math.max(0,Math.min(my.length-1,j));render();}};
}
window.NamiBuilder={TYPES:TYPES,MAX:MAX,LNS:LNS,lns:function(a){return a.some(function(c){return c[3]!=null&&c[3]!==1;})?a.map(function(c){return c[3]||1;}):null;},ok:ok,enc:enc,dec:dec,load:load,save:save,name:name,mount:mount};
})();
