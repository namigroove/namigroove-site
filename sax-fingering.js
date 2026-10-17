/* なみぐる！サックス運指データと運指図(SVG)。運指表(fingering.html)で使う */
(function () {
  "use strict";
  /* キーの位置(viewBox 0 0 120 300)。shape: c=丸, e=楕円(rx,ry), r=角丸 */
  var KEYS = {
    oct: { n: "オクターブキー", s: "e", x: 22, y: 92, rx: 6, ry: 9 },
    pF:  { n: "パームキー F", s: "e", x: 20, y: 30, rx: 6, ry: 8 },
    pD:  { n: "パームキー D", s: "e", x: 14, y: 48, rx: 6, ry: 8 },
    pEb: { n: "パームキー E♭", s: "e", x: 20, y: 66, rx: 6, ry: 8 },
    fF:  { n: "フロントF", s: "e", x: 82, y: 34, rx: 7, ry: 5 },
    k1:  { n: "左手1(B)", s: "c", x: 60, y: 50, r: 11 },
    bis: { n: "ビスキー", s: "c", x: 60, y: 68, r: 4 },
    k2:  { n: "左手2(A)", s: "c", x: 60, y: 86, r: 11 },
    k3:  { n: "左手3(G)", s: "c", x: 60, y: 114, r: 11 },
    gs:  { n: "G♯キー", s: "r", x: 82, y: 104, w: 16, h: 10 },
    cs:  { n: "Low C♯", s: "r", x: 84, y: 118, w: 16, h: 9 },
    lB:  { n: "Low B", s: "r", x: 84, y: 129, w: 16, h: 9 },
    lBb: { n: "Low B♭", s: "r", x: 84, y: 140, w: 16, h: 9 },
    sE:  { n: "サイドキー(ハイE)", s: "e", x: 100, y: 166, rx: 5, ry: 8 },
    sC:  { n: "サイドC", s: "e", x: 100, y: 184, rx: 5, ry: 8 },
    sBb: { n: "サイドB♭", s: "e", x: 100, y: 202, rx: 5, ry: 8 },
    hFs: { n: "ハイF♯キー", s: "e", x: 100, y: 222, rx: 5, ry: 7 },
    k4:  { n: "右手1(F)", s: "c", x: 60, y: 176, r: 11 },
    k5:  { n: "右手2(E)", s: "c", x: 60, y: 204, r: 11 },
    k6:  { n: "右手3(D)", s: "c", x: 60, y: 232, r: 11 },
    lEb: { n: "Low E♭", s: "r", x: 70, y: 256, w: 18, h: 10 },
    lC:  { n: "Low C", s: "r", x: 70, y: 270, w: 18, h: 10 }
  };
  var ORDER = ["pF", "pD", "pEb", "oct", "fF", "k1", "bis", "k2", "k3", "gs", "cs", "lB", "lBb", "sE", "sC", "sBb", "hFs", "k4", "k5", "k6", "lEb", "lC"];

  /* 運指(記譜音のMIDI番号 → [{name, keys}])。最初のものが基本の運指 */
  var L = ["k1", "k2", "k3"], R = ["k4", "k5", "k6"];
  var low = {
    58: [{ keys: L.concat(R, ["lBb"]) }],
    59: [{ keys: L.concat(R, ["lB"]) }],
    60: [{ keys: L.concat(R, ["lC"]) }],
    61: [{ keys: L.concat(R, ["cs"]) }],
    62: [{ keys: L.concat(R) }],
    63: [{ keys: L.concat(R, ["lEb"]) }],
    64: [{ keys: L.concat(["k4", "k5"]) }],
    65: [{ keys: L.concat(["k4"]) }],
    66: [{ keys: L.concat(["k5"]) }],
    67: [{ keys: L.slice() }],
    68: [{ keys: L.concat(["gs"]) }],
    69: [{ keys: ["k1", "k2"] }],
    70: [{ name: "ビスB♭", keys: ["k1", "bis"] }, { name: "1-1", keys: ["k1", "k4"] }, { name: "サイドB♭", keys: ["k1", "sBb"] }],
    71: [{ keys: ["k1"] }],
    72: [{ keys: ["k2"] }, { name: "サイドC", keys: ["k1", "sC"] }],
    73: [{ name: "すべて開放", keys: [] }]
  };
  var F = {};
  Object.keys(low).forEach(function (m) { F[m] = low[m]; });
  for (var m = 62; m <= 73; m++) {
    F[m + 12] = low[m].map(function (f) { return { name: f.name === "すべて開放" ? "オクターブキーのみ" : f.name, keys: ["oct"].concat(f.keys) }; });
  }
  var top = ["oct", "pD", "pEb"];
  F[86] = [{ keys: ["oct", "pD"] }];
  F[87] = [{ keys: top.slice() }];
  F[88] = [{ keys: top.concat(["sE"]) }];
  F[89] = [{ keys: top.concat(["sE", "pF"]) }, { name: "フロントF", keys: ["oct", "fF", "k1"] }];
  F[90] = [{ keys: top.concat(["sE", "pF", "hFs"]) }];
  /* フラジオ:代表的な一例(Woodwind Fingering Guide の最初に載っている運指) */
  var A = {
    91: [{ keys: ["oct", "k1", "k3", "k6"] }],
    92: [{ keys: ["oct", "k1", "k3"] }],
    93: [{ keys: ["oct", "k2", "k3"] }],
    94: [{ keys: ["oct", "k3", "sC"] }],
    95: [{ keys: ["oct", "pD"] }],
    96: [{ keys: ["oct", "pD", "pEb"] }],
    97: [{ keys: ["oct", "pD", "pEb", "sE"] }]
  };

  /* 楽器:記譜音から実音までの半音数 */
  var INST = {
    alto: { n: "アルト", k: "E♭", d: -9 },
    tenor: { n: "テナー", k: "B♭", d: -14 },
    soprano: { n: "ソプラノ", k: "B♭", d: -2 },
    bari: { n: "バリトン", k: "E♭", d: -21 }
  };

  function svg(keys, opt) {
    opt = opt || {};
    var on = {}; (keys || []).forEach(function (k) { on[k] = 1; });
    var s = '<svg class="sxf" viewBox="0 0 120 290" role="img" aria-label="' + (opt.label || "運指") + '">';
    s += '<line x1="60" y1="20" x2="60" y2="246" class="sxf-rod"/><line x1="40" y1="150" x2="80" y2="150" class="sxf-sep"/>';
    ORDER.forEach(function (id) {
      var k = KEYS[id], c = "sxf-k" + (on[id] ? " on" : ""), t = '<title>' + k.n + '</title>';
      if (k.s === "c") s += '<circle class="' + c + '" cx="' + k.x + '" cy="' + k.y + '" r="' + k.r + '">' + t + '</circle>';
      else if (k.s === "e") s += '<ellipse class="' + c + '" cx="' + k.x + '" cy="' + k.y + '" rx="' + k.rx + '" ry="' + k.ry + '">' + t + '</ellipse>';
      else s += '<rect class="' + c + '" x="' + (k.x - k.w / 2) + '" y="' + (k.y - k.h / 2) + '" width="' + k.w + '" height="' + k.h + '" rx="3">' + t + '</rect>';
    });
    if (!opt.bare) s += '<text x="60" y="18" class="sxf-t">左手</text><text x="60" y="162" class="sxf-t">右手</text>';
    return s + "</svg>";
  }
  function keyNames(keys) { return keys.map(function (k) { return KEYS[k].n; }); }

  window.NamiSax = { KEYS: KEYS, F: F, A: A, INST: INST, svg: svg, keyNames: keyNames, LOW: 58, HIGH: 90, ALT_LOW: 91, ALT_HIGH: 97 };
})();
