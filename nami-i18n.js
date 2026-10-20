/* nami-i18n.js — 自前辞書による日英切り替え(Google翻訳不使用)
   使い方: <script src="nami-i18n.js"></script> を </body> 直前に。
   ページ固有の訳は NamiI18n.add({"日本語":"English"}) で追加。 */
(()=>{
const EN={
  /* 共通(ヘッダー・フッター) */
  "リンク":"Links","依頼":"Contact","₺ƾらせ":"mochinfo","なみぐる！":"namigroove!",
  "← トップへ戻る":"← Back to top","プライバシーポリシー":"Privacy Policy","相互リンク":"Link exchange",
  "メインメニュー":"Main menu","サイト情報":"Site info","このページをシェア":"Share this page",
  "ホーム画面に追加(アイコンにする)":"Add to Home Screen","Xでシェア":"Share on X","LINEで送る":"Send via LINE","リンクを共有":"Share link",
  "なみぐるをぷにぷにする":"Squish namigroove","お気に入りから外す":"Remove from favorites","お気に入りに追加":"Add to favorites",
  /* tools.html */
  "なみぐる！のツール":"namigroove's Tools",
  "ブラウザだけで使える音楽ツールです。インストールも登録もいりません。練習に、曲作りに、ちょっとした音遊びにどうぞ。":"Music tools that run right in your browser. No install, no sign-up. For practice, songwriting, or just playing around with sound.",
  "タップでBPM計測":"Tap to measure BPM","お気に入り":"Favorites",
  "ツールの☆を押すと、ここに並びます(この端末のブラウザに保存)。":"Tap the ☆ on a tool and it shows up here (saved in this browser).",
  "そのほかのツール":"More tools",
  "チューナー":"Tuner","マイクで音程をチェック。サックスなど移調楽器の音名にも対応。":"Check your pitch with the mic. Also shows note names for transposing instruments like sax.",
  "マイク":"Mic","12キー対応":"All 12 keys","基準音":"Reference tone",
  "メトロノーム":"Metronome","拍子・分割・音色・スウィングを選べる。なみぐるをタップしてBPM計測も。":"Choose time signature, subdivision, sound and swing. Tap namigroove to measure BPM, too.",
  "タップテンポ":"Tap tempo","3連・16分":"Triplets / 16ths","カウベル":"Cowbell",
  "ピアノ":"Piano","和音のコード名と、移調楽器での音名を表示。8つの音色・サンプラー・メトロノームつき。演奏はMIDIでも保存。":"Shows chord names and note names for transposing instruments. Comes with 8 sounds, a sampler and a metronome. Save your playing as MIDI.",
  "コード名":"Chord names","MIDI対応":"MIDI support","サンプラー":"Sampler",
  "ジャムモード":"Jam mode","おしゃれ進行や自分で作った進行を、ドラム・ベース・鍵盤でループ再生。変拍子も。ドラム入りMIDIで書き出し。":"Loop stylish progressions or your own with drums, bass and keys. Odd meters too. Export MIDI with drums.",
  "ループ":"Loop","11リズム":"11 rhythms",
  "ドラムパッド":"Drum pad","808・909・チップの3キット。叩いたり、ステップでビートを組んだり。エフェクトやMIDI保存も。":"Three kits: 808, 909 and chip. Tap pads or build beats step by step. Effects and MIDI export included.",
  "808・909":"808 / 909","シーケンサー":"Sequencer",
  "耳トレ":"Ear training","鳴った和音や音程を当てるクイズ。M9・m11・13 などおしゃれコードの聞き分けにも。":"A quiz where you identify the chord or interval you hear. Great for telling stylish chords like M9, m11 and 13 apart.",
  "コード当て":"Chord quiz","音程":"Intervals","聞き比べ":"A/B listening",
  "歌詞の音数カウンター":"Lyric mora counter","歌詞の1行ごとのモーラ数を数えます。拗音は1音、「っ」「ん」「ー」も1音。ボカロの作詞に。":"Counts the morae in each line of lyrics. Small ya/yu/yo count as part of one sound; っ, ん and ー each count as one. Handy for writing Vocaloid lyrics.",
  "作詞":"Lyrics","モーラ":"Morae","ボカロ":"Vocaloid",
  "お題ガチャ":"Prompt gacha","テーマ・ジャンル・歌声(合成音声)・キーワード・縛りをランダムに出す、作詞と曲づくりのお題メーカー。":"A random prompt maker for songwriting: theme, genre, singing voice (synth), keyword and constraint.",
  "お題":"Prompts","ジャンル":"Genre",
  "キー&BPM判定":"Key & BPM detector","音源ファイルから曲のテンポとキーを推定。DJ向けのカメロット表記つき。":"Estimates a song's tempo and key from an audio file. Includes Camelot notation for DJs.",
  "キー":"Key","カメロット":"Camelot",
  "BPMから1拍・半拍などのミリ秒を計算。ディレイやリバーブの設定に。":"Converts BPM into milliseconds per beat, half beat and so on. For setting delay and reverb times.",
  "付点":"Dotted","3連":"Triplet",
  "楽器のしらべもの":"Instrument references","練習の合間にさっと確認できる資料です。":"Quick references to check between practice sessions.",
  "スケール表":"Scale chart","ペンタ・ブルース・モード・オルタードまで。鍵盤・ギター・ベース・サックスの運指で確認できます。":"From pentatonic and blues to modes and altered. Check them on keys, guitar, bass and sax fingerings.",
  "アドリブ":"Improvisation","モード":"Modes","サックス運指":"Sax fingerings",
  "ギター・ベース コード表":"Guitar & bass chord chart","コード名から押さえ方、押さえた形からコード名。カポとベースの構成音にも対応。":"From chord name to fingering, and from fingering back to chord name. Supports capo and bass chord tones.",
  "順引き":"Chord → shape","逆引き":"Shape → chord","カポ":"Capo",
  "木管楽器運指表":"Woodwind fingering chart","サックス・クラリネット・フルート・リコーダー・オーボエ・ファゴットの運指を図で確認。実音表示・替え指つき。":"Fingering diagrams for sax, clarinet, flute, recorder, oboe and bassoon. Shows concert pitch and alternate fingerings.",
  "サックス":"Sax","クラリネット":"Clarinet","フルート":"Flute","リコーダー":"Recorder",
  "金管楽器運指表":"Brass fingering chart","トランペット・ホルン・トロンボーン・ユーフォニアム・チューバの運指を図で確認。替え指・音程の注意つき。":"Fingering diagrams for trumpet, horn, trombone, euphonium and tuba. Includes alternate fingerings and intonation notes.",
  "トランペット":"Trumpet","ホルン":"Horn","トロンボーン":"Trombone",
  "DAWで使うスクリプト":"DAW scripts","曲づくりやライブの準備に使っているスクリプトを配布しています。":"Scripts I use for songwriting and live prep, free to download.",
  "REAPER 選択アイテムの長さ表示":"REAPER: selected item lengths","REAPERで選んだアイテムの長さを一覧で表示し、合計時間も出すLuaスクリプト。ライブの尺確認などに。":"A Lua script that lists the lengths of the items you select in REAPER and shows the total. Useful for checking set length.",
  "更新履歴":"Changelog","#namigroovetools を作った理由":"Why I made #namigroovetools",
  "無料の音楽ツール集(チューナー・ピアノ・コード表ほか) – なみぐる！":"Free Music Tools (Tuner, Piano, Chord Chart & more) – namigroove!",
  "閉じる":"Close","もっと見る":"Show more"
};
/* 正規表現ルール(数字や固有名が入る文) */
const RX=[
  [/^(.+)をお気に入りに追加$/,m=>"Add "+tr(m[1])+" to favorites"],
  [/^(.+)をお気に入りから外す$/,m=>"Remove "+tr(m[1])+" from favorites"],
  [/^もっと見る\(ほか(\d+)件\)$/,m=>"Show more ("+m[1]+" more)"]
];
function look(t){ if(EN[t])return EN[t]; for(const[r,f]of RX){const m=t.match(r);if(m)return f(m);} return null; }
const SKIP=/^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE|KBD|TEXTAREA|SVG|CANVAS)$/;
const ATTR=["title","placeholder","aria-label","alt"];
const q=new URLSearchParams(location.search);
let LANG=q.get("lang")||"";
if(LANG!=="en"&&LANG!=="ja"){try{LANG=localStorage.getItem("nami-lang")||"ja"}catch(e){LANG="ja"}}
if(LANG!=="en")LANG="ja";

const tr=s=>LANG==="en"?(look(s)||s):s;

const cache=new WeakMap();           // Text/Element → 原文(日本語)
const skipped=el=>!!(el.closest&&el.closest('[translate="no"],[data-i18n-skip],.entry-content,.post-content,.log li'));

function textNodes(root){
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
    if(!n.nodeValue.trim())return NodeFilter.FILTER_REJECT;
    const p=n.parentElement; if(!p||SKIP.test(p.tagName)||skipped(p))return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT;}});
  const a=[];while(w.nextNode())a.push(w.currentNode);return a;
}
let busy=false;
function apply(root=document.body){
  busy=true;
  textNodes(root).forEach(n=>{
    let c=cache.get(n);
    if(!c||n.nodeValue!==c.shown)c=cache.set(n,{o:n.nodeValue,shown:n.nodeValue}).get(n); // 外部で書き換えられたら新しい原文
    const t=c.o.trim(),e=LANG==="en"?look(t):null;
    c.shown=e?c.o.replace(t,e):c.o; if(n.nodeValue!==c.shown)n.nodeValue=c.shown;
  });
  root.querySelectorAll("["+ATTR.join("],[")+"]").forEach(el=>{
    if(skipped(el))return;
    const m=cache.get(el)||{};cache.set(el,m);
    ATTR.forEach(k=>{if(!el.hasAttribute(k))return;
      const cur=el.getAttribute(k);
      if(!m[k]||cur!==m[k].shown)m[k]={o:cur,shown:cur};
      const e=LANG==="en"?look(m[k].o.trim()):null;
      m[k].shown=e||m[k].o; if(cur!==m[k].shown)el.setAttribute(k,m[k].shown);});
  });
  document.documentElement.lang=LANG;
  if(document.title){ if(!document._ot)document._ot=document.title; const nt=tr(document._ot); if(document.title!==nt)document.title=nt; }
  links();
  busy=false;
}
let tm;
new MutationObserver(()=>{ if(busy||LANG!=="en")return; clearTimeout(tm); tm=setTimeout(()=>apply(),60); })
  .observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR});
/* 内部リンクに ?lang=en を引き継ぐ(英語時のみ。日本語時は除去) */
function links(){
  document.querySelectorAll("a[href]").forEach(a=>{
    if(a.matches("[data-lang]"))return;
    let u;try{u=new URL(a.getAttribute("href"),location.href)}catch(e){return}
    if(!/^https?:$/.test(u.protocol)||!/(namigroove\.com|github\.io)$/.test(u.hostname))return;
    if(u.pathname===location.pathname&&u.hash&&!u.search&&u.href.split("#")[0]===location.href.split("#")[0])return;
    if(LANG==="en")u.searchParams.set("lang","en");else u.searchParams.delete("lang");
    if(a.getAttribute("href")!==u.href)a.setAttribute("href",u.href);
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
