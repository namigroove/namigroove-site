/* なみぐる！TOOLS:MIDIファイル(SMF 0/1)の読み込み(ドラム・ピアノ共通)
   NamiMidiRead.parse(ArrayBuffer) → {ppq, ts:[分子,分母], tempos:[{tick,us}], notes:[{tick,dur,ch,n,v,sec,secDur}], endTick, endSec, bpm} */
(function(){
"use strict";
function parse(ab){
  var d=new DataView(ab),p=0,len=d.byteLength;
  function u32(){var v=d.getUint32(p);p+=4;return v;}function u16(){var v=d.getUint16(p);p+=2;return v;}
  function str(){var s="";for(var i=0;i<4;i++)s+=String.fromCharCode(d.getUint8(p+i));p+=4;return s;}
  function vlq(){var v=0,b;do{b=d.getUint8(p++);v=(v<<7)|(b&127);}while(b&128);return v;}
  if(len<14||str()!=="MThd")throw new Error("MIDIファイルではありません");
  var hl=u32(),fmt=u16(),nt=u16(),div=u16();p=8+hl;
  if(div&0x8000)throw new Error("この時間形式(SMPTE)には対応していません");
  var ppq=div||480,tempos=[],ts=null,notes=[],endTick=0;
  for(var t=0;t<nt&&p+8<=len;t++){
    var id=str(),tl=u32(),end=Math.min(len,p+tl);if(id!=="MTrk"){p=end;continue;}
    var tick=0,run=0,open={};
    while(p<end){
      tick+=vlq();var st=d.getUint8(p);
      if(st===0xFF){p++;var ty=d.getUint8(p++),ml=vlq();
        if(ty===0x51&&ml>=3)tempos.push({tick:tick,us:(d.getUint8(p)<<16)|(d.getUint8(p+1)<<8)|d.getUint8(p+2)});
        if(ty===0x58&&ml>=2&&!ts)ts=[d.getUint8(p),Math.pow(2,d.getUint8(p+1))];
        p+=ml;continue;}
      if(st===0xF0||st===0xF7){p++;p+=vlq();continue;}
      if(st&0x80){run=st;p++;}
      var hi=run&0xF0,ch=run&15,a=d.getUint8(p++),b=(hi===0xC0||hi===0xD0)?0:d.getUint8(p++);
      if(hi===0x90&&b>0){var k=ch*128+a;(open[k]=open[k]||[]).push({tick:tick,ch:ch,n:a,v:b});}
      else if(hi===0x80||(hi===0x90&&b===0)){var k2=ch*128+a,o=open[k2];if(o&&o.length){var s=o.shift();s.dur=Math.max(1,tick-s.tick);notes.push(s);}}
    }
    for(var kk in open)open[kk].forEach(function(s){s.dur=Math.max(1,tick-s.tick);notes.push(s);});
    if(tick>endTick)endTick=tick;p=end;
  }
  tempos.sort(function(x,y){return x.tick-y.tick;});if(!tempos.length||tempos[0].tick>0)tempos.unshift({tick:0,us:500000});
  /* tick → 秒 */
  var seg=[],sec=0;for(var i=0;i<tempos.length;i++){if(i)sec+=(tempos[i].tick-tempos[i-1].tick)*tempos[i-1].us/1e6/ppq;seg.push({tick:tempos[i].tick,us:tempos[i].us,sec:sec});}
  function toSec(tk){var s=seg[0];for(var i=1;i<seg.length&&seg[i].tick<=tk;i++)s=seg[i];return s.sec+(tk-s.tick)*s.us/1e6/ppq;}
  notes.sort(function(x,y){return x.tick-y.tick||x.n-y.n;});
  notes.forEach(function(n){n.sec=toSec(n.tick);n.secDur=toSec(n.tick+n.dur)-n.sec;});
  return {format:fmt,ppq:ppq,ts:ts||[4,4],tempos:tempos,notes:notes,endTick:endTick,endSec:toSec(endTick),bpm:Math.round(60e6/tempos[0].us),toSec:toSec};
}
/* ファイル選択を開いて読み込む。cb(結果, ファイル名) */
function pick(cb,onErr){var i=document.createElement("input");i.type="file";i.accept=".mid,.midi,audio/midi,audio/x-midi";
  i.onchange=function(){var f=i.files&&i.files[0];if(!f)return;f.arrayBuffer().then(function(ab){var r;try{r=parse(ab);}catch(e){if(onErr)onErr(e);return;}cb(r,f.name);});};i.click();}
window.NamiMidiRead={parse:parse,pick:pick};
})();
