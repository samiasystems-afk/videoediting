import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { runFfmpeg, runFfprobe, ffmpegPath } from "../lib/ffmpeg.js";
import { ensureDir, paths } from "../lib/paths.js";
import { decodeMonoPcm, rmsEnvelope, detectOnsets, type Onset } from "../lib/audio.js";

/**
 * Ingest a single video: probe metadata, sample frames for the vision pass,
 * extract audio, build a silence map, and detect candidate sound-effect hits.
 *
 * The output is a self-contained folder under data/frames/<name>/ plus a JSON
 * report the agent (and later stages) read.
 */

export interface VideoMeta {
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  codec: string;
}

export interface SilenceSpan {
  startSeconds: number;
  endSeconds: number;
}

export interface SampledFrame {
  timeSeconds: number;
  file: string; // relative path to the JPG
  kind: "interval" | "scene";
}

export interface IngestReport {
  src: string;
  name: string;
  outDir: string;
  meta: VideoMeta;
  frames: SampledFrame[];
  sceneChangeSeconds: number[];
  silences: SilenceSpan[];
  /** Candidate sound-effect hit timestamps (for learn-style to clip/label). */
  sfxOnsets: Onset[];
}

export async function probe(src: string): Promise<VideoMeta> {
  const out = await runFfprobe([
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    src,
  ]);
  const json = JSON.parse(out);
  const streams: any[] = json.streams ?? [];
  const v = streams.find((s) => s.codec_type === "video");
  const a = streams.find((s) => s.codec_type === "audio");
  if (!v) throw new Error(`No video stream in ${src}`);

  // fps comes as a fraction like "30000/1001".
  const [num, den] = String(v.avg_frame_rate ?? v.r_frame_rate ?? "30/1")
    .split("/")
    .map(Number);
  const fps = den ? num / den : num || 30;

  const duration = Number(json.format?.duration ?? v.duration ?? 0);
  return {
    durationSeconds: duration,
    width: Number(v.width),
    height: Number(v.height),
    fps: Math.round(fps * 1000) / 1000,
    hasAudio: Boolean(a),
    codec: String(v.codec_name ?? "unknown"),
  };
}

/** Sample one frame per `everySeconds`, written as JPGs. */
async function sampleIntervalFrames(
  src: string,
  outDir: string,
  everySeconds: number,
): Promise<SampledFrame[]> {
  const dir = ensureDir(path.join(outDir, "interval"));
  await runFfmpeg([
    "-y",
    "-i",
    src,
    "-vf",
    `fps=1/${everySeconds},scale=480:-1:flags=lanczos`,
    "-q:v",
    "4",
    path.join(dir, "f_%04d.jpg"),
  ]);
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".jpg"))
    .sort()
    .map((f, i) => ({
      timeSeconds: i * everySeconds,
      file: path.relative(outDir, path.join(dir, f)),
      kind: "interval" as const,
    }));
}

/**
 * Detect scene-change timestamps via the `scene` filter and grab a frame at
 * each. We parse showinfo output on stderr for accurate timestamps.
 */
async function sampleSceneFrames(
  src: string,
  outDir: string,
  threshold: number,
): Promise<{ frames: SampledFrame[]; sceneChangeSeconds: number[] }> {
  const dir = ensureDir(path.join(outDir, "scene"));
  // Collect timestamps via showinfo (stderr), frames via image2.
  const times: number[] = [];
  await new Promise<void>((resolve, reject) => {
    const p = spawn(ffmpegPath(), [
      "-y",
      "-i",
      src,
      "-vf",
      `select='gt(scene,${threshold})',showinfo,scale=480:-1:flags=lanczos`,
      "-vsync",
      "vfr",
      "-q:v",
      "4",
      path.join(dir, "s_%04d.jpg"),
    ]);
    let stderr = "";
    p.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    p.on("error", reject);
    p.on("close", () => {
      const re = /pts_time:([0-9.]+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(stderr))) times.push(Number(m[1]));
      resolve();
    });
  });

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".jpg"))
    .sort();
  const frames: SampledFrame[] = files.map((f, i) => ({
    timeSeconds: times[i] ?? 0,
    file: path.relative(outDir, path.join(dir, f)),
    kind: "scene" as const,
  }));
  return { frames, sceneChangeSeconds: times };
}

