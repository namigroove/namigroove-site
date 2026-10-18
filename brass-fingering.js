/* なみぐる！金管楽器の運指データと運指図(SVG)。金管楽器運指表(brass.html)で使う
   ピストン・ロータリーの楽器は「開放で出る倍音」と「バルブで下がる半音の数」から運指を組み立て、
   よく使う替え指や音程の注意は手で足しています。音はすべて記譜音(楽譜の音)のMIDI番号です。 */
(function () {
  "use strict";

  /* バルブの組み合わせ(下がる半音の数 → 押すバルブ)。最初が基本、2つ目以降は同じ高さの別の押さえ方 */
  var V3 = { 0: [[]], 1: [[2]], 2: [[1]], 3: [[1, 2], [3]], 4: [[2, 3]], 5: [[1, 3]], 6: [[1, 2, 3]] };
  var V4 = { 0: [[]], 1: [[2]], 2: [[1]], 3: [[1, 2], [3]], 4: [[2, 3]], 5: [[4], [1, 3]], 6: [[2, 4], [1, 2, 3]],
             7: [[1, 4]], 8: [[1, 2, 4], [3, 4]], 9: [[2, 3, 4]], 10: [[1, 3, 4]], 11: [[1, 2, 3, 4]] };

  /* 倍音(開放で出る音)のうち、いちばん近い上の倍音からバルブで下げる */
  function valveChart(o) {
    var F = {}, m, i, s, p, list, combos;
    for (m = o.lo; m <= o.hi; m++) {
      p = null;
      for (i = 0; i < o.partials.length; i++) {
        s = o.partials[i] - m;
        if (s >= 0 && s <= o.maxS) { p = o.partials[i]; break; }
      }
      if (p === null) continue;
      s = p - m; combos = o.combos[s];
      list = [{ v: combos[0], th: !!o.thumb }];
      for (i = 1; i < combos.length; i++) list.push({ v: combos[i], th: !!o.thumb, name: "替え指" });
      F[m] = list;
    }
    return F;
  }
  function vkey(v) { return v.slice().sort().join(""); }
  function tipFor(F, notes, tip) {
    Object.keys(F).forEach(function (m) {
      F[m].forEach(function (f) { if (notes.indexOf(vkey(f.v)) >= 0 && !f.tip) f.tip = tip; });
    });
  }
  function addAlt(F, m, f) { if (F[m]) F[m].push(f); }

  /* ---------- トランペット(コルネット・フリューゲルホルンも同じ) ---------- */
  function trumpet() {
    var F = valveChart({ lo: 54, hi: 84, partials: [60, 67, 72, 76, 79, 84], combos: V3, maxS: 6 });
    tipFor(F, ["13", "123"], "第3スライドを少し抜いて、音程を下げる");
    addAlt(F, 76, { v: [1, 2], name: "替え指" });           /* E5 */
    addAlt(F, 79, { v: [1, 3], name: "替え指" });           /* G5 */
    return F;
  }

  /* ---------- ホルン ---------- */
  var HF = [48, 55, 60, 64, 67, 72, 74, 76, 79, 84];       /* F管の倍音(記譜) 2,3,4,5,6,8,9,10,12,16 */
  var HB = [53, 60, 65, 69, 72, 77, 79, 84];               /* B♭管の倍音(記譜) 2,3,4,5,6,8,9,12 */
  function hornSide(m, partials, th) {
    for (var i = 0; i < partials.length; i++) {
      var s = partials[i] - m;
      if (s >= 0 && s <= 6) return { v: V3[s][0], th: th, s: s };
    }
    return null;
  }
  function hornDouble() {
    var F = {}, m, f, b;
    for (m = 54; m <= 84; m++) {
      f = hornSide(m, HF, false); b = hornSide(m, HB, true);
      if (m < 69) {                                         /* G♯4まではF管 */
        F[m] = [f];
        if (m >= 58 && b && b.s <= 3) F[m].push({ v: b.v, th: true, name: "B♭管" });
      } else {                                              /* A4からはB♭管(親指レバー) */
        F[m] = [b];
        if (m <= 76 && f && f.s <= 3) F[m].push({ v: f.v, th: false, name: "F管" });
      }
    }
    addAlt(F, 80, { v: [2], th: true, name: "替え指" });    /* G♯5(10倍音) */
    addAlt(F, 81, { v: [], th: true, name: "替え指" });     /* A5(10倍音) */
    return F;
  }
  function hornSingle() {
    var F = valveChart({ lo: 54, hi: 84, partials: HF, combos: V3, maxS: 6 });
    return F;
  }

  /* ---------- トロンボーン(ポジション) ---------- */
  function P(pos, extra) { var o = { pos: pos }; for (var k in extra || {}) o[k] = extra[k]; return o; }
  function trombone(trigger) {
    var F = {
      40: [P(7)], 41: [P(6)], 42: [P(5)], 43: [P(4)], 44: [P(3)], 45: [P(2)], 46: [P(1)],
      47: [P(7)], 48: [P(6)], 49: [P(5)], 50: [P(4)], 51: [P(3)], 52: [P(2)], 53: [P(1), P(6, { name: "替えポジション" })],
      54: [P(5)], 55: [P(4)], 56: [P(3)], 57: [P(2)], 58: [P(1), P(5, { name: "替えポジション" })],
      59: [P(4)], 60: [P(3), P(6, { name: "替えポジション" })], 61: [P(2), P(5, { name: "替えポジション" })],
      62: [P(1), P(4, { name: "替えポジション" })],
      63: [P(3)], 64: [P(2)], 65: [P(1)],
      66: [P(3, { tip: "少し内側(♯3)で合わせる" }), P(5, { name: "替えポジション" })],
      67: [P(2, { tip: "少し内側(♯2)で合わせる" }), P(4, { name: "替えポジション" })],
      68: [P(3)], 69: [P(2)], 70: [P(1)]
    };
    if (trigger) {
      /* Fアタッチメント(トリガー):管が長くなり、4度低い倍音が使える */
      F[36] = [P(6, { tr: 1, tip: "トリガー使用時はポジションが少しずつ遠くなる。かなり遠め" })];
      F[37] = [P(5, { tr: 1, tip: "トリガー使用時はポジションが少しずつ遠くなる。遠め" })];
      F[38] = [P(4, { tr: 1, tip: "トリガー使用時はポジションが少しずつ遠くなる" })];
      F[39] = [P(3, { tr: 1, tip: "トリガー使用時はポジションが少しずつ遠くなる" })];
      F[40] = [P(2, { tr: 1 }), P(7, { name: "トリガーなし" })];
      F[41] = [P(1, { tr: 1 }), P(6, { name: "トリガーなし" })];
      F[47] = [P(2, { tr: 1 }), P(7, { name: "トリガーなし" })];
      F[48] = [P(1, { tr: 1 }), P(6, { name: "トリガーなし" })];
      F[53].push(P(1, { tr: 1, name: "トリガー" }));
    }
    return F;
  }

  /* ---------- ユーフォニアム・チューバ ---------- */
  function lowBrass(fund, lo, hi, four, comp) {
    var parts = [2, 3, 4, 5, 6, 8].map(function (n) { return fund + Math.round(12 * Math.log2(n)); });
    var F = valveChart({ lo: lo, hi: hi, partials: parts, combos: four ? V4 : V3, maxS: four ? 11 : 6 });
    if (!four) tipFor(F, ["13", "123"], "高くなりやすいので、抜き差しや息で下げる");
    else if (!comp) tipFor(F, ["124", "234", "134", "1234", "34"], "音程が高くなりやすい。息や抜き差しで下げる");
    return F;
  }

  function shift(F, n) { var G = {}; Object.keys(F).forEach(function (m) { G[+m + n] = F[m]; }); return G; }
  var FAM = {
    tp: {
      n: "トランペット", kind: "valve", nv: 3,
      INST: {
        bb: { n: "B♭トランペット", d: -2 },
        c: { n: "Cトランペット", d: 0, more: 1 },
        cor: { n: "コルネット・フリューゲル", d: -2, more: 1 }
      },
      build: function () { return trumpet(); }, dn: 72
    },
    hn: {
      n: "ホルン", kind: "valve", nv: 3, thumb: true,
      INST: {
        dbl: { n: "ダブル(F/B♭)", d: -7 },
        f: { n: "シングルF", d: -7, more: 1 }
      },
      build: function (i) { return i === "f" ? hornSingle() : hornDouble(); }, dn: 67
    },
    tb: {
      n: "トロンボーン", kind: "slide",
      INST: {
        ten: { n: "テナー", d: 0 },
        tb: { n: "テナーバス(F管つき)", d: 0 }
      },
      build: function (i) { return trombone(i === "tb"); }, dn: 58
    },
    eu: {
      n: "ユーフォニアム", kind: "valve",
      INST: {
        c4: { n: "4本(コンペンセイティング)", d: 0, nv: 4 },
        v3: { n: "3本", d: 0, nv: 3, more: 1 },
        tr: { n: "4本・ト音記号(B♭)", d: -14, nv: 4, more: 1 }
      },
      build: function (i) { if (i === "v3") return lowBrass(34, 40, 70, false); var F = lowBrass(34, 35, 70, true, true); return i === "tr" ? shift(F, 14) : F; }, dn: 58, dnTr: 72
    },
    tu: {
      n: "チューバ", kind: "valve",
      INST: {
        bb4: { n: "B♭ 4本", d: 0, nv: 4 },
        bb3: { n: "B♭ 3本", d: 0, nv: 3, more: 1 }
      },
      build: function (i) { return i === "bb3" ? lowBrass(22, 28, 58, false) : lowBrass(22, 26, 58, true, false); }, dn: 46
    }
  };

  /* ---------- 図 ---------- */
  function valveSvg(f, nv, thumb, label) {
    var on = {}; (f.v || []).forEach(function (v) { on[v] = 1; });
    var W = thumb ? 150 : (nv === 4 ? 164 : 124), x0 = thumb ? 50 : 26, s = "";
    s += '<svg class="bf" viewBox="0 0 ' + W + ' 70" role="img" aria-label="' + label + '">';
    if (thumb) {
      s += '<circle class="bf-k' + (f.th ? " on" : "") + '" cx="20" cy="38" r="12"><title>親指レバー(B♭管に切り替え)</title></circle>';
      s += '<text class="bf-n' + (f.th ? " on" : "") + '" x="20" y="42">T</text><text class="bf-t" x="20" y="64">' + (f.th ? "B♭管" : "F管") + '</text>';
    }
    for (var i = 1; i <= nv; i++) {
      var x = x0 + (i - 1) * 36 + (i === 4 ? 6 : 0);
      s += '<rect class="bf-st" x="' + (x - 3) + '" y="6" width="6" height="12" rx="2"/>';
      s += '<circle class="bf-k' + (on[i] ? " on" : "") + '" cx="' + x + '" cy="38" r="15"><title>' + i + '番' + (on[i] ? "(押す)" : "") + '</title></circle>';
      s += '<text class="bf-n' + (on[i] ? " on" : "") + '" x="' + x + '" y="43">' + i + '</text>';
    }
    return s + "</svg>";
  }
  function slideSvg(f, label, trig) {
    var s = '<svg class="bf bf-slide" viewBox="0 0 156 70" role="img" aria-label="' + label + '">';
    s += '<line class="bf-rail" x1="12" y1="28" x2="148" y2="28"/>';
    for (var p = 1; p <= 7; p++) {
      var x = 12 + (p - 1) * 22.5, me = p === f.pos;
      s += '<line class="bf-tick' + (me ? " on" : "") + '" x1="' + x + '" y1="20" x2="' + x + '" y2="36"/>';
      s += '<text class="bf-t' + (me ? " on" : "") + '" x="' + x + '" y="52">' + p + '</text>';
    }
    var cx = 12 + (f.pos - 1) * 22.5;
    s += '<rect class="bf-mark" x="' + (cx - 7) + '" y="17" width="14" height="22" rx="4"/>';
    if (trig) s += '<text class="bf-tr' + (f.tr ? " on" : "") + '" x="78" y="66">' + (f.tr ? "トリガーを押す" : "トリガーなし") + '</text>';
    else s += '<text class="bf-t" x="78" y="66">ポジション</text>';
    return s + "</svg>";
  }

  window.NamiBrass = {
    FAM: FAM,
    load: function (fam, inst) {
      var A = FAM[fam], I = A.INST[inst] || A.INST[Object.keys(A.INST)[0]];
      var F = A.build(inst), ks = Object.keys(F).map(Number).sort(function (a, b) { return a - b; });
      return {
        F: F, INST: I, LOW: ks[0], HIGH: ks[ks.length - 1],
        svg: function (f, label) {
          if (A.kind === "slide") return slideSvg(f, label, inst === "tb");
          return valveSvg(f, I.nv || A.nv, !!A.thumb && inst === "dbl", label);
        },
        text: function (f) {
          if (A.kind === "slide") return f.pos + "ポジション" + (f.tr ? " ・ トリガー" : "");
          var v = (f.v || []).slice().sort();
          var t = v.length ? v.join("・") + "番" : "開放(押さない)";
          if (A.thumb && inst === "dbl") t = (f.th ? "B♭管(T) ・ " : "F管 ・ ") + t;
          return t;
        }
      };
    }
  };
})();
