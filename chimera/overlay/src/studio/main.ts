/**
 * CHIMERA 歌声レンダラー(namigroove.com 用)。
 * 歌詞と音符から planSong で歌の計画を作り、声のエンジン(wasm)をこのページの中で
 * 48kHz・128サンプル刻みで回して WAV にする。ライブ演奏用の AudioWorklet は使わない。
 */
import { initChimera, chimeraModule } from "../wasm/chimera.ts";

type Fn = (...a: number[]) => number;
type Exports = { memory: WebAssembly.Memory } & Record<string, Fn>;

const SR = 48000;
const BLOCK = 128;
const MAX_GESTURES = 4000;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const BODIES: Record<string, { female: number; child: number }> = {
  child: { female: 0, child: 1 },
  female: { female: 1, child: 0 },
  male: { female: 0, child: 0 },
};

let lastWav: Blob | null = null;
let playCtx: AudioContext | null = null;
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
  const base = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[m[1].toLowerCase() as "c"];
  const acc = m[2] === "#" || m[2] === "♯" ? 1 : m[2] === "b" || m[2] === "♭" ? -1 : 0;
  return base + acc + (parseInt(m[3], 10) + 1) * 12;
}

interface ParsedNote { midi: number; beats: number }

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

async function main(): Promise<void> {
  setStatus("エンジンを読み込み中…");
  await initChimera();
  // エンジンの読み込みが終わってから、エンジンを使うモジュールを読む
  const { EnglishG2P, lyricsToSyllables, planSong } = await import("../wasm/engine.ts");
  const { writeGestures } = await import("../wasm/wire.ts");
  const g2p = new EnglishG2P();
  try {
    await g2p.load(new URL("data/cmudict.txt.gz", document.baseURI).href);
  } catch {
    // 辞書が読めなくても、つづりからの読み(letter-to-sound)で歌える
  }

  const syllables = () => lyricsToSyllables($<HTMLTextAreaElement>("lyrics").value);

  function refreshInfo(): void {
    try {
      const syl = syllables();
      const words = syl.map((s) => s.text + (s.wordEnd ? " " : "-")).join("").trim();
      let nn = 0;
      try { nn = parseNotes($<HTMLTextAreaElement>("notes").value).length; } catch { nn = 0; }
      $("sylInfo").textContent = `歌詞 ${syl.length} 音節 / 音符 ${nn} 個 — ${words}`;
    } catch (e) {
      $("sylInfo").textContent = "";
    }
  }
  $("lyrics").addEventListener("input", refreshInfo);
  $("notes").addEventListener("input", refreshInfo);
  refreshInfo();

  async function render(): Promise<Float32Array> {
    const syl = syllables();
    const notes = parseNotes($<HTMLTextAreaElement>("notes").value);
    if (!syl.length) throw new Error("歌詞が入っていません");
    if (syl.length !== notes.length) throw new Error(`音節の数(${syl.length})と音符の数(${notes.length})を同じにしてください`);
    const bpm = parseFloat($<HTMLInputElement>("bpm").value);
    if (!(bpm >= 30 && bpm <= 240)) throw new Error("テンポは 30〜240 にしてください");
    const body = BODIES[$<HTMLSelectElement>("body").value] ?? BODIES.child;
    const vibrato = Math.max(0, Math.min(100, parseFloat($<HTMLInputElement>("vib").value) || 0));

    const plan = planSong(notes.map((n, i) => ({ midi: n.midi, beats: n.beats, syl: syl[i] })), { body, bpm, t0: 0.2, vibrato });
    if (plan.gestures.length > MAX_GESTURES) throw new Error("曲が長すぎます。短く区切ってください");

    const x = new WebAssembly.Instance(chimeraModule(), {}).exports as unknown as Exports;
    const h = x.engine_new(SR);
    try {
      x.engine_set_body(h, body.female, body.child);
      const n = writeGestures(x.memory.buffer, x.engine_records(h), plan.gestures, MAX_GESTURES);
      const off = x.engine_schedule(h, n, 0.05, 1);
      const total = Math.ceil((plan.end + off + 0.7) * SR);
      const out = new Float32Array(total);
      const prog = $<HTMLProgressElement>("prog");
      prog.hidden = false;
      for (let i = 0, k = 0; i < total; i += BLOCK, k++) {
        const m = Math.min(BLOCK, total - i);
        const p = x.engine_render(h, m);
        out.set(new Float32Array(x.memory.buffer, p, m), i);
        if (k % 600 === 0) { prog.value = i / total; await tick(); }
      }
      prog.hidden = true;
      return out;
    } finally {
      x.engine_free(h);
    }
  }

  async function run(): Promise<Float32Array | null> {
    if (busy) return null;
    busy = true;
    stopPlay();
    ($("btnPlay") as HTMLButtonElement).disabled = true;
    ($("btnSave") as HTMLButtonElement).disabled = true;
    setStatus("歌っています(書き出し中)…");
    try {
      let samples = await render();
      if ($<HTMLInputElement>("mic").checked) samples = await micChain(samples);
      normalize(samples);
      let peak = 0; for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
      if (peak < 1e-4) throw new Error("音が出ませんでした(無音)。設定を変えてもう一度試してください");
      lastWav = wavBlob(samples);
      setStatus(`できました(${(samples.length / SR).toFixed(1)} 秒、48kHz・16bit・モノラル)`, "ok");
      ($("btnSave") as HTMLButtonElement).disabled = false;
      return samples;
    } catch (e) {
      $<HTMLProgressElement>("prog").hidden = true;
      setStatus(e instanceof Error ? e.message : String(e), "ng");
      return null;
    } finally {
      busy = false;
      ($("btnPlay") as HTMLButtonElement).disabled = false;
    }
  }

  function stopPlay(): void {
    if (playCtx) { void playCtx.close(); playCtx = null; }
    ($("btnStop") as HTMLButtonElement).disabled = true;
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
    src.start();
    ($("btnStop") as HTMLButtonElement).disabled = false;
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
  setStatus("");
}

main().catch((e) => setStatus("エンジンを読み込めませんでした: " + (e instanceof Error ? e.message : String(e)), "ng"));