/** Extract a normalized mono audio track for later use, and return its path. */
async function extractAudio(src: string, outDir: string): Promise<string> {
  const out = path.join(outDir, "audio.wav");
  await runFfmpeg(["-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000", out]);
  return out;
}

/** Parse ffmpeg's silencedetect output into spans. */
async function detectSilences(
  src: string,
  noiseDb: number,
  minSeconds: number,
): Promise<SilenceSpan[]> {
  const stderr: string = await new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath(), [
      "-i",
      src,
      "-af",
      `silencedetect=noise=${noiseDb}dB:d=${minSeconds}`,
      "-f",
      "null",
      "-",
    ]);
    let buf = "";
    p.stderr.on("data", (d: Buffer) => (buf += d.toString()));
    p.on("error", reject);
    p.on("close", () => resolve(buf));
  });

  const spans: SilenceSpan[] = [];
  let pendingStart: number | null = null;
  const startRe = /silence_start:\s*([0-9.]+)/;
  const endRe = /silence_end:\s*([0-9.]+)/;
  for (const line of stderr.split("\n")) {
    const s = startRe.exec(line);
    if (s) pendingStart = Number(s[1]);
    const e = endRe.exec(line);
    if (e && pendingStart != null) {
      spans.push({ startSeconds: pendingStart, endSeconds: Number(e[1]) });
      pendingStart = null;
    }
  }
  return spans;
}

export interface IngestOptions {
  /** Interval-frame spacing in seconds. */
  frameEverySeconds?: number;
  /** Scene-change sensitivity 0..1 (lower = more scenes). */
  sceneThreshold?: number;
  /** Silence detection floor in dB. */
  silenceNoiseDb?: number;
  /** Minimum silence duration in seconds. */
  silenceMinSeconds?: number;
  /** Also run SFX-onset detection (used by learn-style on example videos). */
  detectSfx?: boolean;
}

export async function ingestVideo(src: string, opts: IngestOptions = {}): Promise<IngestReport> {
  if (!fs.existsSync(src)) throw new Error(`No such file: ${src}`);
  const name = path.basename(src).replace(/\.[^.]+$/, "");
  const outDir = ensureDir(path.join(paths.frames, name));

  const meta = await probe(src);

  const everySeconds = opts.frameEverySeconds ?? Math.max(1, Math.round(meta.durationSeconds / 40));
  const intervalFrames = await sampleIntervalFrames(src, outDir, everySeconds);
  const { frames: sceneFrames, sceneChangeSeconds } = await sampleSceneFrames(
    src,
    outDir,
    opts.sceneThreshold ?? 0.3,
  );

  let silences: SilenceSpan[] = [];
  let sfxOnsets: Onset[] = [];
  if (meta.hasAudio) {
    await extractAudio(src, outDir);
    silences = await detectSilences(
      src,
      opts.silenceNoiseDb ?? -30,
      opts.silenceMinSeconds ?? 0.4,
    );
    if (opts.detectSfx) {
      const pcm = await decodeMonoPcm(src);
      sfxOnsets = detectOnsets(rmsEnvelope(pcm, 10));
    }
  }

  const report: IngestReport = {
    src: path.resolve(src),
    name,
    outDir,
    meta,
    frames: [...intervalFrames, ...sceneFrames].sort((a, b) => a.timeSeconds - b.timeSeconds),
    sceneChangeSeconds,
    silences,
    sfxOnsets,
  };

  fs.writeFileSync(path.join(outDir, "ingest.json"), JSON.stringify(report, null, 2));
  return report;
}

/* CLI: tsx pipeline/ingest.ts <video> [--sfx] */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const src = args.find((a) => !a.startsWith("--"));
  if (!src) {
    console.error("Usage: tsx pipeline/ingest.ts <video> [--sfx]");
    process.exit(1);
  }
  ingestVideo(src, { detectSfx: args.includes("--sfx") })
    .then((r) => {
      console.log(
        `Ingested ${r.name}: ${r.meta.width}x${r.meta.height} ${r.meta.fps}fps ` +
          `${r.meta.durationSeconds.toFixed(1)}s, ${r.frames.length} frames, ` +
          `${r.sceneChangeSeconds.length} scene changes, ${r.silences.length} silences` +
          (r.sfxOnsets.length ? `, ${r.sfxOnsets.length} SFX onsets` : ""),
      );
      console.log(`Report: ${path.join(r.outDir, "ingest.json")}`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
