/**
 * CHIMERA 歌声レンダラー(namigroove.com 用)。
 * 歌詞と音符から planSong で歌の計画を作り、声のエンジン(wasm)をこのページの中で
 * 48kHz・128サンプル刻みで回して WAV にする。ライブ演奏用の AudioWorklet は使わない。
 * 回しながら 60Hz でエンジンの計測値(テレメトリ)も取っておき、試し聞きに合わせて
 * CHIMERA 本体と同じ描画(AnatomyRenderer)で口の断面を動かす。
 */
import "./studio.css";
import { initChimera, chimeraModule } from "../wasm/chimera.ts";
import type { TelemetryMessage } from "../worklet/protocol.ts";
import type { BodyMix } from "../wasm/types.ts";

type Fn = (...a: number[]) => number;
type Exports = { memory: WebAssembly.Memory } & Record<string, Fn>;

const SR = 48000;
const BLOCK = 128;
const FRAME = 800; // 60Hz
const MAX_GESTURES = 4000;
const T0 = 0.2; // 歌の計画の始まり(s)
const LEAD = 0.05; // エンジンに予約するときの余白(s)
const TELE_HEADER = 16;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const BODIES: Record<string, BodyMix> = {
  child: { female: 0, child: 1 },
  female: { female: 1, child: 0 },
  male: { female: 0, child: 0 },
};

interface ParsedNote { midi: number; beats: number }
interface Rendered { samples: Float32Array; frames: TelemetryMessage[] }

let lastWav: Blob | null = null;
let frames: TelemetryMessage[] = [];
let playCtx: AudioContext | null = null;
let playStart = 0;
let busy = false;

function setStatus(msg: string, kind: "" | "ok" | "ng" = ""): void {
  const s = $("status");
  s.textContent = msg;
  s.className = "status " + kind;
}

/** "C5" "C#4" "Bb3" "72" のどれか → MIDIノート番号(C4 = 60)。読めなければ null。 */
function parsePitch(tok: string): number | null {
  if (/^\d+(\.\d+)?$/.test(tok)) return parseFloat(tok);
  const m = /^([A-Ga-g])([#♯b♭]?)(-?\d)$/.exec(tok);
  if (!m) return null;
  const base = ({ c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 } as Record<string, number>)[m[1].toLowerCase()];
  const acc = m[2] === "#" || m[2] === "♯" ? 1 : m[2] === "b" || m[2] === "♭" ? -1 : 0;
  return base + acc + (parseInt(m[3], 10) + 1) * 12;
}

/** "2" "0.5" "1/3" → 拍の長さ。読めなければ NaN。 */
function parseBeats(s: string): number {
  const f = /^(\d+)\/(\d+)$/.exec(s);
  return f ? parseInt(f[1], 10) / parseInt(f[2], 10) : parseFloat(s);
}

function parseNotes(text: string): ParsedNote[] {
  const out: ParsedNote[] = [];
  for (const tok of text.split(/[\s,、]+/).filter(Boolean)) {
    const [p, b] = tok.split(":");
    const midi = parsePitch(p);
    const beats = b === undefined ? 1 : parseBeats(b);
    if (midi === null || !(midi >= 24 && midi <= 108)) throw new Error(`読めない音符があります: ${tok}`);
    if (!(beats > 0 && beats <= 32)) throw new Error(`拍の長さが正しくありません: ${tok}`);
    out.push({ midi, beats });
  }
  if (!out.length) throw new Error("音符が入っていません");
  return out;
}

function wavBlob(samples: Float32Array): Blob {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const dv = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); dv.setUint32(4, 36 + n * 2, true); str(8, "WAVE"); str(12, "fmt ");
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, SR, true); dv.setUint32(28, SR * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  str(36, "data"); dv.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    dv.setInt16(44 + i * 2, Math.round(v < 0 ? v * 32768 : v * 32767), true);
  }
  return new Blob([buf], { type: "audio/wav" });
}

