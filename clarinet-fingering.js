/* なみぐる！クラリネット(ベーム式)運指データと運指図(SVG)。運指表(sax.html)で使う
   運指は The Woodwind Fingering Guide の Basic Fingering Chart(Boehm-System Clarinet)を参考にしています */
(function () {
  "use strict";
  var KEYS = {
    reg: { n: "レジスターキー(親指)", s: "e", x: 20, y: 52, rx: 6, ry: 9 },
    th:  { n: "親指の穴", s: "c", x: 22, y: 76, r: 8 },
    A:   { n: "Aキー", s: "r", x: 60, y: 24, w: 20, h: 8 },
    gs:  { n: "G♯キー(サイド)", s: "e", x: 80, y: 38, rx: 6, ry: 5 },
    h1:  { n: "左手1", s: "c", x: 60, y: 52, r: 10 },
    h2:  { n: "左手2", s: "c", x: 60, y: 80, r: 10 },
    sEb: { n: "E♭/B♭スライバーキー", s: "r", x: 78, y: 95, w: 7, h: 12 },
    h3:  { n: "左手3", s: "c", x: 60, y: 110, r: 10 },
    cs:  { n: "C♯/G♯キー(左小指)", s: "r", x: 30, y: 122, w: 18, h: 9 },
    lE:  { n: "E/Bキー(左小指)", s: "r", x: 30, y: 134, w: 18, h: 9 },
    lFs: { n: "F♯/C♯キー(左小指)", s: "r", x: 30, y: 146, w: 18, h: 9 },
    lF:  { n: "F/Cキー(左小指)", s: "r", x: 30, y: 158, w: 18, h: 9 },
    s1:  { n: "サイドキー1", s: "e", x: 100, y: 176, rx: 5, ry: 6 },
    s2:  { n: "サイドキー2", s: "e", x: 100, y: 190, rx: 5, ry: 6 },
    s3:  { n: "サイドキー3", s: "e", x: 100, y: 204, rx: 5, ry: 6 },
    s4:  { n: "サイドキー4(E♭/B♭)", s: "e", x: 100, y: 218, rx: 5, ry: 6 },
    h4:  { n: "右手1", s: "c", x: 60, y: 186, r: 10 },
    h5:  { n: "右手2", s: "c", x: 60, y: 214, r: 10 },
    sB:  { n: "B/F♯スライバーキー", s: "r", x: 78, y: 228, w: 7, h: 12 },
    h6:  { n: "右手3", s: "c", x: 60, y: 242, r: 10 },
    rE:  { n: "E/Bキー(右小指)", s: "r", x: 50, y: 266, w: 18, h: 9 },
    rF:  { n: "F/Cキー(右小指)", s: "r", x: 72, y: 266, w: 18, h: 9 },
    rFs: { n: "F♯/C♯キー(右小指)", s: "r", x: 50, y: 278, w: 18, h: 9 },
    rGs: { n: "G♯/D♯キー(右小指)", s: "r", x: 72, y: 278, w: 18, h: 9 }
  };
  var ORDER = Object.keys(KEYS);
  var L = ["th", "h1", "h2", "h3"], R6 = ["h4", "h5", "h6"];
  function f(keys, name) { var o = { keys: keys }; if (name) o.name = name; return o; }
  /* 低音域(シャリュモー)〜のど音 */
  var F = {
    52: [f(L.concat(R6, ["lE"])), f(L.concat(R6, ["rE"]), "右小指E")],
    53: [f(L.concat(R6, ["rF"])), f(L.concat(R6, ["lF"]), "左小指F")],
    54: [f(L.concat(R6, ["lFs"])), f(L.concat(R6, ["rFs"]), "右小指F♯")],
    55: [f(L.concat(R6))],
    56: [f(L.concat(R6, ["rGs"]))],
    57: [f(L.concat(["h4", "h5"]))],
    58: [f(L.concat(["h4"]))],
    59: [f(L.concat(["h5"]))],
    60: [f(L.slice())],
    61: [f(L.concat(["cs"]))],
    62: [f(["th", "h1", "h2"])],
    63: [f(["th", "h1", "h2", "s4"]), f(["th", "h1", "h2", "sEb"], "スライバーE♭"), f(["th", "h1", "h4"], "1-1")],
    64: [f(["th", "h1"])],
    65: [f(["th"])],
    66: [f(["h1"])],
    67: [f([], "すべて開放")],
    68: [f(["gs"])],
    69: [f(["A"])],
    70: [f(["reg", "A"])]
  };
  /* 高音域(クラリオン):低音域の12度上。レジスターキーを足す */
  var CL = {
    71: [f(["reg"].concat(L, R6, ["lE"])), f(["reg"].concat(L, R6, ["rE"]), "右小指B")],
    72: [f(["reg"].concat(L, R6, ["rF"])), f(["reg"].concat(L, R6, ["lF"]), "左小指C")],
    73: [f(["reg"].concat(L, R6, ["lFs"])), f(["reg"].concat(L, R6, ["rFs"]), "右小指C♯")],
    74: [f(["reg"].concat(L, R6))],
    75: [f(["reg"].concat(L, R6, ["rGs"]))],
    76: [f(["reg"].concat(L, ["h4", "h5"]))],
    77: [f(["reg"].concat(L, ["h4"]))],
    78: [f(["reg"].concat(L, ["h5"])), f(["reg"].concat(L, ["h4", "sB"]), "スライバーF♯")],
    79: [f(["reg"].concat(L))],
    80: [f(["reg"].concat(L, ["cs"])), f(["reg", "th", "h1", "h2", "h4", "h5"], "替え指")],
    81: [f(["reg", "th", "h1", "h2"])],
    82: [f(["reg", "th", "h1", "h2", "s4"]), f(["reg", "th", "h1", "h2", "sEb"], "スライバーB♭"), f(["reg", "th", "h1", "h4"], "1-1")],
    83: [f(["reg", "th", "h1"])],
    84: [f(["reg", "th"])]
  };
  Object.keys(CL).forEach(function (k) { F[k] = CL[k]; });
  /* アルティッシモ:代表的な一例 */
  var A = {
    85: [f(["reg", "th", "h2", "h3", "h4", "h5"])],
    86: [f(["reg", "th", "h2", "h3", "h4", "rGs"])],
    87: [f(["reg", "th", "h2", "h3", "h4", "sB", "rGs"])],
    88: [f(["reg", "th", "h2", "h3", "rGs"])],
    89: [f(["reg", "th", "h2", "h3", "cs", "rGs"])],
    90: [f(["reg", "th", "h2", "rGs"])],
    91: [f(["reg", "th", "h2", "h4", "h5", "rGs"])]
  };
  var INST = {
    bb: { n: "B♭クラリネット", k: "B♭", d: -2 },
    a: { n: "Aクラリネット", k: "A", d: -3 },
    eb: { n: "E♭クラリネット", k: "E♭", d: 3 },
    bass: { n: "バスクラリネット", k: "B♭", d: -14 }
  };
  function svg(keys, opt) {
    opt = opt || {};
    var on = {}; (keys || []).forEach(function (k) { on[k] = 1; });
    var s = '<svg class="sxf" viewBox="0 0 120 290" role="img" aria-label="' + (opt.label || "運指") + '">';
    s += '<line x1="60" y1="20" x2="60" y2="252" class="sxf-rod"/><line x1="40" y1="166" x2="80" y2="166" class="sxf-sep"/>';
    ORDER.forEach(function (id) {
      var k = KEYS[id], c = "sxf-k" + (on[id] ? " on" : ""), t = "<title>" + k.n + "</title>";
      if (k.s === "c") s += '<circle class="' + c + '" cx="' + k.x + '" cy="' + k.y + '" r="' + k.r + '">' + t + "</circle>";
      else if (k.s === "e") s += '<ellipse class="' + c + '" cx="' + k.x + '" cy="' + k.y + '" rx="' + k.rx + '" ry="' + k.ry + '">' + t + "</ellipse>";
      else s += '<rect class="' + c + '" x="' + (k.x - k.w / 2) + '" y="' + (k.y - k.h / 2) + '" width="' + k.w + '" height="' + k.h + '" rx="3">' + t + "</rect>";
    });
    if (!opt.bare) s += '<text x="60" y="14" class="sxf-t">左手</text><text x="60" y="176" class="sxf-t">右手</text>';
    return s + "</svg>";
  }
  function keyNames(keys) { return keys.map(function (k) { return KEYS[k].n; }); }
  window.NamiClar = { KEYS: KEYS, F: F, A: A, INST: INST, svg: svg, keyNames: keyNames, LOW: 52, HIGH: 84, ALT_LOW: 85, ALT_HIGH: 91 };
})();
