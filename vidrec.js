/* なみぐる！TOOLS:演奏を動画で撮って、シェア・保存する(ピアノ・ドラムパッド・ジャムモード共通)
   NamiVidRec.mount({after, name, title, url, tap:()=>({ctx,node}), draw:(g,box,info)=>{}, sub:()=>"..."})
   ・音:ツールの最後の出口(node)から枝分かれさせて、雑音なしで録る
   ・映像:ツールごとの draw で、録画用の画面を canvas に描く(縦長 720×1280 / 正方形 720×720) */
(function(){
"use strict";
var MAX=60; /* 最長の秒数 */
var C={bg1:"#0b1430",bg2:"#1a2d6b",panel:"#101b3d",line:"#2a3a6e",ink:"#e6ecfb",soft:"#9fb0d6",sea:"#7fa3f5",coral:"#f0a36b",warn:"#f48aa6",white:"#ffffff"};
var FONT='"MaruMinyaM","Zen Maru Gothic","Hiragino Maru Gothic ProN",system-ui,sans-serif';
function ok(){return !!(window.MediaRecorder&&HTMLCanvasElement.prototype.captureStream&&(window.AudioContext||window.webkitAudioContext));}
function pickMime(){/* H.264のMP4(SNSにそのまま上げやすい)を優先。だめならWebM。Safariは素のMP4 */
  var L=['video/mp4;codecs="avc1.42E01E,mp4a.40.2"',"video/mp4;codecs=avc1,mp4a","video/mp4;codecs=avc1","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm","video/mp4"];
  for(var i=0;i<L.length;i++){try{if(MediaRecorder.isTypeSupported(L[i]))return L[i];}catch(e){}}return "";}
var store={get:function(k,d){try{var v=localStorage.getItem("ngTools."+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set:function(k,v){try{localStorage.setItem("ngTools."+k,JSON.stringify(v));}catch(e){}}};
var css=".vr-box{display:inline-flex;align-items:center;gap:6px;flex-wrap:nowrap}"+
  ".vr-btn{white-space:nowrap}.vr-btn svg{width:1.05em;height:1.05em;vertical-align:-.15em;margin-right:.25em;fill:currentColor}"+
  ".vr-btn[aria-pressed=true]{background:var(--warn,#d0436b);border-color:var(--warn,#d0436b);color:#fff}"+
  ".vr-fmt{font:inherit;font-size:13px;padding:6px 10px;border-radius:999px;border:1px solid var(--line,#d6deef);background:var(--panel,#fff);color:var(--ink,#1b2440)}"+
  ".vr-modal{position:fixed;inset:0;z-index:1000;background:rgba(5,10,30,.72);display:flex;align-items:center;justify-content:center;padding:16px}"+
  ".vr-card{background:var(--panel,#fff);color:var(--ink,#1b2440);border-radius:16px;padding:14px;max-width:440px;width:100%;max-height:100%;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,.35);text-align:center}"+
  ".vr-card video{display:block;width:100%;max-height:46vh;border-radius:10px;background:#000;margin:0 auto}"+
  ".vr-meta{font-size:12px;color:var(--ink-soft,#5a6a8f);margin:8px 0}"+
  ".vr-trim{margin:4px 0 12px;padding:8px 10px;border-radius:12px;background:var(--wash,#e3ebfb)}.vr-tr{display:grid;grid-template-columns:2.6em 1fr 4.2em;align-items:center;gap:8px;font-size:12.5px}.vr-tr input{width:100%;accent-color:var(--sea,#2c5ccc)}.vr-tr b{font-weight:400;text-align:right;font-variant-numeric:tabular-nums}.vr-trim .btn{margin-top:6px}.vr-trim .btn:disabled{opacity:.45;cursor:default}.vr-prog{font-size:12px;margin:6px 0 0;color:var(--ink-soft,#5a6a8f)}"+
  ".vr-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}"+
  ".vr-note{font-size:12px;color:var(--ink-soft,#5a6a8f);margin:10px 0 0;text-align:left;line-height:1.6}";
var CAM='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h11a2 2 0 0 1 2 2v1.5l4-2.5v10l-4-2.5V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/></svg>';
function fmtT(s){s=Math.max(0,Math.floor(s));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
function stamp(){var d=new Date(),p=function(n){return String(n).padStart(2,"0");};return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+"-"+p(d.getHours())+p(d.getMinutes());}

/* 文字を幅に収まるように縮めて描く */
function fitText(g,txt,x,y,maxW,size,weight,color,align){size=Math.round(size);g.font=(weight||400)+" "+size+"px "+FONT;var w=g.measureText(txt).width;
  if(w>maxW&&w>0){size=Math.max(10,Math.floor(size*maxW/w));g.font=(weight||400)+" "+size+"px "+FONT;}
  g.fillStyle=color||C.ink;g.textAlign=align||"center";g.textBaseline="middle";g.fillText(txt,x,y);return size;}
function rrect(g,x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}

/* 動画の一部を切り出す:動画をその範囲だけ再生して、canvas と音を録り直す(Safariでも動くやり方) */
function trimRec(url,s,e,onProg){return new Promise(function(res,rej){var v=document.createElement("video");v.playsInline=true;v.preload="auto";v.src=url;
  var AC=window.AudioContext||window.webkitAudioContext,ac=new AC(),ms,dest;try{ms=ac.createMediaElementSource(v);dest=ac.createMediaStreamDestination();ms.connect(dest);}catch(x){rej(x);return;}
  var fail=function(x){try{ac.close();}catch(y){}rej(x);};v.addEventListener("error",fail);
  v.addEventListener("loadedmetadata",function(){var W=v.videoWidth||720,H=v.videoHeight||1280,cv=document.createElement("canvas");cv.width=W;cv.height=H;
    cv.style.cssText="position:fixed;left:-10000px;top:0;width:72px;height:"+Math.round(H/10)+"px;pointer-events:none";document.body.appendChild(cv);var g=cv.getContext("2d");
    var st=new MediaStream(cv.captureStream(30).getVideoTracks().concat(dest.stream.getAudioTracks())),mime=pickMime(),mr;
    try{mr=new MediaRecorder(st,mime?{mimeType:mime,videoBitsPerSecond:2500000,audioBitsPerSecond:160000}:undefined);}catch(x){cv.remove();fail(x);return;}
    var ch=[],raf=0,done=false;mr.ondataavailable=function(ev){if(ev.data&&ev.data.size)ch.push(ev.data);};
    var finish=function(){if(done)return;done=true;cancelAnimationFrame(raf);v.pause();try{mr.requestData();}catch(x){}try{mr.stop();}catch(x){}};
    mr.onstop=function(){st.getTracks().forEach(function(t){t.stop();});cv.remove();try{ac.close();}catch(x){}res({blob:new Blob(ch,{type:(mr.mimeType||mime||"video/webm").split(";")[0]}),type:(mr.mimeType||mime||"video/webm").split(";")[0],dur:e-s});};
    var draw=function(){try{g.drawImage(v,0,0,W,H);}catch(x){}if(onProg)onProg(v.currentTime-s,e-s);if(v.currentTime>=e-0.02||v.ended){finish();return;}raf=requestAnimationFrame(draw);};
    v.addEventListener("seeked",function(){try{g.drawImage(v,0,0,W,H);}catch(x){}if(ac.state!=="running")try{ac.resume();}catch(x){}mr.start(500);
      var p=v.play();if(p&&p.then)p.then(function(){raf=requestAnimationFrame(draw);}).catch(function(x){finish();});else raf=requestAnimationFrame(draw);
      setTimeout(finish,(e-s)*1000+3000);},{once:true});
    v.currentTime=Math.max(0.001,s);});});}
function mount(o){
  if(!ok()||!o||!(o.after||o.into))return null;
  if(!document.getElementById("vr-css")){var st=document.createElement("style");st.id="vr-css";st.textContent=css;document.head.appendChild(st);}
  var box=document.createElement("span");box.className="vr-box";
  var btn=document.createElement("button");btn.type="button";btn.className="btn vr-btn";btn.setAttribute("aria-pressed","false");btn.title="演奏を動画で撮って、シェア・保存できます(最長"+MAX+"秒)";
  var sel=document.createElement("select");sel.className="sel vr-fmt";sel.setAttribute("aria-label","動画の形");sel.innerHTML='<option value="v">縦長</option><option value="s">正方形</option>';
  sel.value=store.get("vrFmt","v")==="s"?"s":"v";sel.onchange=function(){store.set("vrFmt",sel.value);};
  box.appendChild(btn);box.appendChild(sel);if(o.into)o.into.appendChild(box);else o.after.insertAdjacentElement("afterend",box);
  var label=function(){btn.innerHTML=CAM+"動画で撮る";};label();
  var R=null; /* 録画中の状態 */

  function frame(){if(!R)return;var g=R.g,W=R.W,H=R.H,sq=R.sq,now=performance.now(),el=(now-R.t0)/1000;
    var bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,C.bg1);bg.addColorStop(1,C.bg2);g.fillStyle=bg;g.fillRect(0,0,W,H);
    /* ふわっと光る丸(背景の飾り) */
    g.globalAlpha=0.08;g.fillStyle=C.sea;g.beginPath();g.arc(W*0.85,H*0.12,W*0.32,0,7);g.fill();g.fillStyle=C.coral;g.beginPath();g.arc(W*0.1,H*0.9,W*0.28,0,7);g.fill();g.globalAlpha=1;
    var top=sq?54:110;
    fitText(g,"なみぐる！TOOLS",W/2,top-(sq?22:40),W-80,sq?22:28,400,C.sea);
    fitText(g,o.title,W/2,top+(sq?10:12),W-80,sq?34:46,400,C.ink);
    var sub=o.sub?o.sub():"";if(sub)fitText(g,sub,W/2,top+(sq?42:62),W-80,sq?18:24,400,C.soft);
    /* 下:音の動き(スペクトラム)と #namigroovetools */
    var foot=sq?70:150,fy=H-foot;
    if(R.an){var n=48,d=R.fd;R.an.getByteFrequencyData(d);var bw=(W-80)/n,base=fy+(sq?10:30),mh=sq?26:50;
      for(var i=0;i<n;i++){var k=Math.floor(Math.pow(i/n,1.7)*d.length*0.7),v=d[k]/255;g.fillStyle=i%2?C.sea:C.coral;g.globalAlpha=0.35+0.65*v;var h=2+v*mh;g.fillRect(40+i*bw+1,base-h,bw-2,h);}g.globalAlpha=1;}
    fitText(g,"#namigroovetools",W/2,H-(sq?32:72),W-80,sq?22:30,400,C.ink);
    fitText(g,"namigroove.com/tools",W/2,H-(sq?10:36),W-80,sq?14:20,400,C.soft);
    var by=top+(sq?66:100),bb=fy+(sq?10:30)-(sq?26:50)-(sq?10:18),b={x:40,y:by,w:W-80,h:bb-by};
    try{o.draw(g,b,{sq:sq,t:el,C:C,fit:fitText,rrect:rrect,font:FONT});}catch(e){}
    R.raf=requestAnimationFrame(frame);}

  function start(){var tp;try{tp=o.tap();}catch(e){tp=null;}if(!tp||!tp.ctx||!tp.node){alert("音の準備ができませんでした");return;}
    var ctx=tp.ctx;if(ctx.state!=="running")try{ctx.resume();}catch(e){}
    var sq=sel.value==="s",W=720,H=sq?720:1280,cv=document.createElement("canvas");cv.width=W;cv.height=H;
    cv.style.cssText="position:fixed;left:-10000px;top:0;width:72px;height:"+(H/10)+"px;pointer-events:none";document.body.appendChild(cv);
    var g=cv.getContext("2d"),dest=ctx.createMediaStreamDestination(),an=ctx.createAnalyser();an.fftSize=256;an.smoothingTimeConstant=0.75;
    tp.node.connect(dest);tp.node.connect(an);
    var vs=cv.captureStream(30),stream=new MediaStream(vs.getVideoTracks().concat(dest.stream.getAudioTracks()));
    var mime=pickMime(),mr;try{mr=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:2500000,audioBitsPerSecond:160000}:undefined);}catch(e){try{mr=new MediaRecorder(stream);}catch(e2){cleanup();alert("このブラウザでは動画を録れませんでした");return;}}
    R={g:g,W:W,H:H,sq:sq,cv:cv,dest:dest,an:an,fd:new Uint8Array(an.frequencyBinCount),node:tp.node,mr:mr,chunks:[],t0:performance.now(),mime:mr.mimeType||mime||"video/webm",raf:0,tm:0};
    function cleanup(){try{tp.node.disconnect(dest);}catch(e){}try{tp.node.disconnect(an);}catch(e){}stream.getTracks().forEach(function(t){t.stop();});cv.remove();}
    R.cleanup=cleanup;
    var rr=R;mr.ondataavailable=function(e){if(e.data&&e.data.size)rr.chunks.push(e.data);};
    mr.onstop=function(){cancelAnimationFrame(rr.raf);clearInterval(rr.tm);var dur=(performance.now()-rr.t0)/1000;cleanup();var type=(rr.mime||"video/webm").split(";")[0];var blob=new Blob(rr.chunks,{type:type});R=null;btn.setAttribute("aria-pressed","false");label();result(blob,type,dur);};
    frame();mr.start(500);
    btn.setAttribute("aria-pressed","true");
    var tick=function(){if(!R)return;var el=(performance.now()-R.t0)/1000;btn.textContent="■ 止める "+fmtT(el)+" / "+fmtT(MAX);if(el>=MAX)stop();};tick();R.tm=setInterval(tick,250);
    if(window.ngTrack)try{ngTrack("video_rec",{tool:o.name});}catch(e){}}
  function stop(){if(!R||R.stopping)return;R.stopping=true;try{R.mr.requestData();}catch(e){}try{R.mr.stop();}catch(e){}}
  btn.onclick=function(){if(R)stop();else start();};

  function result(blob0,type0,dur0){
    var cur={},m=document.createElement("div");m.className="vr-modal";m.setAttribute("role","dialog");m.setAttribute("aria-label","撮った動画");
    m.innerHTML='<div class="vr-card"><video controls playsinline></video><p class="vr-meta"></p>'+
      '<div class="vr-trim"><div class="vr-tr"><span>開始</span><input type="range" data-t="s" step="0.1" min="0" aria-label="切り取りの開始"><b data-v="s"></b></div>'+
      '<div class="vr-tr"><span>終了</span><input type="range" data-t="e" step="0.1" min="0" aria-label="切り取りの終了"><b data-v="e"></b></div>'+
      '<button class="btn" type="button" data-a="trim">✂ この範囲で切り取る</button><p class="vr-prog" hidden></p></div>'+
      '<div class="vr-btns"></div><p class="vr-note"></p></div>';
    document.body.appendChild(m);
    var vid=m.querySelector("video"),rs=m.querySelector('[data-t="s"]'),re=m.querySelector('[data-t="e"]'),busy=false;
    function set(blob,type,dur){if(cur.url)URL.revokeObjectURL(cur.url);var ext=type.indexOf("mp4")>=0?"mp4":"webm";
      cur={blob:blob,type:type,dur:dur,ext:ext,name:"namigroove_"+o.name+"_"+stamp()+"."+ext,url:URL.createObjectURL(blob)};
      try{cur.file=new File([blob],cur.name,{type:type});}catch(e){cur.file=null;}
      cur.share=!!(cur.file&&navigator.canShare&&navigator.share&&(function(){try{return navigator.canShare({files:[cur.file]});}catch(e){return false;}})());
      vid.src=cur.url;m.querySelector(".vr-meta").textContent=fmtT(dur)+" ・ "+ext.toUpperCase()+" ・ "+(blob.size/1048576).toFixed(1)+" MB";
      [rs,re].forEach(function(r){r.max=String(Math.max(0.1,Math.floor(dur*10)/10));});rs.value="0";re.value=re.max;tv();
      m.querySelector(".vr-btns").innerHTML=(cur.share?'<button class="go" type="button" data-a="share">シェア</button>':"")+'<button class="'+(cur.share?"btn":"go")+'" type="button" data-a="save">保存</button><button class="btn" type="button" data-a="close">閉じる</button>';
      m.querySelector(".vr-note").innerHTML=(cur.share?"シェアからX・LINE・Instagramなどに送れます。":"保存した動画をSNSに投稿してね。")+" 投稿するときは <b>#namigroovetools</b> を付けてくれるとうれしいです！"+(ext==="webm"?"<br>※このブラウザではWebM形式になります。Xなどに投稿できないときは、MP4に変換してください。":"");}
    function f1(x){x=Math.max(0,x);return Math.floor(x/60)+":"+(x%60).toFixed(1).padStart(4,"0");}
    function tv(){m.querySelector('[data-v="s"]').textContent=f1(+rs.value);m.querySelector('[data-v="e"]').textContent=f1(+re.value);
      var full=+rs.value<=0.05&&+re.value>=+re.max-0.05;m.querySelector('[data-a="trim"]').disabled=full||busy;}
    function onR(r){if(+re.value-+rs.value<0.5){if(r===rs)rs.value=String(Math.max(0,+re.value-0.5));else re.value=String(Math.min(+re.max,+rs.value+0.5));}tv();
      try{vid.pause();vid.currentTime=+(r===rs?rs.value:re.value);}catch(e){}}
    rs.addEventListener("input",function(){onR(rs);});re.addEventListener("input",function(){onR(re);});
    /* 切り取り:選んだ範囲を頭から再生しながら、もう一度録り直す(端末の中だけで処理) */
    function trim(){var s0=+rs.value,e0=+re.value,pg=m.querySelector(".vr-prog");busy=true;tv();pg.hidden=false;pg.textContent="切り取り中…";
      m.querySelectorAll(".vr-btns button,.vr-trim input").forEach(function(x){x.disabled=true;});
      trimRec(cur.url,s0,e0,function(a,b){pg.textContent="切り取り中… "+fmtT(a)+" / "+fmtT(b);}).then(function(r){busy=false;pg.hidden=true;m.querySelectorAll(".vr-trim input").forEach(function(x){x.disabled=false;});set(r.blob,r.type,r.dur);})
        .catch(function(){busy=false;pg.textContent="切り取れませんでした";m.querySelectorAll(".vr-btns button,.vr-trim input").forEach(function(x){x.disabled=false;});tv();});}
    set(blob0,type0,dur0);
    var close=function(){m.remove();setTimeout(function(){URL.revokeObjectURL(cur.url);},1000);document.removeEventListener("keydown",esc);};
    var esc=function(e){if(e.key==="Escape"&&!busy)close();};document.addEventListener("keydown",esc);
    m.addEventListener("click",function(e){if(e.target===m){if(!busy)close();return;}var b=e.target.closest("button[data-a]");if(!b||b.disabled)return;var a=b.dataset.a;
      if(a==="close")close();
      else if(a==="trim")trim();
      else if(a==="save"){var l=document.createElement("a");l.href=cur.url;l.download=cur.name;document.body.appendChild(l);l.click();l.remove();if(window.ngTrack)try{ngTrack("video_save",{tool:o.name});}catch(e2){}}
      else if(a==="share"){navigator.share({files:[cur.file],title:o.title+" – なみぐる！",text:o.title+" – なみぐる！ #namigroovetools "+(o.url||"")}).then(function(){if(window.ngTrack)try{ngTrack("video_share",{tool:o.name});}catch(e2){}}).catch(function(){});}});
    var bt=m.querySelector(".vr-btns button");if(bt)bt.focus();}
  return {stop:stop,recording:function(){return !!R;}};
}
window.NamiVidRec={mount:mount,ok:ok,C:C};
})();