/** アプリと同じ「近接マイク」の処理(低域の持ち上げ、presence、コンプ、メイクアップ、マスター)。 */
async function micChain(input: Float32Array): Promise<Float32Array> {
  const ctx = new OfflineAudioContext(1, input.length, SR);
  const buf = ctx.createBuffer(1, input.length, SR);
  buf.copyToChannel(input as Float32Array<ArrayBuffer>, 0);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const shelf = ctx.createBiquadFilter(); shelf.type = "lowshelf"; shelf.frequency.value = 120; shelf.gain.value = 9;
  const presence = ctx.createBiquadFilter(); presence.type = "peaking"; presence.frequency.value = 3500; presence.Q.value = 0.8; presence.gain.value = 3;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -28; comp.knee.value = 8; comp.ratio.value = 5; comp.attack.value = 0.002; comp.release.value = 0.12;
  const makeup = ctx.createGain(); makeup.gain.value = 2.2;
  const master = ctx.createGain(); master.gain.value = 0.8;
  src.connect(shelf).connect(presence).connect(comp).connect(makeup).connect(master).connect(ctx.destination);
  src.start();
  const rendered = await ctx.startRendering();
  return rendered.getChannelData(0).slice();
}

function normalize(x: Float32Array, peak = 0.9): void {
  let m = 0;
  for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
  if (m < 1e-6) return;
  const g = peak / m;
  for (let i = 0; i < x.length; i++) x[i] *= g;
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

/** エンジンの人の声の計測値のブロック → 画面が読む形(worklet/processor.ts の humanTelemetry と同じ読み方)。 */
function readTelemetry(x: Exports, h: number, body: BodyMix): TelemetryMessage {
  const mem = x.memory.buffer;
  const p = x.engine_telemetry(h);
  const [phLen, orLen, velumPort, f0, voicing, pLung, outRms, noiseLevel, noiseNode, gate, clock, nArtic, nPh, nOr, nScope, nActive] = new Float64Array(mem, p, TELE_HEADER);
  const all = new Float64Array(mem, p, TELE_HEADER + nArtic + 3 * (nPh + nOr) + 2 * nScope);
  let o = TELE_HEADER;
  const take = (n: number) => Float32Array.from(all.subarray(o, (o += n)));
  const artic = take(nArtic), phAreas = take(nPh), orAreas = take(nOr), pressureRms = take(nPh + nOr), flow = take(nPh + nOr), glottalArea = take(nScope), glottalFlow = take(nScope);
  const labels = new Uint8Array(mem, x.engine_tele_labels(h), 4 * 25);
  const dec = new TextDecoder();
  const active: string[] = [];
  for (let i = 0; i < nActive; i++) active.push(dec.decode(labels.subarray(i * 25 + 1, i * 25 + 1 + labels[i * 25])));
  return {
    type: "telemetry",
    t: { artic, phAreas, orAreas, phLen, orLen, pressureRms, flow, velumPort, glottalArea, glottalFlow, f0, voicing, pLung, outRms, noiseLevel, noiseNode, gate, clock, active },
    load: 0,
    body,
    nPh,
    nOr,
    beatStep: -1,
  };
}

async function main(): Promise<void> {
  setStatus("エンジンを読み込み中…");
  await initChimera();
  // エンジンの読み込みが終わってから、エンジンを使うモジュールを読む
  const { EnglishG2P, lyricsToSyllables, planSong, NEUTRAL } = await import("../wasm/engine.ts");
  const { writeGestures } = await import("../wasm/wire.ts");
  const { AnatomyRenderer } = await import("../ui/render/anatomy.ts");
  const { Glow } = await import("../ui/render/vector.ts");
  const { VoiceModel } = await import("../ui/analysis.ts");
  const g2p = new EnglishG2P();
  try {
    await g2p.load(new URL("data/cmudict.txt.gz", document.baseURI).href);
  } catch {
    // 辞書が読めなくても、つづりからの読み(letter-to-sound)で歌える
  }

  const syllables = () => lyricsToSyllables($<HTMLTextAreaElement>("lyrics").value);
  const bodyMix = () => BODIES[$<HTMLSelectElement>("body").value] ?? BODIES.child;
  const bpmNow = () => { const v = parseFloat($<HTMLInputElement>("bpm").value); return v >= 30 && v <= 240 ? v : 100; };

  // ---------------------------------------------------------------- ピアノロール(ドラッグで音の高さと長さを編集)
  const rollCanvas = $<HTMLCanvasElement>("roll");
  const rollCtx = rollCanvas.getContext("2d")!;
  interface RollNote { midi: number; beats: number; t0: number; t1: number; text: string }
  let rollNotes: RollNote[] = [];
  let view = { lo: 55, hi: 79, end: 1 };
  let dragging = false;
  const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const GUTTER = 34, PADY = 14;
  const pitchName = (m: number) => (Number.isInteger(m) ? NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1) : String(m));
  const fmtBeats = (b: number) => {
    if (Math.abs(b * 100 - Math.round(b * 100)) < 1e-6) return String(Math.round(b * 100) / 100);
    for (const d of [3, 6, 12]) if (Math.abs(b * d - Math.round(b * d)) < 1e-6) return `${Math.round(b * d)}/${d}`;
    return String(Math.round(b * 1000) / 1000);
  };
  // グリッド: 1拍を div 等分。音符は前から順に並ぶので、「吸着」は音符の長さ(拍)をグリッドの倍数にすること
  let gridOn = true;
  const divNow = () => parseInt($<HTMLSelectElement>("gridDiv").value, 10) || 4;
  const snapBeats = (b: number, div: number) => Math.max(1 / div, Math.round(b * div) / div);
  const writeNotes = (ns: ParsedNote[]) => {
    $<HTMLTextAreaElement>("notes").value = ns.map((n) => pitchName(n.midi) + (n.beats === 1 ? "" : ":" + fmtBeats(n.beats))).join(" ");
  };

  let beepCtx: AudioContext | null = null;
  function beep(m: number): void {
    try {
      beepCtx ??= new AudioContext();
      const t = beepCtx.currentTime;
      const o = beepCtx.createOscillator(), g = beepCtx.createGain();
      o.type = "triangle";
      o.frequency.value = 440 * 2 ** ((m - 69) / 12);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(beepCtx.destination);
      o.start(t);
      o.stop(t + 0.25);
    } catch { /* 音が出なくても編集はできる */ }
  }

  function layoutNotes(): void {
    rollNotes = [];
    let sylList: ReturnType<typeof syllables> = [];
    let notes: ParsedNote[] = [];
    try { sylList = syllables(); } catch { /* 歌詞が読めない間は文字なし */ }
    try { notes = parseNotes($<HTMLTextAreaElement>("notes").value); } catch { /* 音符が読めない間は空 */ }
    const beat = 60 / bpmNow();
    let t = T0 + LEAD;
    notes.forEach((n, i) => {
      const s = sylList[i];
      const text = s ? (s.melisma ? "–" : s.text) : "";
      rollNotes.push({ midi: n.midi, beats: n.beats, t0: t, t1: t + n.beats * beat, text });
      t += n.beats * beat;
    });
    if (!dragging) {
      const ms = rollNotes.map((n) => n.midi);
      let lo = (ms.length ? Math.min(...ms) : 63) - 4, hi = (ms.length ? Math.max(...ms) : 71) + 4;
      while (hi - lo < 15) { lo--; hi++; }
      view = { lo: Math.max(24, lo), hi: Math.min(108, hi), end: Math.max(1, t + 0.4) };
    }
    $("sylCount").textContent = `歌詞 ${sylList.length} 音節 / 音符 ${notes.length} 個`;
    $("sylInfo").textContent = sylList.map((s) => s.text + (s.wordEnd ? " " : "-")).join("").trim();
    $("rollInfo").textContent = notes.length ? `${(t + 0.4).toFixed(1)} 秒` : "";
  }

  const geom = () => {
    const w = rollCanvas.clientWidth, h = rollCanvas.clientHeight;
    const rows = view.hi - view.lo + 1;
    const rh = (h - PADY * 2) / rows;
    const span = w - GUTTER - 6;
    return {
      w, h, rh, span,
      yOf: (m: number) => PADY + (view.hi - m + 0.5) * rh,
      xOf: (t: number) => GUTTER + (t / view.end) * span,
      bodyH: Math.max(12, Math.min(24, rh)),
    };
  };

  const span0 = () => rollCanvas.clientWidth - GUTTER - 6;

  function drawRoll(playT: number | null): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const { w, h, rh, yOf, xOf, bodyH } = geom();
    if (rollCanvas.width !== Math.round(w * dpr) || rollCanvas.height !== Math.round(h * dpr)) {
      rollCanvas.width = Math.round(w * dpr);
      rollCanvas.height = Math.round(h * dpr);
    }
    const c = rollCtx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    c.fillStyle = "#fafbfe"; c.fillRect(0, 0, w, h);
    c.font = "10px ui-monospace, Consolas, monospace"; c.textBaseline = "middle"; c.textAlign = "right";
    for (let m = view.lo; m <= view.hi; m++) {
      const pc = ((m % 12) + 12) % 12;
      const y = yOf(m);
      if ([1, 3, 6, 8, 10].includes(pc)) { c.fillStyle = "rgba(29,36,51,.045)"; c.fillRect(GUTTER, y - rh / 2, w - GUTTER, rh); }
      c.fillStyle = pc === 0 ? "rgba(29,36,51,.22)" : "rgba(29,36,51,.07)";
      c.fillRect(GUTTER, Math.round(y + rh / 2), w - GUTTER, 1);
      if (pc === 0 || pc === 4 || pc === 7) { c.fillStyle = "#76829a"; c.fillText(NAMES[pc] + (Math.floor(m / 12) - 1), GUTTER - 5, y); }
    }
    const sec = Math.ceil(view.end);
    c.font = "10px ui-monospace, Consolas, monospace"; c.textAlign = "left"; c.textBaseline = "top";
    for (let s = 0; s <= sec; s++) { const x = xOf(s); c.fillStyle = "rgba(29,36,51,.06)"; c.fillRect(x, PADY, 1, h - PADY * 2); if (s < sec) { c.fillStyle = "#76829a"; c.fillText(String(s), x + 2, 1); } }
    if (gridOn) {
      const div = divNow(), beat = 60 / bpmNow(), step = beat / div, o = T0 + LEAD;
      if ((step / view.end) * span0() >= 5) {
        const perBar = div * 4, n = Math.floor((view.end - o) / step);
        for (let k = 0; k <= n; k++) {
          const x = Math.round(xOf(o + k * step)) + 0.5;
          const bar = k % perBar === 0, bt = k % div === 0;
          c.fillStyle = bar ? "rgba(57,108,223,.38)" : bt ? "rgba(57,108,223,.2)" : "rgba(57,108,223,.08)";
          c.fillRect(x - 0.5, PADY, 1, h - PADY * 2);
        }
      }
    }
    if (!rollNotes.length) {
      c.fillStyle = "#76829a"; c.font = "13px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("音符を入れると、ここに並びます", (w + GUTTER) / 2, h / 2);
      return;
    }
    c.textBaseline = "middle"; c.textAlign = "center";
    rollNotes.forEach((n, i) => {
      const x0 = xOf(n.t0), x1 = xOf(n.t1), y = yOf(n.midi) - bodyH / 2;
      const on = playT !== null && playT >= n.t0 && playT < n.t1;
      const grab = drag !== null && drag.i === i;
      c.beginPath(); c.roundRect(x0 + 0.5, y, Math.max(3, x1 - x0 - 1.5), bodyH, 7);
      c.fillStyle = on || grab ? "#e8792f" : "#396cdf"; c.fill();
      if (x1 - x0 > 22 && n.text) { c.fillStyle = "#fff"; c.font = "600 12px sans-serif"; c.fillText(n.text, (x0 + x1) / 2, y + bodyH / 2 + 0.5); }
      if (grab) { c.fillStyle = "#1d2433"; c.font = "600 11px ui-monospace, Consolas, monospace"; c.fillText(pitchName(n.midi), (x0 + x1) / 2, y - 8); }
    });
    if (playT !== null) { const x = xOf(playT); c.fillStyle = "#1d2433"; c.fillRect(Math.round(x), PADY - 6, 1.5, h - PADY * 2 + 12); }
  }

  interface Drag { i: number; mode: "pitch" | "len"; x: number; y: number; midi: number; beats: number; notes: ParsedNote[] }
  let drag: Drag | null = null;

  function hitNote(px: number, py: number): { i: number; mode: "pitch" | "len" } | null {
    const { yOf, xOf, bodyH } = geom();
    for (let i = rollNotes.length - 1; i >= 0; i--) {
      const n = rollNotes[i];
      const x0 = xOf(n.t0), x1 = xOf(n.t1), y = yOf(n.midi) - bodyH / 2;
      if (px >= x0 && px <= x1 && py >= y - 3 && py <= y + bodyH + 3) return { i, mode: px > x1 - 8 && x1 - x0 > 20 ? "len" : "pitch" };
    }
    return null;
  }
  const rollPos = (e: PointerEvent) => { const r = rollCanvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  rollCanvas.addEventListener("pointerdown", (e) => {
    if (busy || playCtx) return;
    const { x, y } = rollPos(e);
    const hit = hitNote(x, y);
    if (!hit) return;
    let notes: ParsedNote[];
    try { notes = parseNotes($<HTMLTextAreaElement>("notes").value); } catch { return; }
    drag = { i: hit.i, mode: hit.mode, x, y, midi: notes[hit.i].midi, beats: notes[hit.i].beats, notes };
    dragging = true;
    rollCanvas.setPointerCapture(e.pointerId);
    if (hit.mode === "pitch") beep(drag.midi);
    drawRoll(null);
  });
  rollCanvas.addEventListener("pointermove", (e) => {
    const { x, y } = rollPos(e);
    if (!drag) {
      const hit = busy || playCtx ? null : hitNote(x, y);
      rollCanvas.style.cursor = hit ? (hit.mode === "len" ? "ew-resize" : "ns-resize") : "default";
      return;
    }
    const { rh, span } = geom();
    const n = drag.notes[drag.i];
    if (drag.mode === "pitch") {
      const m = Math.max(view.lo, Math.min(view.hi, Math.round(drag.midi + (drag.y - y) / rh)));
      if (m === n.midi) return;
      n.midi = m;
      beep(m);
    } else {
      const secPerBeat = 60 / bpmNow();
      const dBeats = ((x - drag.x) / span) * view.end / secPerBeat;
      const raw = drag.beats + dBeats;
      const b = Math.min(32, gridOn && !e.altKey ? snapBeats(raw, divNow()) : Math.max(0.05, Math.round(raw * 20) / 20));
      if (b === n.beats) return;
      n.beats = b;
    }
    writeNotes(drag.notes);
    layoutNotes();
    drawRoll(null);
  });
  const endDrag = () => {
    if (!drag) return;
    drag = null;
    dragging = false;
    layoutNotes();
    drawRoll(null);
  };
  rollCanvas.addEventListener("pointerup", endDrag);
  rollCanvas.addEventListener("pointercancel", endDrag);

  // ---------------------------------------------------------------- 口の断面(CHIMERA 本体と同じ描画)
  const mouthCanvas = $<HTMLCanvasElement>("mouth");
  const mouthCtx = mouthCanvas.getContext("2d")!;
  const renderer = new AnatomyRenderer();
  const glow = new Glow();
  const VIEW = { pressure: true, particles: true, grid: false, calipers: true, threeD: false };
  let model = new VoiceModel(bodyMix(), SR);
  let lastDraw = performance.now();

  function resizeMouth(): void {
    const b = $("screen").getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    mouthCanvas.width = Math.max(1, Math.round(b.width * dpr));
    mouthCanvas.height = Math.max(1, Math.round(b.height * dpr));
    renderer.resize(b.width, b.height);
  }

  function drawMouth(tele: TelemetryMessage | null): void {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastDraw) / 1000);
    const elapsed = Math.min(0.5, (now - lastDraw) / 1000);
    lastDraw = now;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const b = $("screen").getBoundingClientRect();
    if (b.width < 1 || b.height < 1) return;
    const a = tele ? VoiceModel.articFromArray(tele.t.artic) : { ...NEUTRAL };
    renderer.face.update(tele, elapsed);
    const f = model.frame(a);
    mouthCtx.setTransform(1, 0, 0, 1, 0, 0);
    mouthCtx.globalCompositeOperation = "source-over";
    mouthCtx.fillStyle = "#000";
    mouthCtx.fillRect(0, 0, mouthCanvas.width, mouthCanvas.height);
    mouthCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderer.draw(mouthCtx, model, f, a, tele, VIEW, { hover: null, drag: null, dt, formants: [], slots: [], info: [] });
    glow.apply(mouthCanvas, mouthCtx, dpr);
  }

  function setBody(): void {
    const old = model;
    model = new VoiceModel(bodyMix(), SR);
    old.dispose();
    drawMouth(null);
  }

  // ---------------------------------------------------------------- 書き出し
  async function render(): Promise<Rendered> {
    const syl = syllables();
    const notes = parseNotes($<HTMLTextAreaElement>("notes").value);
    if (!syl.length) throw new Error("歌詞が入っていません");
    if (syl.length !== notes.length) throw new Error(`音節の数(${syl.length})と音符の数(${notes.length})を同じにしてください`);
    const bpm = parseFloat($<HTMLInputElement>("bpm").value);
    if (!(bpm >= 30 && bpm <= 240)) throw new Error("テンポは 30〜240 にしてください");
    const body = bodyMix();
    const vibrato = Math.max(0, Math.min(100, parseFloat($<HTMLInputElement>("vib").value) || 0));

    const plan = planSong(notes.map((n, i) => ({ midi: n.midi, beats: n.beats, syl: syl[i] })), { body, bpm, t0: T0, vibrato });
    if (plan.gestures.length > MAX_GESTURES) throw new Error("曲が長すぎます。短く区切ってください");

    const x = new WebAssembly.Instance(chimeraModule(), {}).exports as unknown as Exports;
    const h = x.engine_new(SR);
    try {
      x.engine_set_body(h, body.female, body.child);
      const n = writeGestures(x.memory.buffer, x.engine_records(h), plan.gestures, MAX_GESTURES);
      const off = x.engine_schedule(h, n, LEAD, 1);
      const total = Math.ceil((plan.end + off + 0.7) * SR);
      const out = new Float32Array(total);
      const fr: TelemetryMessage[] = [];
      const prog = $<HTMLProgressElement>("prog");
      prog.hidden = false;
      for (let i = 0, k = 0; i < total; i += BLOCK, k++) {
        const m = Math.min(BLOCK, total - i);
        const p = x.engine_render(h, m);
        out.set(new Float32Array(x.memory.buffer, p, m), i);
        if (i % FRAME < BLOCK) fr.push(readTelemetry(x, h, body));
        if (k % 600 === 0) { prog.value = i / total; await tick(); }
      }
      prog.hidden = true;
      return { samples: out, frames: fr };
    } finally {
      x.engine_free(h);
    }
  }

  async function run(): Promise<Float32Array | null> {
    if (busy) return null;
    busy = true;
    stopPlay();
    $<HTMLButtonElement>("btnPlay").disabled = true;
    $<HTMLButtonElement>("btnSave").disabled = true;
    setStatus("歌っています(書き出し中)…");
    try {
      const r = await render();
      let samples = r.samples;
      if ($<HTMLInputElement>("mic").checked) samples = await micChain(samples);
      normalize(samples);
      let peak = 0; for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
      if (peak < 1e-4) throw new Error("音が出ませんでした(無音)。設定を変えてもう一度試してください");
      lastWav = wavBlob(samples);
      frames = r.frames;
      setStatus(`できました(${(samples.length / SR).toFixed(1)} 秒、48kHz・16bit・モノラル)`, "ok");
      $<HTMLButtonElement>("btnSave").disabled = false;
      return samples;
    } catch (e) {
      $<HTMLProgressElement>("prog").hidden = true;
      setStatus(e instanceof Error ? e.message : String(e), "ng");
      return null;
    } finally {
      busy = false;
      $<HTMLButtonElement>("btnPlay").disabled = false;
    }
  }

  // ---------------------------------------------------------------- 再生と画面の更新
  let raf = 0;
  function loop(): void {
    const ctx = playCtx;
    if (!ctx) return;
    const t = Math.max(0, ctx.currentTime - playStart);
    const k = Math.min(frames.length - 1, Math.floor(t * 60));
    drawRoll(t);
    drawMouth(frames[k] ?? null);
    raf = requestAnimationFrame(loop);
  }

  function stopPlay(): void {
    cancelAnimationFrame(raf);
    if (playCtx) { void playCtx.close(); playCtx = null; }
    $<HTMLButtonElement>("btnStop").disabled = true;
    drawRoll(null);
    drawMouth(null);
  }

  $("btnPlay").addEventListener("click", async () => {
    const samples = await run();
    if (!samples) return;
    const ctx = new AudioContext({ sampleRate: SR });
    playCtx = ctx;
    const buf = ctx.createBuffer(1, samples.length, SR);
    buf.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = () => { if (playCtx === ctx) stopPlay(); };
    playStart = ctx.currentTime + 0.05;
    src.start(playStart);
    $<HTMLButtonElement>("btnStop").disabled = false;
    lastDraw = performance.now();
    raf = requestAnimationFrame(loop);
  });
  $("btnStop").addEventListener("click", stopPlay);
  $("btnSave").addEventListener("click", () => {
    if (!lastWav) return;
    const name = ($<HTMLInputElement>("fname").value.trim().replace(/[^A-Za-z0-9_-]/g, "") || "chimera_song") + ".wav";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(lastWav);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  });

  const setGrid = () => { $("btnGrid").setAttribute("aria-pressed", String(gridOn)); drawRoll(null); };
  $("btnGrid").addEventListener("click", () => { gridOn = !gridOn; setGrid(); });
  $("gridDiv").addEventListener("change", () => drawRoll(null));
  $("btnSnapLen").addEventListener("click", () => {
    let ns: ParsedNote[];
    try { ns = parseNotes($<HTMLTextAreaElement>("notes").value); } catch { return; }
    const div = divNow();
    for (const n of ns) n.beats = Math.min(32, snapBeats(n.beats, div));
    writeNotes(ns);
    layoutNotes();
    drawRoll(null);
  });

  const refresh = () => { layoutNotes(); if (!playCtx) drawRoll(null); };
  for (const id of ["lyrics", "notes", "bpm", "gridDiv"]) $(id).addEventListener("input", refresh);
  $("body").addEventListener("change", () => { if (!playCtx) setBody(); });
  new ResizeObserver(() => { resizeMouth(); if (!playCtx) { drawMouth(null); drawRoll(null); } }).observe($("screen"));
  window.addEventListener("resize", () => { if (!playCtx) drawRoll(null); });

  layoutNotes();
  resizeMouth();
  drawRoll(null);
  drawMouth(null);
  setStatus("");
}

main().catch((e) => setStatus("エンジンを読み込めませんでした: " + (e instanceof Error ? e.message : String(e)), "ng"));
