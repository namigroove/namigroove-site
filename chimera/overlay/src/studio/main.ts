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

function parseNotes(text: string): ParsedNote[] {
  const out: ParsedNote[] = [];
  for (const tok of text.split(/[\s,、]+/).filter(Boolean)) {
    const [p, b] = tok.split(":");
    const midi = parsePitch(p);
    const beats = b === undefined ? 1 : parseFloat(b);
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

  // ---------------------------------------------------------------- ピアノロール
  const rollCanvas = $<HTMLCanvasElement>("roll");
  const rollCtx = rollCanvas.getContext("2d")!;
  let rollNotes: { midi: number; t0: number; t1: number; text: string }[] = [];
  let rollEnd = 1;

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
      rollNotes.push({ midi: n.midi, t0: t, t1: t + n.beats * beat, text });
      t += n.beats * beat;
    });
    rollEnd = Math.max(1, t + 0.4);
    const syl = sylList.length;
    $("sylCount").textContent = `歌詞 ${syl} 音節 / 音符 ${notes.length} 個`;
    $("sylInfo").textContent = sylList.map((s) => s.text + (s.wordEnd ? " " : "-")).join("").trim();
    $("rollInfo").textContent = notes.length ? `${rollEnd.toFixed(1)} 秒` : "";
  }

  function drawRoll(playT: number | null): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = rollCanvas.clientWidth, h = rollCanvas.clientHeight;
    if (rollCanvas.width !== Math.round(w * dpr) || rollCanvas.height !== Math.round(h * dpr)) {
      rollCanvas.width = Math.round(w * dpr);
      rollCanvas.height = Math.round(h * dpr);
    }
    const c = rollCtx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    c.fillStyle = "#fafbfe"; c.fillRect(0, 0, w, h);
    const G = 34, PADY = 14;
    const ms = rollNotes.map((n) => n.midi);
    const lo = (ms.length ? Math.min(...ms) : 60) - 3, hi = (ms.length ? Math.max(...ms) : 72) + 3;
    const rows = Math.max(8, hi - lo + 1);
    const rh = (h - PADY * 2) / rows;
    const yOf = (m: number) => PADY + (hi - m + 0.5) * rh;
    const xOf = (t: number) => G + (t / rollEnd) * (w - G - 6);
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    c.font = "10px ui-monospace, Consolas, monospace"; c.textBaseline = "middle"; c.textAlign = "right";
    for (let m = Math.floor(lo); m <= Math.ceil(hi); m++) {
      const pc = ((m % 12) + 12) % 12;
      const y = yOf(m);
      if ([1, 3, 6, 8, 10].includes(pc)) { c.fillStyle = "rgba(29,36,51,.045)"; c.fillRect(G, y - rh / 2, w - G, rh); }
      c.fillStyle = pc === 0 ? "rgba(29,36,51,.22)" : "rgba(29,36,51,.07)";
      c.fillRect(G, Math.round(y + rh / 2), w - G, 1);
      if (pc === 0 || pc === 4 || pc === 7) { c.fillStyle = "#76829a"; c.fillText(names[pc] + (Math.floor(m / 12) - 1), G - 5, y); }
    }
    if (!rollNotes.length) {
      c.fillStyle = "#76829a"; c.font = "13px sans-serif"; c.textAlign = "center";
      c.fillText("音符を入れると、ここに並びます", (w + G) / 2, h / 2);
      return;
    }
    const sec = Math.ceil(rollEnd);
    c.fillStyle = "#76829a"; c.font = "10px ui-monospace, Consolas, monospace"; c.textAlign = "left"; c.textBaseline = "top";
    for (let s = 0; s <= sec; s++) { const x = xOf(s); c.fillStyle = "rgba(29,36,51,.06)"; c.fillRect(x, PADY, 1, h - PADY * 2); if (s < sec) { c.fillStyle = "#76829a"; c.fillText(String(s), x + 2, 1); } }
    const bodyH = Math.max(12, Math.min(22, rh));
    c.textBaseline = "middle"; c.textAlign = "center";
    for (const n of rollNotes) {
      const x0 = xOf(n.t0), x1 = xOf(n.t1), y = yOf(n.midi) - bodyH / 2;
      const on = playT !== null && playT >= n.t0 && playT < n.t1;
      c.beginPath(); c.roundRect(x0 + 0.5, y, Math.max(3, x1 - x0 - 1.5), bodyH, 7);
      c.fillStyle = on ? "#e8792f" : "#396cdf"; c.fill();
      if (x1 - x0 > 22 && n.text) { c.fillStyle = "#fff"; c.font = "600 12px sans-serif"; c.fillText(n.text, (x0 + x1) / 2, y + bodyH / 2 + 0.5); }
    }
    if (playT !== null) { const x = xOf(playT); c.fillStyle = "#1d2433"; c.fillRect(Math.round(x), PADY - 6, 1.5, h - PADY * 2 + 12); }
  }

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

  const refresh = () => { layoutNotes(); if (!playCtx) drawRoll(null); };
  for (const id of ["lyrics", "notes", "bpm"]) $(id).addEventListener("input", refresh);
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
