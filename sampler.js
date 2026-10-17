/* なみぐる！ツール共通のサンプラー:音声ファイルの読み込み・マイク録音・ブラウザ内への保存
   音はこの端末の中だけで扱い、どこにも送信しない */
(function () {
  "use strict";
  var DB = "ngSampler", ST = "s", dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      if (!window.indexedDB) { rej("no-idb"); return; }
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(ST); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(ST, mode), s = t.objectStore(ST), out = fn(s);
        t.oncomplete = function () { res(out && out.result); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  /* 保存:{name, data(ArrayBuffer), ...好きな情報} */
  function save(key, rec) { return tx("readwrite", function (s) { return s.put(rec, key); }).catch(function () {}); }
  function load(key) { return tx("readonly", function (s) { return s.get(key); }).catch(function () { return null; }); }
  function remove(key) { return tx("readwrite", function (s) { return s.delete(key); }).catch(function () {}); }
  function keys() { return tx("readonly", function (s) { return s.getAllKeys(); }).catch(function () { return []; }); }

  /* デコードして、頭の無音を切った位置(offset)と音量の正規化値(gain)をつける */
  function decode(ac, data) {
    var copy = data.slice(0);
    return new Promise(function (res, rej) {
      var p = ac.decodeAudioData(copy, res, rej);
      if (p && p.then) p.then(res, rej);
    }).then(function (buf) {
      var peak = 0, ch = [];
      for (var c = 0; c < buf.numberOfChannels; c++) ch.push(buf.getChannelData(c));
      for (var i = 0; i < buf.length; i++) for (var k = 0; k < ch.length; k++) { var v = Math.abs(ch[k][i]); if (v > peak) peak = v; }
      var th = Math.max(0.003, peak * 0.06), start = 0;
      outer: for (var j = 0; j < buf.length; j++) for (var k2 = 0; k2 < ch.length; k2++) if (Math.abs(ch[k2][j]) > th) { start = j; break outer; }
      var offset = Math.max(0, start / buf.sampleRate - 0.004);
      return { buffer: buf, offset: offset, gain: peak > 0 ? Math.min(4, 0.9 / peak) : 1 };
    });
  }

  /* ファイルを選ぶ */
  function pickFile() {
    return new Promise(function (res) {
      var inp = document.createElement("input");
      inp.type = "file"; inp.accept = "audio/*,.wav,.mp3,.m4a,.aac,.ogg,.flac,.aif,.aiff";
      inp.style.display = "none"; document.body.appendChild(inp);
      inp.onchange = function () {
        var f = inp.files && inp.files[0]; inp.remove();
        if (!f) { res(null); return; }
        if (f.size > 15 * 1024 * 1024) { res({ error: "ファイルが大きすぎます(15MBまで)" }); return; }
        f.arrayBuffer().then(function (b) { res({ name: f.name.replace(/\.[^.]+$/, ""), data: b }); });
      };
      inp.click();
    });
  }

  /* マイク録音:start() で開始、返り値の stop() で止めると {name, data} が返る。最長 maxSec 秒 */
  function record(maxSec) {
    if (!navigator.mediaDevices || !window.MediaRecorder) return Promise.reject("このブラウザは録音に対応していません");
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (stream) {
      var chunks = [], mr = new MediaRecorder(stream), done, timer;
      var result = new Promise(function (res) { done = res; });
      mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = function () {
        clearTimeout(timer);
        stream.getTracks().forEach(function (t) { t.stop(); });
        var blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
        blob.arrayBuffer().then(function (b) { done({ name: "録音 " + new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }), data: b }); });
      };
      mr.start();
      timer = setTimeout(function () { if (mr.state !== "inactive") mr.stop(); }, (maxSec || 5) * 1000);
      return { stop: function () { if (mr.state !== "inactive") mr.stop(); return result; }, result: result };
    });
  }

  window.NamiSampler = { save: save, load: load, remove: remove, keys: keys, decode: decode, pickFile: pickFile, record: record };
})();
