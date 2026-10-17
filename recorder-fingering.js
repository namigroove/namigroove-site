/* なみぐる！リコーダー運指データと運指図(SVG)。運指表(fingering.html)で使う
   運指は The Woodwind Fingering Guide の Basic Fingering Chart(Recorder)を参考にしています */
(function () {
  "use strict";
  /* 親指は左右の半分、6と7の穴は大小2つに分けて描く(半分ふさぐ運指があるため) */
  var KEYS = {
    tl:  { n: "裏の親指穴", s: "hl", x: 22, y: 60, r: 9 },
    tr:  { n: "裏の親指穴(半分あける=サミング)", s: "hr", x: 22, y: 60, r: 9 },
    h1:  { n: "左手1", s: "c", x: 60, y: 50, r: 10 },
    h2:  { n: "左手2", s: "c", x: 60, y: 80, r: 10 },
    h3:  { n: "左手3", s: "c", x: 60, y: 110, r: 10 },
    h4:  { n: "右手1", s: "c", x: 60, y: 160, r: 10 },
    h5:  { n: "右手2", s: "c", x: 60, y: 190, r: 10 },
    h6a: { n: "右手3(大きい穴)", s: "c", x: 56, y: 220, r: 8 },
    h6b: { n: "右手3(小さい穴)", s: "c", x: 72, y: 220, r: 4.5 },
    h7a: { n: "右手4(大きい穴)", s: "c", x: 56, y: 248, r: 8 },
    h7b: { n: "右手4(小さい穴)", s: "c", x: 72, y: 248, r: 4.5 },
    bell: { n: "管の先(ひざなどでふさぐ)", s: "r", x: 60, y: 276, w: 26, h: 8 }
  };
  var ORDER = Object.keys(KEYS);
  /* 運指の書き方:親指(T=ふさぐ Ø=半分 -=あける) 左手3つ | 右手4つ(x=ふさぐ .=あける X=2つともふさぐ h=小さい穴だけ) */
  function parse(code) {
    var k = [], t = code[0], i = 1;
    if (t === "T") k.push("tl", "tr"); else if (t === "Ø") k.push("tl");
    var rest = code.slice(1).replace("|", ""), names = ["h1", "h2", "h3", "h4", "h5", "h6", "h7"];
    for (i = 0; i < 7; i++) {
      var c = rest[i], n = names[i];
      if (i < 5) { if (c === "x") k.push(n); }
      else if (c === "X" || c === "x") k.push(n + "a", n + "b");
      else if (c === "h") k.push(n + "b");
    }
    if (code.indexOf("+bell") >= 0) k.push("bell");
    return k;
  }
  /* 一番低い音からの半音数 → [共通 or {e:イギリス式(バロック), g:ドイツ式(ジャーマン)}, 替え指] */
  var DATA = [
    ["Txxx|xxXX"], ["Txxx|xxXh"], ["Txxx|xxX."], ["Txxx|xxh."], ["Txxx|xx.."],
    [{ e: "Txxx|x.XX", g: "Txxx|x..." }], [{ e: "Txxx|.xX.", g: "Txxx|.xXX" }], ["Txxx|...."],
    [{ e: "Txx.|xxh.", g: "Txx.|xx.." }], ["Txx.|...."], ["Tx.x|x..."], ["Tx..|....", "T.xx|...."],
    ["T.x.|...."], ["-xx.|....", "T...|...."], ["-.x.|...."], ["-.xx|xxX."], ["Øxxx|xx.."],
    [{ e: "Øxxx|x.X.", g: "Øxxx|x..." }], [{ e: "Øxxx|.x..", g: "Øxxx|.x.X" }], ["Øxxx|...."],
    ["Øxx.|x..."], ["Øxx.|...."], ["Øxx.|xxX."], ["Øxx.|xx.."], ["Øx..|xx.."],
    ["Øx.x|x.X.+bell"], ["Øx.x|x.X."]
  ];
  var INST = {
    sg: { n: "ソプラノ(ジャーマン)", k: "C", d: 12, low: 60, sys: "g" },
    ab: { n: "アルト(バロック)", k: "F", d: 0, low: 65, sys: "e" },
    sb: { n: "ソプラノ(バロック)", k: "C", d: 12, low: 60, sys: "e", more: true },
    ag: { n: "アルト(ジャーマン)", k: "F", d: 0, low: 65, sys: "g", more: true }
  };
  var M = { KEYS: KEYS, F: {}, A: {}, INST: INST, LOW: 60, HIGH: 86, ALT_LOW: 87, ALT_HIGH: 86 };
  M.setInst = function (id) {
    var I = INST[id] || INST.sg, F = {};
    DATA.forEach(function (row, r) {
      F[I.low + r] = row.map(function (v, i) {
        var code = typeof v === "string" ? v : v[I.sys];
        var o = { keys: parse(code) };
        if (i > 0) o.name = "替え指";
        if (code[0] === "Ø" && i === 0) o.name = "サミング";
        return o;
      });
    });
    M.F = F; M.LOW = I.low; M.HIGH = I.low + DATA.length - 1; M.ALT_LOW = M.HIGH + 1; M.ALT_HIGH = M.HIGH;
  };
  M.setInst("sg");
  M.svg = function (keys, opt) {
    opt = opt || {};
    var on = {}; (keys || []).forEach(function (k) { on[k] = 1; });
    var s = '<svg class="sxf" viewBox="0 0 120 290" role="img" aria-label="' + (opt.label || "運指") + '">';
    s += '<line x1="60" y1="20" x2="60" y2="270" class="sxf-rod"/><line x1="40" y1="135" x2="80" y2="135" class="sxf-sep"/>';
    ORDER.forEach(function (id) {
      var k = KEYS[id], c = "sxf-k" + (on[id] ? " on" : ""), t = "<title>" + k.n + "</title>";
      if (k.s === "c") s += '<circle class="' + c + '" cx="' + k.x + '" cy="' + k.y + '" r="' + k.r + '">' + t + "</circle>";
      else if (k.s === "hl") s += '<path class="' + c + '" d="M' + k.x + ' ' + (k.y - k.r) + ' A' + k.r + ' ' + k.r + ' 0 0 0 ' + k.x + ' ' + (k.y + k.r) + 'Z">' + t + "</path>";
      else if (k.s === "hr") s += '<path class="' + c + '" d="M' + k.x + ' ' + (k.y - k.r) + ' A' + k.r + ' ' + k.r + ' 0 0 1 ' + k.x + ' ' + (k.y + k.r) + 'Z">' + t + "</path>";
      else s += '<rect class="' + c + '" x="' + (k.x - k.w / 2) + '" y="' + (k.y - k.h / 2) + '" width="' + k.w + '" height="' + k.h + '" rx="3" stroke-dasharray="3 2">' + t + "</rect>";
    });
    if (!opt.bare) s += '<text x="22" y="82" class="sxf-t">裏</text><text x="60" y="30" class="sxf-t">左手</text><text x="60" y="146" class="sxf-t">右手</text>';
    return s + "</svg>";
  };
  M.keyNames = function (keys) {
    var out = [], has = {}; keys.forEach(function (k) { has[k] = 1; });
    if (has.tl && has.tr) out.push("裏の親指穴"); else if (has.tl) out.push("裏の親指穴を半分(サミング)");
    ["h1", "h2", "h3", "h4", "h5"].forEach(function (k) { if (has[k]) out.push(KEYS[k].n); });
    ["6", "7"].forEach(function (n) { if (has["h" + n + "a"]) out.push("右手" + (n === "6" ? "3" : "4")); else if (has["h" + n + "b"]) out.push("右手" + (n === "6" ? "3" : "4") + "を半分(小さい穴)"); });
    if (has.bell) out.push("管の先をふさぐ");
    return out;
  };
  window.NamiRec = M;
})();
