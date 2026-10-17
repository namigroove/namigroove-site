/* なみぐる！フルート(ベーム式)運指データと運指図(SVG)。運指表(sax.html)で使う
   運指は The Woodwind Fingering Guide の Basic Fingering Chart(Flute and Piccolo)を参考にしています */
(function () {
  "use strict";
  var KEYS = {
    tB:  { n: "親指Bキー", s: "e", x: 22, y: 70, rx: 6, ry: 9 },
    tBb: { n: "親指B♭キー", s: "e", x: 22, y: 90, rx: 5, ry: 7 },
    h1:  { n: "左手1(C)", s: "c", x: 60, y: 50, r: 10 },
    h2:  { n: "左手2(A)", s: "c", x: 60, y: 80, r: 10 },
    h3:  { n: "左手3(G)", s: "c", x: 60, y: 110, r: 10 },
    gs:  { n: "G♯キー(左小指)", s: "r", x: 84, y: 126, w: 16, h: 9 },
    tBbT: { n: "B♭トリルキー", s: "e", x: 82, y: 172, rx: 5, ry: 4 },
    h4:  { n: "右手1(F)", s: "c", x: 60, y: 186, r: 10 },
    tD:  { n: "Dトリルキー", s: "e", x: 82, y: 200, rx: 5, ry: 4 },
    h5:  { n: "右手2(E)", s: "c", x: 60, y: 214, r: 10 },
    tDs: { n: "D♯トリルキー", s: "e", x: 82, y: 228, rx: 5, ry: 4 },
    h6:  { n: "右手3(D)", s: "c", x: 60, y: 242, r: 10 },
    eb:  { n: "E♭キー(右小指)", s: "r", x: 46, y: 264, w: 18, h: 9 },
    cs:  { n: "C♯キー(足部管)", s: "r", x: 70, y: 264, w: 18, h: 9 },
    c:   { n: "Cキー(足部管)", s: "r", x: 46, y: 277, w: 18, h: 9 },
    b:   { n: "Bキー(足部管)", s: "r", x: 70, y: 277, w: 18, h: 9 }
  };
  var ORDER = Object.keys(KEYS);
  function f(keys, name) { var o = { keys: keys }; if (name) o.name = name; return o; }
  var L = ["tB", "h1", "h2", "h3"], R = ["h4", "h5", "h6"];
  var low = {
    59: [f(L.concat(R, ["b"]))],
    60: [f(L.concat(R, ["c"]))],
    61: [f(L.concat(R, ["cs"]))],
    62: [f(L.concat(R))],
    63: [f(L.concat(R, ["eb"]))],
    64: [f(L.concat(["h4", "h5", "eb"]))],
    65: [f(L.concat(["h4", "eb"]))],
    66: [f(L.concat(["h6", "eb"])), f(L.concat(["h5", "eb"]), "トリル用")],
    67: [f(L.concat(["eb"]))],
    68: [f(L.concat(["gs", "eb"]))],
    69: [f(["tB", "h1", "h2", "eb"])],
    70: [f(["tB", "h1", "h4", "eb"]), f(["tBb", "h1", "eb"], "親指B♭"), f(["tB", "h1", "tBbT", "eb"], "B♭トリルキー")],
    71: [f(["tB", "h1", "eb"])],
    72: [f(["h1", "eb"])],
    73: [f(["eb"], "右小指のE♭だけ")]
  };
  var F = {};
  Object.keys(low).forEach(function (k) { F[k] = low[k]; });
  F[74] = [f(["tB", "h2", "h3"].concat(R))];
  F[75] = [f(["tB", "h2", "h3"].concat(R, ["eb"]))];
  for (var m = 64; m <= 73; m++) F[m + 12] = low[m];
  F[86] = [f(["tB", "h2", "h3", "eb"])];
  F[87] = [f(L.concat(["gs"], R, ["eb"]))];
  F[88] = [f(["tB", "h1", "h2", "h4", "h5", "eb"])];
  F[89] = [f(["tB", "h1", "h3", "h4", "eb"])];
  F[90] = [f(["tB", "h1", "h3", "h6", "eb"])];
  F[91] = [f(["h1", "h2", "h3", "eb"])];
  F[92] = [f(["h2", "h3", "gs", "eb"])];
  F[93] = [f(["tB", "h2", "h4", "eb"])];
  F[94] = [f(["tB", "h4", "tD"])];
  F[95] = [f(["tB", "h1", "h3", "tDs"])];
  F[96] = [f(["h1", "h2", "h3", "gs", "h4"])];
  var INST = {
    fl: { n: "フルート", k: "C", d: 0 },
    picc: { n: "ピッコロ", k: "C", d: 12 }
  };
  function svg(keys, opt) {
    opt = opt || {};
    var on = {}; (keys || []).forEach(function (k) { on[k] = 1; });
    var s = '<svg class="sxf" viewBox="0 0 120 290" role="img" aria-label="' + (opt.label || "運指") + '">';
    s += '<line x1="60" y1="20" x2="60" y2="252" class="sxf-rod"/><line x1="40" y1="150" x2="80" y2="150" class="sxf-sep"/>';
    ORDER.forEach(function (id) {
      var k = KEYS[id], c = "sxf-k" + (on[id] ? " on" : ""), t = "<title>" + k.n + "</title>";
      if (k.s === "c") s += '<circle class="' + c + '" cx="' + k.x + '" cy="' + k.y + '" r="' + k.r + '">' + t + "</circle>";
      else if (k.s === "e") s += '<ellipse class="' + c + '" cx="' + k.x + '" cy="' + k.y + '" rx="' + k.rx + '" ry="' + k.ry + '">' + t + "</ellipse>";
      else s += '<rect class="' + c + '" x="' + (k.x - k.w / 2) + '" y="' + (k.y - k.h / 2) + '" width="' + k.w + '" height="' + k.h + '" rx="3">' + t + "</rect>";
    });
    if (!opt.bare) s += '<text x="60" y="30" class="sxf-t">左手</text><text x="60" y="162" class="sxf-t">右手</text>';
    return s + "</svg>";
  }
  function keyNames(keys) { return keys.map(function (k) { return KEYS[k].n; }); }
  window.NamiFlute = { KEYS: KEYS, F: F, A: {}, INST: INST, svg: svg, keyNames: keyNames, LOW: 59, HIGH: 96, ALT_LOW: 97, ALT_HIGH: 96 };
})();
