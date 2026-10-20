/* なみぐる!ファゴット(ドイツ式)運指データと運指図(SVG)。運指表(fingering.html)で使う
   運指は The Woodwind Fingering Guide の Basic Fingering Chart(Bassoon)の表記を参考にしています。
   表記: 「|」の左が左手、右が右手。1・2・3=指で穴をふさぐ、-=開ける、¼・½・¾=穴の一部だけふさぐ */
(function () {
  "use strict";
  var KEYS = {
    tBb: { n: "左親指:B♭キー(低音)", s: "r", x: 10, y: 30, w: 16, h: 9 },
    tB:  { n: "左親指:Bキー(低音)", s: "r", x: 10, y: 42, w: 16, h: 9 },
    tC:  { n: "左親指:Cキー(低音)", s: "r", x: 10, y: 54, w: 16, h: 9 },
    tD:  { n: "左親指:Dキー(低音)", s: "r", x: 10, y: 66, w: 16, h: 9 },
    fd:  { n: "左親指:Dフリックキー", s: "r", x: 30, y: 30, w: 16, h: 9 },
    fb:  { n: "左親指:Bフリックキー", s: "r", x: 30, y: 42, w: 16, h: 9 },
    fa:  { n: "左親指:Aフリックキー", s: "r", x: 30, y: 54, w: 16, h: 9 },
    tCs: { n: "左親指:C♯キー", s: "r", x: 30, y: 66, w: 16, h: 9 },
    tW:  { n: "左親指:ウィスパーキー(W)", s: "r", x: 30, y: 78, w: 16, h: 9 },
    h1:  { n: "左手1(人差し指)", s: "c", x: 82, y: 58, r: 10 },
    h1q: { n: "左手1を¼だけふさぐ", s: "n" },
    h1h: { n: "左手1を½だけふさぐ", s: "n" },
    h1t: { n: "左手1を¾だけふさぐ", s: "n" },
    h2:  { n: "左手2(中指)", s: "c", x: 82, y: 90, r: 10 },
    h3:  { n: "左手3(薬指・リング)", s: "c", x: 82, y: 122, r: 10 },
    lEb: { n: "左小指:E♭キー", s: "r", x: 108, y: 138, w: 18, h: 9 },
    lCs: { n: "左小指:C♯キー", s: "r", x: 108, y: 150, w: 18, h: 9 },
    rtBb:{ n: "右親指:B♭キー", s: "r", x: 12, y: 200, w: 18, h: 9 },
    rtE: { n: "右親指:Eキー", s: "r", x: 12, y: 212, w: 18, h: 9 },
    rtFs:{ n: "右親指:F♯キー", s: "r", x: 12, y: 224, w: 18, h: 9 },
    rtGs:{ n: "右親指:G♯キー", s: "r", x: 12, y: 236, w: 18, h: 9 },
    h4:  { n: "右手1(人差し指)", s: "c", x: 82, y: 200, r: 10 },
    h5:  { n: "右手2(中指)", s: "c", x: 82, y: 232, r: 10 },
    rBb: { n: "B♭スライバーキー(右2と3の間)", s: "e", x: 106, y: 247, rx: 6, ry: 4 },
    h6:  { n: "右手3(薬指)", s: "c", x: 82, y: 264, r: 10 },
    rF:  { n: "右小指:Fキー(低音)", s: "r", x: 60, y: 292, w: 20, h: 9 },
    rFs: { n: "右小指:F♯キー", s: "r", x: 84, y: 292, w: 20, h: 9 },
    rGs: { n: "右小指:G♯キー", s: "r", x: 108, y: 292, w: 20, h: 9 }
  };
  var ORDER = Object.keys(KEYS).filter(function (k) { return KEYS[k].s !== "n"; });
  var TH = { Bb: "tBb", B: "tB", C: "tC", D: "tD", W: "tW", "C#": "tCs", a: "fa", b: "fb", d: "fd" };
  var RT = { Bb: "rtBb", E: "rtE", "F#": "rtFs", "G#": "rtGs" }, RPK = { F: "rF", "F#": "rFs", "G#": "rGs" };
  var PART = { "¼": "h1q", "½": "h1h", "¾": "h1t" };
  function P(str, name) {
    var keys = [], a = str.split("|"), fc = 0;
    (a[0].replace(/\s/g, "").match(/Bb|C#|Eb|[¼½¾0-3\-]|[BCDWabd]/g) || []).forEach(function (k) {
      if (/[¼½¾0-3\-]/.test(k)) { fc++; if (PART[k]) keys.push(PART[k], "h1"); else if (k !== "-") keys.push("h" + fc); }
      else if (fc < 3 && TH[k]) keys.push(TH[k]);
      else if (fc === 3 && k === "Eb") keys.push("lEb");
      else if (fc === 3 && k === "C#") keys.push("lCs");
    });
    fc = 0;
    (a[1].replace(/\s/g, "").match(/Bb|F#|G#|[0-3\-]|[EF]/g) || []).forEach(function (k) {
      if (/[0-3\-]/.test(k)) { fc++; if (k !== "-") keys.push("h" + (3 + fc)); }
      else if (fc === 0 && RT[k]) keys.push(RT[k]);
      else if (fc === 2 && k === "Bb") keys.push("rBb");
      else if (fc === 3 && RPK[k]) keys.push(RPK[k]);
    });
    var o = { keys: keys }; if (name) o.name = name; return o;
  }
  var F = {
    34: [P("Bb B C D 123|E 123F")],
    35: [P("B C D 123|E 123F")],
    36: [P("C D 123|E 123F")],
    37: [P("C D 123C#|E 123F")],
    38: [P("D 123|E 123F")],
    39: [P("D 123Eb|E 123F")],
    40: [P("W 123|E 123F")],
    41: [P("W 123|123F")],
    42: [P("W 123|F# 123F"), P("W 123|123F F#", "右小指F♯")],
    43: [P("W 123|123")],
    44: [P("W 123|123G#"), P("W 123|G# 123", "右親指G♯")],
    45: [P("W 123|12-")],
    46: [P("W 123|Bb 12-"), P("W 123|12Bb-", "スライバー")],
    47: [P("W 123|1--")],
    48: [P("W 123|---")],
    49: [P("C# D W 123|---")],
    50: [P("W 12-|---")],
    51: [P("W 1-3|---"), P("W 1-3|Bb -2-", "弱音向き"), P("W 1-3Eb|Bb -2-"), P("C# W 12-|---", "D3とのトリル用")],
    52: [P("W 1--|---")],
    53: [P("W ---|---")],
    54: [P("W ¼23|F# 123F", "左手1を¼ふさぐ"), P("W ¼23|123F F#", "右小指F♯")],
    55: [P("W ½23Eb|123", "左手1を½ふさぐ")],
    56: [P("W ¾23|123G#", "左手1を¾ふさぐ"), P("W ¾23|G# 123", "右親指G♯")],
    57: [P("123|12-"), P("a 123|12-", "Aフリック(スラー用)")],
    58: [P("123|Bb 12-"), P("a 123|Bb 12-", "Aフリック"), P("b 123|Bb 12-", "Bフリック"), P("123|12Bb-", "スライバー")],
    59: [P("123|1--"), P("b 123|1--", "Bフリック")],
    60: [P("123|---"), P("b 123|---", "Bフリック")],
    61: [P("D C# 123|---"), P("C# 123|-23F", "スラー用")],
    62: [P("12-|---"), P("d 12-|---", "Dフリック"), P("b 12-|---", "Bフリック")],
    63: [P("12-|123")],
    64: [P("1-3Eb|123")],
    65: [P("1-3Eb|12-")],
    66: [P("-23Eb|Bb 12-"), P("-23Eb|12-F", "替え指")],
    67: [P("W ½23Eb|1--F", "左手1を½ふさぐ")],
    68: [P("W ¾23Eb|--3", "左手1を¾ふさぐ")],
    69: [P("a C# 123Eb|--3")],
    70: [P("a C# 123Eb|12-F")]
  };
  var INST = { bn: { n: "ファゴット", k: "C", d: 0 } };
  function svg(keys, opt) {
    opt = opt || {};
    var on = {}; (keys || []).forEach(function (k) { on[k] = 1; });
    var s = '<svg class="sxf" viewBox="0 0 140 316" role="img" aria-label="' + (opt.label || "運指") + '">';
    s += '<line x1="82" y1="40" x2="82" y2="276" class="sxf-rod"/><line x1="4" y1="170" x2="136" y2="170" class="sxf-sep"/>';
    ORDER.forEach(function (id) {
      var k = KEYS[id], part = id === "h1" && (on.h1q || on.h1h || on.h1t), c = "sxf-k" + (on[id] ? " on" : ""), t = "<title>" + k.n + "</title>";
      if (k.s === "c") s += '<circle class="' + c + '" cx="' + k.x + '" cy="' + k.y + '" r="' + k.r + '"' + (part ? ' fill-opacity=".4"' : "") + ">" + t + "</circle>" + (part ? '<text x="' + k.x + '" y="' + (k.y + 3.5) + '" class="sxf-t" style="font-size:10px;fill:var(--ink)">' + (on.h1q ? "¼" : on.h1h ? "½" : "¾") + "</text>" : "");
      else if (k.s === "e") s += '<ellipse class="' + c + '" cx="' + k.x + '" cy="' + k.y + '" rx="' + k.rx + '" ry="' + k.ry + '">' + t + "</ellipse>";
      else s += '<rect class="' + c + '" x="' + (k.x - k.w / 2) + '" y="' + (k.y - k.h / 2) + '" width="' + k.w + '" height="' + k.h + '" rx="3">' + t + "</rect>";
    });
    if (!opt.bare) s += '<text x="70" y="14" class="sxf-t">左手</text><text x="70" y="184" class="sxf-t">右手</text>';
    return s + "</svg>";
  }
  function keyNames(keys) { return keys.filter(function (k) { return KEYS[k]; }).map(function (k) { return KEYS[k].n; }); }
  window.NamiBassoon = { KEYS: KEYS, F: F, A: {}, INST: INST, svg: svg, keyNames: keyNames, LOW: 34, HIGH: 70, ALT_LOW: 71, ALT_HIGH: 70 };
})();
