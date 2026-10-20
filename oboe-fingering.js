/* なみぐる!オーボエ(コンセルヴァトワール式)運指データと運指図(SVG)。運指表(fingering.html)で使う
   運指は The Woodwind Fingering Guide の Basic Fingering Chart(Oboe)の表記を参考にしています。
   表記: 「|」の左が左手、右が右手。1・2・3=指で穴をふさぐ、-=開ける、0=リングだけ押して穴は開ける、I・II=オクターブキー */
(function () {
  "use strict";
  var KEYS = {
    o1:  { n: "第1オクターブキー(左親指)", s: "e", x: 20, y: 44, rx: 6, ry: 9 },
    h1:  { n: "左手1(人差し指)", s: "c", x: 60, y: 56, r: 10 },
    h1v: { n: "左手1のハーフホール(リングだけ押して穴は開ける)", s: "n" },
    o2:  { n: "第2オクターブキー(左人差し指の横)", s: "e", x: 88, y: 50, rx: 5, ry: 6 },
    tB:  { n: "Bトリルキー(左1と2の間)", s: "e", x: 88, y: 74, rx: 5, ry: 5 },
    h2:  { n: "左手2(中指)", s: "c", x: 60, y: 90, r: 10 },
    h3:  { n: "左手3(薬指)", s: "c", x: 60, y: 124, r: 10 },
    lF:  { n: "Fキー(左小指)", s: "r", x: 28, y: 146, w: 20, h: 8 },
    lGs: { n: "G♯キー(左小指)", s: "r", x: 28, y: 157, w: 20, h: 8 },
    lEb: { n: "E♭キー(左小指)", s: "r", x: 28, y: 168, w: 20, h: 8 },
    lB:  { n: "低いBキー(左小指)", s: "r", x: 28, y: 179, w: 20, h: 8 },
    lBb: { n: "低いB♭キー(左小指)", s: "r", x: 28, y: 190, w: 20, h: 8 },
    rA:  { n: "Aキー(右手の上のサイドキー)", s: "e", x: 92, y: 216, rx: 5, ry: 5 },
    rGs: { n: "G♯キー(右手の下のサイドキー)", s: "e", x: 92, y: 232, rx: 5, ry: 5 },
    h4:  { n: "右手1(人差し指)", s: "c", x: 60, y: 224, r: 10 },
    h5:  { n: "右手2(中指)", s: "c", x: 60, y: 258, r: 10 },
    rF:  { n: "Fキー(右2と3の間。Fの基本の運指)", s: "e", x: 88, y: 276, rx: 5, ry: 5 },
    h6:  { n: "右手3(薬指)", s: "c", x: 60, y: 292, r: 10 },
    rC:  { n: "低いCキー(右小指)", s: "r", x: 52, y: 314, w: 20, h: 8 },
    rCs: { n: "低いC♯キー(右小指)", s: "r", x: 52, y: 325, w: 20, h: 8 },
    rEb: { n: "低いE♭キー(右小指)", s: "r", x: 52, y: 336, w: 20, h: 8 }
  };
  var ORDER = Object.keys(KEYS).filter(function (k) { return KEYS[k].s !== "n"; });
  var LP = { Bb: "lBb", B: "lB", Eb: "lEb", F: "lF", "G#": "lGs" }, RP = { C: "rC", "C#": "rCs", Eb: "rEb" };
  /* WFGの表記 → キーの並び */
  function P(str, name) {
    var keys = [], a = str.split("|"), L = a[0], R = a[1], m;
    if ((m = /^\s*(II|I)\s*/.exec(L))) { keys.push(m[1] === "II" ? "o2" : "o1"); L = L.slice(m[0].length); }
    var fc = 0, t;
    (L.replace(/\s/g, "").match(/Bb|G#|Eb|[0-3\-]|B|F/g) || []).forEach(function (k) {
      if (/[0-3\-]/.test(k)) { fc++; if (k === "0") keys.push("h" + fc + "v", "h" + fc); else if (k !== "-") keys.push("h" + fc); }
      else if (fc === 1 && k === "B") keys.push("tB");
      else if (fc === 3 && LP[k]) keys.push(LP[k]);
    });
    fc = 0;
    (R.replace(/\s/g, "").match(/G#|C#|Eb|[0-3\-]|A|C|F/g) || []).forEach(function (k) {
      if (/[0-3\-]/.test(k)) { fc++; if (k !== "-") keys.push("h" + (3 + fc)); }
      else if (fc === 0 && k === "A") keys.push("rA");
      else if (fc === 0 && k === "G#") keys.push("rGs");
      else if (fc === 2 && k === "F") keys.push("rF");
      else if (fc === 3 && RP[k]) keys.push(RP[k]);
    });
    var o = { keys: keys }; if (name) o.name = name; return o;
  }
  var F = {
    58: [P("123Bb|123C")],
    59: [P("123B|123C")],
    60: [P("123|123C")],
    61: [P("123|123C#")],
    62: [P("123|123")],
    63: [P("123|123Eb"), P("123Eb|123", "左のE♭")],
    64: [P("123|12-")],
    65: [P("123|12F-"), P("123F|12-", "左小指F"), P("123|1-3", "右手1+3"), P("123|1-3Eb", "右手1+3+E♭")],
    66: [P("123|1--")],
    67: [P("123|---")],
    68: [P("123G#|---"), P("123|G#---", "トリル用(開放)"), P("123|A---", "トリル用(閉鎖)")],
    69: [P("12-|---")],
    70: [P("12-|1--"), P("1B2-|1--", "Bとのトリル用")],
    71: [P("1--|---"), P("1B--|1--", "B♭とのトリル用")],
    72: [P("1--|1--")],
    73: [P("023|123C#")],
    74: [P("023|123")],
    75: [P("023|123Eb")],
    76: [P("I 123|12-")],
    77: [P("I 123|12F-"), P("I 123F|12-", "左小指F"), P("I 123|1-3", "右手1+3"), P("I 123|1-3Eb", "右手1+3+E♭")],
    78: [P("I 123|1--")],
    79: [P("I 123|---")],
    80: [P("I 123G#|---"), P("I 123|G#---", "トリル用(開放)"), P("I 123|A---", "トリル用(閉鎖)")],
    81: [P("II12-|---")],
    82: [P("II12-|1--")],
    83: [P("II1--|---"), P("II1B--|1--", "B♭とのトリル用")],
    84: [P("II1--|1--")]
  };
  /* 最高音域(C♯6〜F6):楽器や奏者によって差が大きいので代表的な一例 */
  var A = {
    85: [P("-23|1--C")],
    86: [P("023|-2-C", "音程が良い")],
    87: [P("023B|-23"), P("023|-23Eb", "替え指")],
    88: [P("I 023G#Eb|-23"), P("I 023G#|-23Eb", "替え指")],
    89: [P("I 02-G#Eb|-23"), P("I 02-|G#-23Eb", "替え指")]
  };
  var INST = { ob: { n: "オーボエ", k: "C", d: 0 } };
  function svg(keys, opt) {
    opt = opt || {};
    var on = {}; (keys || []).forEach(function (k) { on[k] = 1; });
    var s = '<svg class="sxf" viewBox="0 0 120 350" role="img" aria-label="' + (opt.label || "運指") + '">';
    s += '<line x1="60" y1="30" x2="60" y2="302" class="sxf-rod"/><line x1="30" y1="206" x2="90" y2="206" class="sxf-sep"/>';
    ORDER.forEach(function (id) {
      var k = KEYS[id], c = "sxf-k" + (on[id] ? " on" : ""), t = "<title>" + k.n + "</title>";
      if (id === "h1" && on.h1v) c += " half";
      if (k.s === "c") s += '<circle class="' + c + '" cx="' + k.x + '" cy="' + k.y + '" r="' + k.r + '"' + (c.indexOf("half") > 0 ? ' fill-opacity=".4"' : "") + ">" + t + "</circle>";
      else if (k.s === "e") s += '<ellipse class="' + c + '" cx="' + k.x + '" cy="' + k.y + '" rx="' + k.rx + '" ry="' + k.ry + '">' + t + "</ellipse>";
      else s += '<rect class="' + c + '" x="' + (k.x - k.w / 2) + '" y="' + (k.y - k.h / 2) + '" width="' + k.w + '" height="' + k.h + '" rx="3">' + t + "</rect>";
    });
    if (!opt.bare) s += '<text x="60" y="20" class="sxf-t">左手</text><text x="104" y="206" class="sxf-t">右手</text>';
    return s + "</svg>";
  }
  function keyNames(keys) { return keys.filter(function (k) { return KEYS[k]; }).map(function (k) { return KEYS[k].n; }); }
  window.NamiOboe = { KEYS: KEYS, F: F, A: A, INST: INST, svg: svg, keyNames: keyNames, LOW: 58, HIGH: 84, ALT_LOW: 85, ALT_HIGH: 89 };
})();
