/* なみぐる！TOOLS:変換が終わったときに小さく鳴る音(オン/オフ切り替え)
   使い方: ngDone.mount(要素) でスイッチを追加 / ngDone.notify() で終了音(オンのときだけ鳴る) */
(function(){
  var KEY="ng_done_sound",ctx=null;
  function on(){try{return localStorage.getItem(KEY)!=="0"}catch(e){return true}}
  function save(v){try{localStorage.setItem(KEY,v?"1":"0")}catch(e){}}
  function ac(){
    if(!ctx){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{ctx=new C()}catch(e){return null}}
    return ctx;
  }
  /* 変換は必ずユーザーの操作で始まるので、その操作のときに音を出せる状態にしておく */
  function unlock(){var c=ac();if(c&&c.state==="suspended")c.resume().catch(function(){})}
  ["pointerdown","keydown","change","drop"].forEach(function(t){document.addEventListener(t,unlock,{capture:true,passive:true})});
  function tone(c,t,f,d,v){
    var o=c.createOscillator(),g=c.createGain();
    o.type="sine";o.frequency.value=f;
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(v,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,t+d);
    o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+0.05);
  }
  function chime(){
    var c=ac();if(!c)return;
    var go=function(){var t=c.currentTime+0.02;tone(c,t,880,0.28,0.07);tone(c,t+0.13,1318.5,0.4,0.07)};
    if(c.state==="suspended")c.resume().then(go).catch(function(){});else go();
  }
  var api={
    enabled:on,
    notify:function(){if(on())chime()},
    mount:function(el){
      if(!el||el.querySelector(".ng-done-snd"))return;
      var l=document.createElement("label");l.className="ctl chk ng-done-snd";
      var i=document.createElement("input");i.type="checkbox";i.checked=on();
      i.addEventListener("change",function(){save(i.checked);if(i.checked)chime()});
      l.appendChild(i);l.appendChild(document.createTextNode(" 終わったら小さく音を鳴らす"));
      el.appendChild(l);
    }
  };
  window.ngDone=api;
})();
