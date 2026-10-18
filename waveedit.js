/* なみぐる！TOOLS:サンプラーの波形編集(ピアノ・ドラムパッド共通)
   st = {s:始まり(0〜1), e:終わり(0〜1), fi:フェードイン(秒), fo:フェードアウト(秒), n:ノーマライズ} */
(function(){
"use strict";
var DEF={s:0,e:1,fi:0,fo:0,n:false};
function norm(st){st=st||{};return {s:st.s||0,e:st.e==null?1:st.e,fi:st.fi||0,fo:st.fo||0,n:!!st.n};}
function isDef(st){st=norm(st);return st.s===0&&st.e===1&&!st.fi&&!st.fo&&!st.n;}
/* 鳴らす範囲(秒)。逆再生のときは、元の音で選んだ範囲を後ろから鳴らす */
function region(buf,st,rev){st=norm(st);var d=buf.duration,a=st.s*d,b=st.e*d;if(rev){var t=a;a=d-b;b=d-t;}return {off:a,dur:Math.max(0.005,b-a)};}
/* 範囲の中のいちばん大きい音で割った値(ノーマライズ用)。作った値は使い回す */
function peakGain(buf,st){st=norm(st);var k=st.s+":"+st.e;if(buf._pgK===k)return buf._pg;var c0=buf.getChannelData(0),c1=buf.numberOfChannels>1?buf.getChannelData(1):c0,i0=Math.floor(st.s*buf.length),i1=Math.floor(st.e*buf.length),p=0;
  for(var i=i0;i<i1;i++){var v=Math.max(Math.abs(c0[i]),Math.abs(c1[i]));if(v>p)p=v;}buf._pgK=k;buf._pg=p>0?Math.min(8,0.95/p):1;return buf._pg;}
/* g(GainNode)にフェードとノーマライズをかける。realDur=実際に鳴る長さ(秒) */
function shape(g,t,realDur,st,base){st=norm(st);var lv=base*(st.n?1:1);g.gain.cancelScheduledValues(t);
  if(st.fi>0){g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(lv,t+Math.min(st.fi,realDur*0.9));}else g.gain.setValueAtTime(lv,t);
  if(st.fo>0){var fs=Math.max(t+0.001,t+realDur-st.fo);g.gain.setValueAtTime(lv,fs);g.gain.linearRampToValueAtTime(0.0001,t+realDur);}}
/* 波形を描く */
function draw(cv,buf,st){var dpr=window.devicePixelRatio||1,w=cv.clientWidth||300,h=cv.clientHeight||80;cv.width=w*dpr;cv.height=h*dpr;var x=cv.getContext("2d");x.setTransform(dpr,0,0,dpr,0,0);
  var cs=getComputedStyle(cv),ink=cs.getPropertyValue("--sea").trim()||"#2c5ccc",soft=cs.getPropertyValue("--line").trim()||"#d5e0f5",acc=cs.getPropertyValue("--coral").trim()||"#a2511f";
  x.clearRect(0,0,w,h);if(!buf){x.fillStyle=soft;x.fillText("音がまだありません",8,h/2);return;}st=norm(st);
  var d=buf.getChannelData(0),step=Math.max(1,Math.floor(d.length/w)),sx=st.s*w,ex=st.e*w;
  var pk=0;for(var q=0;q<d.length;q+=Math.max(1,d.length>>12)){var av=Math.abs(d[q]);if(av>pk)pk=av;}var sc=pk>0?Math.min(20,0.95/pk):1;
  for(var i=0;i<w;i++){var mn=1,mx=-1,o=i*step;for(var j=0;j<step&&o+j<d.length;j+=Math.max(1,step>>4)){var v=d[o+j];if(v<mn)mn=v;if(v>mx)mx=v;}
    x.fillStyle=(i>=sx&&i<=ex)?ink:soft;x.fillRect(i,h/2-Math.min(1,mx*sc)*h/2*0.95,1,Math.max(1,(Math.min(1,mx*sc)-Math.max(-1,mn*sc))*h/2*0.95));}
  x.fillStyle="rgba(0,0,0,.06)";x.fillRect(0,0,sx,h);x.fillRect(ex,0,w-ex,h);
  var dur=buf.duration*(st.e-st.s);x.strokeStyle=acc;x.globalAlpha=.7;x.beginPath();
  if(st.fi>0){var fw=Math.min(1,st.fi/dur)*(ex-sx);x.moveTo(sx,h);x.lineTo(sx+fw,0);}
  if(st.fo>0){var ow=Math.min(1,st.fo/dur)*(ex-sx);x.moveTo(ex-ow,0);x.lineTo(ex,h);}x.stroke();x.globalAlpha=1;
  [sx,ex].forEach(function(px,k){x.fillStyle=acc;x.fillRect(px-1,0,2,h);x.beginPath();x.moveTo(px,0);x.lineTo(px+(k?-9:9),0);x.lineTo(px,10);x.fill();});}
/* 始まり・終わりの取っ手をドラッグ。opt.get()→{buf,st}、opt.set(st,done) */
function attach(cv,opt){var which=null;
  function pos(e){var r=cv.getBoundingClientRect();return Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));}
  cv.style.touchAction="none";
  cv.addEventListener("pointerdown",function(e){var o=opt.get();if(!o.buf)return;var st=norm(o.st),p=pos(e);which=Math.abs(p-st.s)<Math.abs(p-st.e)?"s":"e";cv.setPointerCapture(e.pointerId);move(e);});
  function move(e){if(!which)return;var o=opt.get(),st=norm(o.st),p=pos(e);if(which==="s")st.s=Math.min(p,st.e-0.01);else st.e=Math.max(p,st.s+0.01);st.s=Math.round(st.s*1000)/1000;st.e=Math.round(st.e*1000)/1000;opt.set(st,false);}
  cv.addEventListener("pointermove",move);
  ["pointerup","pointercancel"].forEach(function(t){cv.addEventListener(t,function(){if(which){which=null;var o=opt.get();opt.set(norm(o.st),true);}});});}
window.NamiWave={norm:norm,isDef:isDef,region:region,peakGain:peakGain,shape:shape,draw:draw,attach:attach};
})();
