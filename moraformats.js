/* 歌詞の書き出し・読み込み用のファイル形式(歌声合成ソフトなど)
   テンプレートと音素の対応表は UtaFormatix (sdercolin, Apache-2.0) を参考にしています。 */
(()=>{
"use strict";
const KANA_PH={"あ":["a"],"い":["i"],"う":["u"],"え":["e"],"お":["o"],"ぁ":["a"],"ぃ":["i"],"ぅ":["u"],"ぇ":["e"],"ぉ":["o"],"ゐ":["i"],"ゑ":["e"],"か":["k","a"],"き":["k","i"],"く":["k","u"],"け":["k","e"],"こ":["k","o"],"きゃ":["ky","a"],"きゅ":["ky","u"],"きぇ":["ky","e"],"きょ":["ky","o"],"くぁ":["k","w","a"],"くぃ":["k","w","i"],"くぅ":["k","w","u"],"くぇ":["k","w","e"],"くぉ":["k","w","o"],"が":["g","a"],"ぎ":["g","i"],"ぐ":["g","u"],"げ":["g","e"],"ご":["g","o"],"ぎゃ":["gy","a"],"ぎゅ":["gy","u"],"ぎぇ":["gy","e"],"ぎょ":["gy","o"],"ぐぁ":["g","w","a"],"ぐぃ":["g","w","i"],"ぐぅ":["g","w","u"],"ぐぇ":["g","w","e"],"ぐぉ":["g","w","o"],"さ":["s","a"],"し":["sh","i"],"す":["s","u"],"せ":["s","e"],"そ":["s","o"],"ざ":["z","a"],"じ":["j","i"],"ず":["z","u"],"ぜ":["z","e"],"ぞ":["z","o"],"しゃ":["sh","a"],"しゅ":["sh","u"],"しぇ":["sh","e"],"しょ":["sh","o"],"すぃ":["s","i"],"じゃ":["j","a"],"じゅ":["j","u"],"じぇ":["j","e"],"じょ":["j","o"],"ずぃ":["z","i"],"た":["t","a"],"ち":["ch","i"],"つ":["ts","u"],"て":["t","e"],"と":["t","o"],"ちゃ":["ch","a"],"ちゅ":["ch","u"],"ちぇ":["ch","e"],"ちょ":["ch","o"],"つぁ":["ts","a"],"つぃ":["ts","i"],"つぇ":["ts","e"],"つぉ":["ts","o"],"てゃ":["ty","a"],"てぃ":["t","i"],"てゅ":["ty","u"],"てぇ":["ty","e"],"てょ":["ty","o"],"とぅ":["t","u"],"だ":["d","a"],"ぢ":["j","i"],"づ":["z","u"],"で":["d","e"],"ど":["d","o"],"ぢゃ":["j","a"],"ぢゅ":["j","u"],"ぢぇ":["j","e"],"ぢょ":["j","o"],"でゃ":["dy","a"],"でぃ":["d","i"],"でゅ":["dy","u"],"でぇ":["dy","e"],"でょ":["dy","o"],"どぅ":["d","u"],"な":["n","a"],"に":["n","i"],"ぬ":["n","u"],"ね":["n","e"],"の":["n","o"],"にゃ":["ny","a"],"にゅ":["ny","u"],"にぇ":["ny","e"],"にょ":["ny","o"],"は":["h","a"],"ひ":["h","i"],"ふ":["f","u"],"へ":["h","e"],"ほ":["h","o"],"ひゃ":["hy","a"],"ひゅ":["hy","u"],"ひぇ":["hy","e"],"ひょ":["hy","o"],"ふぁ":["f","a"],"ふぃ":["f","i"],"ふぇ":["f","e"],"ふぉ":["f","o"],"ふゃ":["f","y","a"],"ふゅ":["f","y","i"],"ば":["b","a"],"び":["b","i"],"ぶ":["b","u"],"べ":["b","e"],"ぼ":["b","o"],"びゃ":["by","a"],"びゅ":["by","u"],"びぇ":["by","e"],"びょ":["by","o"],"ぶぁ":["b","w","a"],"ぶぃ":["b","w","i"],"ぶぇ":["b","w","e"],"ぶぉ":["b","w","o"],"ヴぁ":["v","a"],"ヴぃ":["v","i"],"ヴ":["v","u"],"ヴぇ":["v","e"],"ヴぉ":["v","o"],"ヴゃ":["v","y","a"],"ヴゅ":["v","y","i"],"ぱ":["p","a"],"ぴ":["p","i"],"ぷ":["p","u"],"ぺ":["p","e"],"ぽ":["p","o"],"ぴゃ":["py","a"],"ぴゅ":["py","u"],"ぴぇ":["py","e"],"ぴょ":["py","o"],"ぷぁ":["p","w","a"],"ぷぃ":["p","w","i"],"ぷぇ":["p","w","e"],"ぷぉ":["p","w","o"],"ま":["m","a"],"み":["m","i"],"む":["m","u"],"め":["m","e"],"も":["m","o"],"みゃ":["my","a"],"みゅ":["my","u"],"みぇ":["my","e"],"みょ":["my","o"],"や":["y","a"],"ゆ":["y","u"],"よ":["y","o"],"ら":["r","a"],"り":["r","i"],"る":["r","u"],"れ":["r","e"],"ろ":["r","o"],"りゃ":["ry","a"],"りゅ":["ry","u"],"りぇ":["ry","e"],"りょ":["ry","o"],"わ":["w","a"],"を":["w","o"],"ん":["N"],"っ":["cl"],"ー":["-"],"息":["br"]};
const PH_XS={"cl":"?","pau":"Asp","sil":"Sil","br":"br1","u":"M","N":"N\\","ry":"4'","ky":"k'","py":"p'","dy":"d'","ty":"t'","ny":"J","hy":"C","my":"m'","gy":"g'","by":"b'","sh":"S","j":"dZ","z":"dz","f":"p\\","f y":"p\\'","ch":"tS","r":"4","y":"j","v":"p\\"};
const TPL={"vpr":{"version":{"major":5,"minor":0,"revision":0},"vender":"Yamaha Corporation","title":"title","masterTrack":{"samplingRate":44100,"loop":{"isEnabled":true,"begin":0,"end":7680},"tempo":{"isFolded":false,"height":0.0,"global":{"isEnabled":false,"value":12000},"events":[{"pos":0,"value":12000}]},"timeSig":{"isFolded":false,"events":[{"bar":0,"numer":4,"denom":4}]},"volume":{"isFolded":false,"height":0.0,"events":[{"pos":0,"value":0}]}},"voices":[{"compID":"BCXDC6CZLSZHZCB4","name":"VY2V3"}],"tracks":[{"type":0,"name":"1 VOCALOID","color":0,"busNo":0,"isFolded":false,"height":0.0,"volume":{"isFolded":true,"height":40.0,"events":[{"pos":0,"value":0}]},"panpot":{"isFolded":true,"height":40.0,"events":[{"pos":0,"value":0}]},"isMuted":false,"isSoloMode":false,"parts":[{"pos":0,"duration":1920,"styleName":"No Effect","voice":{"compID":"BCXDC6CZLSZHZCB4","langID":0},"midiEffects":[{"id":"SingingSkill","isBypassed":true,"isFolded":false,"parameters":[{"name":"Amount","value":5},{"name":"Name","value":"75F04D2B-D8E4-44b8-939B-41CD101E08FD"},{"name":"Skill","value":5}]},{"id":"VoiceColor","isBypassed":true,"isFolded":false,"parameters":[{"name":"Air","value":0},{"name":"Breathiness","value":0},{"name":"Character","value":0},{"name":"Exciter","value":0},{"name":"Growl","value":0},{"name":"Mouth","value":0}]},{"id":"RobotVoice","isBypassed":true,"isFolded":false,"parameters":[{"name":"Mode","value":1}]},{"id":"DefaultLyric","isBypassed":true,"isFolded":false,"parameters":[{"name":"CHS","value":"a"},{"name":"ENG","value":"Ooh"},{"name":"ESP","value":"a"},{"name":"JPN","value":"あ"},{"name":"KOR","value":"아"}]},{"id":"Breath","isBypassed":true,"isFolded":false,"parameters":[{"name":"Exhalation","value":5},{"name":"Mode","value":1},{"name":"Type","value":0}]}],"notes":[{"lyric":"あ","phoneme":"a","isProtected":false,"pos":480,"duration":480,"number":54,"velocity":64,"exp":{"opening":127},"singingSkill":{"duration":158,"weight":{"pre":64,"post":64}},"vibrato":{"type":0,"duration":0}}]}]}]},"svp":{"version":113,"time":{"meter":[{"index":0,"numerator":4,"denominator":4}],"tempo":[{"position":0,"bpm":120.0}]},"library":[],"tracks":[{"name":"Track","dispColor":"ff7db235","dispOrder":0,"renderEnabled":false,"mixer":{"gainDecibel":0.0,"pan":0.0,"mute":false,"solo":false,"display":true},"mainGroup":{"name":"main","uuid":"6d21a9d4-1f0c-4534-ba57-bf8f1033b0e9","parameters":{"pitchDelta":{"mode":"cubic","points":[]},"vibratoEnv":{"mode":"cubic","points":[]},"loudness":{"mode":"cubic","points":[]},"tension":{"mode":"cubic","points":[]},"breathiness":{"mode":"cubic","points":[]},"voicing":{"mode":"cubic","points":[]},"gender":{"mode":"cubic","points":[]}},"notes":[{"onset":0,"duration":705600000,"lyrics":"la","phonemes":"","pitch":60,"attributes":{}}]},"mainRef":{"groupID":"6d21a9d4-1f0c-4534-ba57-bf8f1033b0e9","blickOffset":0,"pitchOffset":0,"isInstrumental":false,"database":{"name":"","language":"","phoneset":""},"audio":{"filename":"","duration":0.0},"dictionary":"","voice":{}},"groups":[]}],"renderConfig":{"destination":"./","filename":"untitled","numChannels":1,"aspirationFormat":"noAspiration","bitDepth":16,"sampleRate":44100,"exportMixDown":true}}};
const PPQ=480;
/* ---------- 共通 ---------- */
const xe=t=>String(t).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const cd=t=>"<![CDATA["+String(t).replace(/\]\]>/g,"]]]]><![CDATA[>")+"]]>";
const uuid=()=>(crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==="x"?r:(r&3|8)).toString(16)}));
function sjis(s){
  const o=[];
  for(const ch of s){
    const c=ch.codePointAt(0);
    if(c<0x80)o.push(c);
    else if(c>=0x3041&&c<=0x3093){const v=0x829F+(c-0x3041);o.push(v>>8,v&255)}
    else if(c===0x3094){o.push(0x83,0x94)}
    else if(c>=0x30A1&&c<=0x30F6){let v=0x8340+(c-0x30A1);if(c>=0x30E0)v++;o.push(v>>8,v&255)}
    else if(c===0x30FC)o.push(0x81,0x5B);
    else o.push(0x3F);
  }
  return o;
}
function decodeBytes(u8){
  try{return new TextDecoder("utf-8",{fatal:true}).decode(u8)}catch(e){}
  try{return new TextDecoder("shift_jis").decode(u8)}catch(e){}
  return new TextDecoder("utf-8").decode(u8);
}
const VOWEL={a:"あ",i:"い",u:"う",e:"え",o:"お"};
const VOWELS=new Set(["a","i","u","e","o"]);
const kanaKey=t=>t.replace(/ゔ/g,"ヴ");
function phones(tok){
  let k=kanaKey(tok);
  if(KANA_PH[k])return KANA_PH[k];
  const m=k.match(/^(.*?)([っんー]+)$/);
  if(m&&KANA_PH[m[1]]){return KANA_PH[m[1]].concat(m[2].split("").map(c=>KANA_PH[c]||[]).flat().filter(p=>p!=="cl"&&p!=="-"))}
  return null;
}
const xs=p=>PH_XS[p]||p;
function xsampa(tok){const ph=phones(tok);if(!ph)return "";return ph.filter(p=>p!=="-").map(xs).join(" ")}
function lastVowel(tok){const ph=phones(tok);if(!ph)return null;for(let i=ph.length-1;i>=0;i--){if(VOWELS.has(ph[i]))return VOWEL[ph[i]];if(ph[i]==="N")return "ん"}return null}
/* 音の並び: lines(配列の配列) → ノート [{s,d,l}] (tick=480/拍)、行の間は1拍あける */
function sequence(lines,tick,opt){
  const out=[];let t=0;
  lines.forEach((ln,li)=>{
    let prev=null;
    for(const raw of ln){
      let l=raw;
      if(opt.vocaloid){
        if(l==="ー"){l=prev?lastVowel(prev)||"あ":"あ"}
        if(l==="っ"){prev=raw;t+=tick;continue}
      }else if(opt.extend&&l==="ー"){l=opt.extend}
      else if(opt.vowelExt&&l==="ー"){l=prev?lastVowel(prev)||"あ":"あ"}
      out.push({s:t,d:tick,l,src:raw});t+=tick;
      if(raw!=="ー")prev=raw;
    }
    if(li<lines.length-1)t+=PPQ;
  });
  return out;
}
const pad=(n,k)=>String(n).padStart(k,"0");
/* ---------- 書き出し ---------- */
function vlq(n){const b=[n&0x7f];n>>=7;while(n>0){b.unshift((n&0x7f)|0x80);n>>=7}return b}
const be=(n,k)=>{const a=[];for(let i=k-1;i>=0;i--)a.push((n>>(8*i))&255);return a};
function mkMidi(lines,bpm,tick){
  const ev=[];let last=0;
  const add=(time,bytes)=>{for(const b of vlq(time-last))ev.push(b);for(const b of bytes)ev.push(b);last=time};
  add(0,[0xFF,0x51,3,...be(Math.round(60000000/bpm),3)]);
  add(0,[0xFF,0x58,4,4,2,24,8]);
  add(0,[0xFF,0x03,6,76,121,114,105,99,115]);
  for(const n of sequence(lines,tick,{})){
    const b=sjis(n.l);
    add(n.s,[0xFF,0x05,...vlq(b.length),...b]);add(n.s,[0x90,60,100]);add(n.s+n.d,[0x80,60,0]);
  }
  const end=last;add(end,[0xFF,0x2F,0]);
  const trk=[0x4D,0x54,0x72,0x6B,...be(ev.length,4),...ev];
  return new Uint8Array([0x4D,0x54,0x68,0x64,0,0,0,6,0,0,0,1,...be(PPQ,2),...trk]);
}
function mkMusicXml(lines,bpm,tick){
  const div=4,dur=tick===480?4:tick===240?2:1,type=tick===480?"quarter":tick===240?"eighth":"16th",mlen=16;
  let x='<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n<score-partwise version="3.1"><work><work-title>Lyrics</work-title></work><part-list><score-part id="P1"><part-name>Vocal</part-name></score-part></part-list><part id="P1">';
  let mn=1,pos=0,open=false,first=true;
  const startM=()=>{x+=`<measure number="${mn++}">`;if(first){x+=`<attributes><divisions>${div}</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${bpm}</per-minute></metronome></direction-type><sound tempo="${bpm}"/></direction>`;first=false}open=true;pos=0};
  const endM=()=>{x+="</measure>";open=false};
  for(const ln of lines){
    for(const s of ln){
      if(!open)startM();
      x+=`<note><pitch><step>C</step><octave>4</octave></pitch><duration>${dur}</duration><type>${type}</type><lyric number="1"><syllabic>single</syllabic><text>${xe(s)}</text></lyric></note>`;
      pos+=dur;if(pos>=mlen)endM();
    }
    if(open){const p=mlen-pos;if(p>0)x+=`<note><rest/><duration>${p}</duration></note>`;endM()}
  }
  if(open)endM();
  return x+"</part></score-partwise>\n";
}
function mkUst(lines,bpm,tick){
  let s="[#VERSION]\nUST Version1.2\nCharset=Shift_JIS\n[#SETTING]\nTempo="+bpm+"\nTracks=1\nProjectName=lyrics\nVoiceDir=%VOICE%\nOutFile=\nCacheDir=lyrics.cache\nTool1=wavtool.exe\nTool2=resampler.exe\nMode2=True\n";
  let i=0;const id=()=>"[#"+pad(i++,4)+"]\n";
  const seq=sequence(lines,tick,{vowelExt:true});let t=0;
  for(const n of seq){
    if(n.s>t){s+=id()+"Length="+(n.s-t)+"\nLyric=R\nNoteNum=60\nPreUtterance=\n"}
    s+=id()+"Length="+n.d+"\nLyric="+n.l+"\nNoteNum=60\nPreUtterance=\n";t=n.s+n.d;
  }
  return s+"[#TRACKEND]\n";
}
function mkUstx(lines,bpm,tick){
  const seq=sequence(lines,tick,{extend:"-"});
  const ex=(n,a,b,c,d,dd,e)=>`    ${n}:\n      name: ${a}\n      abbr: ${n}\n      type: ${b}\n      min: ${c}\n      max: ${d}\n      default_value: ${dd}\n      is_flag: ${e?"true":"false"}\n      flag: '${e||""}'\n`;
  let y=`name: Lyrics
comment: ''
output_dir: Vocal
cache_dir: UCache
ustx_version: 0.6
resolution: 480
bpm: ${bpm}
beat_per_bar: 4
beat_unit: 4
time_signatures:
  - bar_position: 0
    beat_per_bar: 4
    beat_unit: 4
tempos:
  - position: 0
    bpm: ${bpm}
expressions:
`+ex("dyn","dynamics (curve)","Curve",-240,120,0)+ex("pitd","pitch deviation (curve)","Curve",-1200,1200,0)
+`    clr:\n      name: voice color\n      abbr: clr\n      type: Options\n      min: 0\n      max: -1\n      default_value: 0\n      is_flag: false\n      options: []\n`
+`    eng:\n      name: resampler engine\n      abbr: eng\n      type: Options\n      min: 0\n      max: 1\n      default_value: 0\n      is_flag: false\n      options:\n      - ''\n      - worldline\n`
+ex("vel","velocity","Numerical",0,200,100)+ex("vol","volume","Numerical",0,200,100)+ex("atk","attack","Numerical",0,200,100)+ex("dec","decay","Numerical",0,100,0)
+ex("gen","gender","Numerical",-100,100,0,"g")+ex("genc","gender (curve)","Curve",-100,100,0)+ex("bre","breath","Numerical",0,100,0,"B")+ex("brec","breathiness (curve)","Curve",-100,100,0)
+ex("lpf","lowpass","Numerical",0,100,0,"H")+ex("mod","modulation","Numerical",0,100,0)+ex("alt","alternate","Numerical",0,16,0)+ex("shft","tone shift","Numerical",-36,36,0)
+ex("shfc","tone shift (curve)","Curve",-1200,1200,0)+ex("tenc","tension (curve)","Curve",-100,100,0)+ex("voic","voicing (curve)","Curve",0,100,100);
  y+=`tracks:\n- phonemizer: OpenUtau.Core.DefaultPhonemizer\n  mute: false\n  solo: false\n  volume: 0\nvoice_parts:\n- name: Lyrics\n  comment: ''\n  track_no: 0\n  position: 0\n  notes:\n`;
  for(const n of seq){
    y+=`  - position: ${n.s}\n    duration: ${n.d}\n    tone: 60\n    lyric: ${JSON.stringify(n.l)}\n    pitch:\n      data:\n      - {x: -1, y: 0, shape: io}\n      - {x: 1, y: 0, shape: io}\n      snap_first: true\n    vibrato: {length: 0, period: 175, depth: 25, in: 10, out: 10, shift: 0, drift: 0}\n    phoneme_expressions: []\n    phoneme_overrides: []\n`;
  }
  return y+"  curves: []\nwave_parts: []\n";
}
function mkSvp(lines,bpm,tick){
  const seq=sequence(lines,tick,{extend:"-"});
  const t=JSON.parse(JSON.stringify(TPL.svp));
  const id=uuid(),tr=t.tracks[0],R=1470000;
  t.time.tempo=[{position:0,bpm}];
  tr.name="Lyrics";tr.mainGroup.uuid=id;tr.mainRef.groupID=id;
  tr.mainGroup.notes=seq.map(n=>({onset:n.s*R,duration:n.d*R,lyrics:n.l,phonemes:"",pitch:60,attributes:{}}));
  return JSON.stringify(t,null,1);
}
function mkVsqx(lines,bpm,tick){
  const seq=sequence(lines,tick,{vocaloid:true});
  const end=seq.length?seq[seq.length-1].s+seq[seq.length-1].d:480;
  const bar=1920,pre=1,part=bar*pre;
  const nst='<nStyle><v id="accent">50</v><v id="bendDep">0</v><v id="bendLen">0</v><v id="decay">50</v><v id="fallPort">0</v><v id="opening">127</v><v id="risePort">0</v><v id="vibLen">0</v><v id="vibType">0</v></nStyle>';
  const notes=seq.map(n=>{const p=xsampa(n.l);return `<note><t>${n.s}</t><dur>${n.d}</dur><n>60</n><v>64</v><y>${cd(n.l)}</y><p${p?' lock="1"':""}>${cd(p||"a")}</p>${nst}</note>`}).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<vsq4 xmlns="http://www.yamaha.co.jp/vocaloid/schema/vsq4/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.yamaha.co.jp/vocaloid/schema/vsq4/ vsq4.xsd">
<vender>${cd("Yamaha corporation")}</vender><version>${cd("4.0.0.3")}</version>
<vVoiceTable><vVoice><bs>0</bs><pc>0</pc><id>${cd("BCXDC6CZLSZHZCB4")}</id><name>${cd("VY2V3")}</name><vPrm><bre>0</bre><bri>0</bri><cle>0</cle><gen>0</gen><ope>0</ope></vPrm></vVoice></vVoiceTable>
<mixer><masterUnit><oDev>0</oDev><rLvl>0</rLvl><vol>0</vol></masterUnit><vsUnit><tNo>0</tNo><iGin>0</iGin><sLvl>-898</sLvl><sEnable>0</sEnable><m>0</m><s>0</s><pan>64</pan><vol>0</vol></vsUnit><monoUnit><iGin>0</iGin><sLvl>-898</sLvl><sEnable>0</sEnable><m>0</m><s>0</s><pan>64</pan><vol>0</vol></monoUnit><stUnit><iGin>0</iGin><m>0</m><s>0</s><vol>-129</vol></stUnit></mixer>
<masterTrack><seqName>${cd("Untitled0")}</seqName><comment>${cd("Lyrics")}</comment><resolution>480</resolution><preMeasure>${pre}</preMeasure><timeSig><m>0</m><nu>4</nu><de>4</de></timeSig><tempo><t>0</t><v>${Math.round(bpm*100)}</v></tempo></masterTrack>
<vsTrack><tNo>0</tNo><name>${cd("Track")}</name><comment>${cd("Track")}</comment><vsPart><t>${part}</t><playTime>${end}</playTime><name>${cd("NewPart")}</name><comment>${cd("New Musical Part")}</comment><sPlug><id>${cd("ACA9C502-A04B-42b5-B2EB-5CEA36D16FCE")}</id><name>${cd("VOCALOID2 Compatible Style")}</name><version>${cd("3.0.0.1")}</version></sPlug><pStyle><v id="accent">50</v><v id="bendDep">8</v><v id="bendLen">0</v><v id="decay">50</v><v id="fallPort">0</v><v id="opening">127</v><v id="risePort">0</v></pStyle><singer><t>0</t><bs>0</bs><pc>0</pc></singer>${notes}<plane>0</plane></vsPart></vsTrack>
<monoTrack></monoTrack><stTrack></stTrack>
<aux><id>${cd("AUX_VST_HOST_CHUNK_INFO")}</id><content>${cd("VlNDSwAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")}</content></aux>
</vsq4>
`;
}
function mkVpr(lines,bpm,tick){
  const seq=sequence(lines,tick,{vocaloid:true});
  const t=JSON.parse(JSON.stringify(TPL.vpr));
  const end=seq.length?seq[seq.length-1].s+seq[seq.length-1].d:480;
  t.title="Lyrics";
  t.masterTrack.tempo.events=[{pos:0,value:Math.round(bpm*100)}];
  t.masterTrack.loop.end=Math.max(1920,Math.ceil(end/1920)*1920);
  const tr=t.tracks[0],tpl=tr.parts[0].notes[0];
  tr.name="1 VOCALOID";
  tr.parts[0].duration=end;
  tr.parts[0].notes=seq.map(n=>{const p=xsampa(n.l);return Object.assign(JSON.parse(JSON.stringify(tpl)),{lyric:n.l,phoneme:p||tpl.phoneme,isProtected:!!p,pos:n.s,duration:n.d,number:60})});
  const json=JSON.stringify(t);
  return fflate.zipSync({"Project/sequence.json":fflate.strToU8(json)});
}
function mkCcs(lines,bpm,tick){
  const seq=sequence(lines,tick,{});
  const R=2,pre=PPQ*4*R;
  const gid=uuid();
  const notes=seq.map(n=>`<Note Clock="${n.s*R+pre}" PitchStep="0" PitchOctave="4" Duration="${n.d*R}" Lyric="${xe(n.l)}"/>`).join("\n                            ");
  return `<?xml version="1.0" encoding="utf-8"?>
<Scenario Code="7251BC4B6168E7B2992FA620BD3E1E77">
    <Generation>
        <Author Version="3.2.21.2"/>
        <TTS Version="3.1.0"><Dictionary Version="1.4.0"/><SoundSources/></TTS>
        <SVSS Version="3.0.5"><Dictionary Version="1.0.0"/><SoundSources><SoundSource Version="1.0.0" Id="XSV-JPF-W" Name="緑咲 香澄"/><SoundSource Version="1.0.0" Id="XSV-JPM-P" Name="赤咲 湊"/></SoundSources></SVSS>
    </Generation>
    <Sequence Id="">
        <Scene Id="">
            <Units>
                <Unit Version="1.0" Id="" Category="SingerSong" Group="${gid}" StartTime="00:00:00" Duration="00:00:02" CastId="XSV-JPM-P" Language="Japanese">
                    <Song Version="1.02">
                        <Tempo><Sound Clock="0" Tempo="${bpm.toFixed(2)}"/></Tempo>
                        <Beat><Time Clock="0" Beats="4" BeatType="4"/></Beat>
                        <Score>
                            <Key Clock="0" Fifths="0" Mode="0"/>
                            ${notes}
                        </Score>
                    </Song>
                </Unit>
            </Units>
            <Groups>
                <Group Version="1.0" Id="${gid}" Category="SingerSong" Name="ソング 1" Color="#FFAF1F14" Volume="0" Pan="0" IsSolo="false" IsMuted="false" CastId="XSV-JPM-P" Language="Japanese"/>
            </Groups>
            <SoundSetting Rhythm="4/4" Tempo="${bpm}"/>
        </Scene>
    </Sequence>
</Scenario>
`;
}
const OUT={
  txt:{name:"lyrics.txt",mime:"text/plain;charset=utf-8",melody:false,f:(l)=>l.map(x=>x.join(" ")).join("\n")+"\n"},
  xml:{name:"lyrics.musicxml",mime:"application/vnd.recordare.musicxml+xml",melody:true,f:mkMusicXml},
  mid:{name:"lyrics.mid",mime:"audio/midi",melody:true,f:mkMidi,bin:true},
  ust:{name:"lyrics.ust",mime:"text/plain",melody:true,f:mkUst,sjis:true},
  ustx:{name:"lyrics.ustx",mime:"application/x-yaml",melody:true,f:mkUstx},
  svp:{name:"lyrics.svp",mime:"application/json",melody:true,f:mkSvp},
  vsqx:{name:"lyrics.vsqx",mime:"application/xml",melody:true,f:mkVsqx},
  vpr:{name:"lyrics.vpr",mime:"application/octet-stream",melody:true,f:mkVpr,bin:true},
  ccs:{name:"lyrics.ccs",mime:"application/xml",melody:true,f:mkCcs},
};
function build(fmt,lines,bpm,tick){
  const o=OUT[fmt];if(!o)return null;
  const r=o.f(lines,bpm,tick);
  if(o.bin)return {bytes:r,name:o.name,mime:o.mime};
  if(o.sjis)return {bytes:new Uint8Array(sjis(r)),text:r,name:o.name,mime:o.mime};
  return {text:r,name:o.name,mime:o.mime};
}
/* ---------- 読み込み ---------- */
const kids=(e,n)=>[...e.children].filter(x=>x.nodeName===n);
const kid=(e,n)=>kids(e,n)[0]||null;
const tx=(e,n)=>{const k=kid(e,n);return k?k.textContent:""};
const xmlDoc=t=>{const d=new DOMParser().parseFromString(t,"application/xml");if(d.querySelector("parsererror"))throw new Error("parse");return d};
function parseVsqx(text){
  const d=xmlDoc(text),r=d.documentElement,v4=r.nodeName==="vsq4";
  const mt=kid(r,"masterTrack"),res=parseInt(tx(mt,"resolution"),10)||480;
  const ts=kid(mt,"timeSig"),beats=ts?parseInt(tx(ts,v4?"nu":"nume"),10)||4:4;
  const parts=kids(r,"vsTrack").map((t,i)=>{
    const notes=[];
    for(const p of kids(t,v4?"vsPart":"musicalPart")){
      const base=parseInt(tx(p,v4?"t":"posTick"),10)||0;
      for(const n of kids(p,"note"))notes.push({s:base+(parseInt(tx(n,v4?"t":"posTick"),10)||0),d:parseInt(tx(n,v4?"dur":"durTick"),10)||0,l:tx(n,v4?"y":"lyric")});
    }
    return {name:tx(t,v4?"name":"trackName")||("トラック "+(i+1)),notes};
  });
  return {ppq:res,beats,parts};
}
function parseVpr(buf){
  const z=fflate.unzipSync(new Uint8Array(buf));
  const key=Object.keys(z).find(k=>/Project[\\/]sequence\.json$/.test(k));
  if(!key)throw new Error("vpr");
  const j=JSON.parse(new TextDecoder().decode(z[key]));
  const ts=j.masterTrack&&j.masterTrack.timeSig&&j.masterTrack.timeSig.events&&j.masterTrack.timeSig.events[0];
  const parts=(j.tracks||[]).filter(t=>(t.parts||[]).some(p=>p.notes&&p.notes.length)).map((t,i)=>({name:t.name||("トラック "+(i+1)),notes:t.parts.flatMap(p=>(p.notes||[]).map(n=>({s:(p.pos||0)+n.pos,d:n.duration,l:n.lyric||""})))}));
  return {ppq:480,beats:ts?ts.numer:4,parts};
}
function parseSvp(text){
  const j=JSON.parse(text),R=1470000,lib=j.library||[];
  const fromGroup=(ref,g)=>(g.notes||[]).map(n=>({s:(n.onset+(ref.blickOffset||0))/R,d:n.duration/R,l:n.lyrics||""}));
  const parts=(j.tracks||[]).map((t,i)=>{
    let notes=[];
    if(t.mainGroup&&t.mainRef)notes=notes.concat(fromGroup(t.mainRef,t.mainGroup));
    for(const ref of t.groups||[]){const g=lib.find(x=>x.uuid===ref.groupID);if(g)notes=notes.concat(fromGroup(ref,g))}
    return {name:t.name||("トラック "+(i+1)),notes};
  }).filter(p=>p.notes.length);
  const m=j.time&&j.time.meter&&j.time.meter[0];
  return {ppq:480,beats:m?m.numerator:4,parts};
}
function parseUstx(text){
  const y=jsyaml.load(text.replace(/^﻿/,""));
  const res=y.resolution||480,byTrack={};
  for(const vp of y.voice_parts||[]){
    const k=vp.track_no||0;(byTrack[k]=byTrack[k]||{name:"トラック "+(k+1)+(vp.name?"("+vp.name+")":""),notes:[]});
    for(const n of vp.notes||[])byTrack[k].notes.push({s:(vp.position||0)+n.position,d:n.duration,l:String(n.lyric==null?"":n.lyric).replace(/\s*\[[^\]]*\]$/,"")});
  }
  return {ppq:res,beats:y.beat_per_bar||4,parts:Object.values(byTrack).filter(p=>p.notes.length)};
}
function parseUst(buf){
  const u=new Uint8Array(buf),head=new TextDecoder("latin1").decode(u.slice(0,600));
  const cs=((head.match(/Charset=([\w-]+)/i)||[])[1]||"shift_jis").toLowerCase();
  let text;try{text=new TextDecoder(cs==="shift-jis"?"shift_jis":cs).decode(u)}catch(e){text=decodeBytes(u)}
  const notes=[];let t=0,cur=null;
  for(const line of text.split(/\r?\n/)){
    const m=line.match(/^\[#(\w+)\]/);
    if(m){if(cur)push(cur);cur=/^\d+$/.test(m[1])?{}:null;continue}
    if(cur){const kv=line.match(/^(\w+)=(.*)$/);if(kv)cur[kv[1]]=kv[2]}
  }
  if(cur)push(cur);
  function push(c){const d=parseInt(c.Length,10)||0;if(c.Lyric!=null||d)notes.push({s:t,d,l:c.Lyric||""});t+=d}
  return {ppq:480,beats:4,parts:[{name:"UST",notes}]};
}
function parseCcs(text){
  const d=xmlDoc(text),groups={};
  d.querySelectorAll("Group").forEach(g=>groups[g.getAttribute("Id")]=g.getAttribute("Name"));
  const parts=[];let beats=4;
  d.querySelectorAll("Unit").forEach((u,i)=>{
    if(u.getAttribute("Category")!=="SingerSong")return;
    const notes=[...u.querySelectorAll("Score > Note")].map(n=>({s:+n.getAttribute("Clock"),d:+n.getAttribute("Duration"),l:n.getAttribute("Lyric")||""}));
    const tm=u.querySelector("Beat > Time");if(tm)beats=parseInt(tm.getAttribute("Beats"),10)||4;
    if(notes.length)parts.push({name:groups[u.getAttribute("Group")]||("ソング "+(i+1)),notes});
  });
  return {ppq:960,beats,parts};
}
function parseMidi(buf){
  const u=new Uint8Array(buf),dv=new DataView(buf);
  if(String.fromCharCode(u[0],u[1],u[2],u[3])!=="MThd")throw new Error("midi");
  const nt=dv.getUint16(10),div=dv.getUint16(12);
  if(div&0x8000)throw new Error("smpte");
  let p=8+dv.getUint32(4),beats=4;const parts=[];
  for(let t=0;t<nt&&p+8<=u.length;t++){
    if(String.fromCharCode(u[p],u[p+1],u[p+2],u[p+3])!=="MTrk")break;
    const len=dv.getUint32(p+4);let q=p+8;const end=Math.min(u.length,q+len);
    let time=0,run=0,name="";const lyr=[],txt=[],notes=[],open={};
    while(q<end){
      let d=0,b;do{b=u[q++];d=(d<<7)|(b&0x7f)}while(b&0x80&&q<end);time+=d;
      let st=u[q];if(st<0x80)st=run;else{q++;if(st<0xF0)run=st}
      if(st===0xFF){
        const type=u[q++];let l=0;do{b=u[q++];l=(l<<7)|(b&0x7f)}while(b&0x80&&q<end);
        const data=u.slice(q,q+l);q+=l;
        if(type===0x05)lyr.push({time,l:decodeBytes(data)});else if(type===0x01)txt.push({time,l:decodeBytes(data)});else if(type===0x03)name=decodeBytes(data);else if(type===0x58&&data.length)beats=data[0];
      }else if(st===0xF0||st===0xF7){let l=0;do{b=u[q++];l=(l<<7)|(b&0x7f)}while(b&0x80&&q<end);q+=l}
      else{
        const hi=st&0xF0,ch=st&0xF,a=u[q++],c=(hi===0xC0||hi===0xD0)?0:u[q++];
        if(hi===0x90&&c>0)open[ch+":"+a]=time;
        else if(hi===0x80||(hi===0x90&&c===0)){const k=ch+":"+a;if(open[k]!=null){notes.push({s:open[k],d:time-open[k]});delete open[k]}}
      }
    }
    p+=8+len;
    const L=(lyr.length?lyr:txt).filter(x=>!/^@/.test(x.l));
    if(!L.length||!notes.length)continue;
    notes.sort((a,b)=>a.s-b.s);
    let prev=-1;
    for(const n of notes){
      const cand=L.filter(x=>x.time<=n.s&&x.time>prev);
      n.l=cand.length?cand[cand.length-1].l:"";prev=n.s;
    }
    parts.push({name:name||("トラック "+(parts.length+1)),notes});
  }
  return {ppq:div,beats,parts};
}
async function parse(file){
  const n=file.name.toLowerCase(),buf=await file.arrayBuffer();
  if(/\.(mid|midi)$/.test(n))return parseMidi(buf);
  if(/\.vpr$/.test(n))return parseVpr(buf);
  if(/\.ust$/.test(n))return parseUst(buf);
  const text=decodeBytes(new Uint8Array(buf));
  if(/\.vsqx$/.test(n))return parseVsqx(text);
  if(/\.svp$/.test(n))return parseSvp(text);
  if(/\.ustx$/.test(n))return parseUstx(text);
  if(/\.ccs$/.test(n))return parseCcs(text);
  throw new Error("unknown");
}
/* 音の並び → 行ごとの歌詞と音符の数 */
function extractNotes(part,ppq,beats,brk){
  const notes=part.notes.slice().sort((a,b)=>a.s-b.s);
  const lines=[],counts=[];let buf="",nn=0,prevEnd=null,mIdx=null;
  const flush=()=>{const t=buf.trim();if(t){lines.push(t);counts.push(nn)}buf="";nn=0;prevEnd=null;mIdx=null};
  for(const n of notes){
    let l=String(n.l||"").trim();
    if(/^(R|r|rest)$/.test(l)||(l===""&&n.d>0&&n.s>=0&&n.isRest)){flush();continue}
    if(prevEnd!=null){const gap=n.s-prevEnd,thr=brk==="r1"?ppq:brk==="r2"?2*ppq:Infinity;if(gap>=thr)flush()}
    if(brk==="m"){const mi=Math.floor(n.s/(ppq*beats));if(mIdx!=null&&mi!==mIdx)flush();mIdx=mi}
    nn++;
    if(/^[-+ー―]$/.test(l))l="ー";
    if(/[A-Za-z']$/.test(buf)&&/^[A-Za-z]/.test(l))buf+=" ";
    buf+=l;prevEnd=n.s+n.d;
  }
  flush();
  return {lines,counts};
}
window.NgFormats={parse,extractNotes,build,OUT};
})();
