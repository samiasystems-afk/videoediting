import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runFfmpeg } from "./ffmpeg.js";

/** Sample rate we decode audio at for envelope analysis. */
export const SR = 16000;

/**
 * Decode a media file's audio to a mono Float32 waveform in [-1, 1].
 * Uses a temp raw-PCM file so we don't have to parse WAV headers.
 */
export async function decodeMonoPcm(src: string): Promise<Float32Array> {
  const tmp = path.join(os.tmpdir(), `pcm_${process.pid}_${Math.floor(performance.now())}.raw`);
  try {
    await runFfmpeg([
      "-y",
      "-i",
      src,
      "-vn",
      "-ac",
      "1",
      "-ar",
      String(SR),
      "-f",
      "s16le",
      "-acodec",
      "pcm_s16le",
      tmp,
    ]);
    const buf = fs.readFileSync(tmp);
    const n = Math.floor(buf.length / 2);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      out[i] = buf.readInt16LE(i * 2) / 32768;
    }
    return out;
  } finally {
    if (fs.existsSync(tmp)) fs.rmSync(tmp);
  }
}

export interface EnvelopePoint {
  timeSeconds: number;
  rms: number;
}

/**
 * Short-window RMS energy envelope. windowMs default 10ms.
 */
export function rmsEnvelope(pcm: Float32Array, windowMs = 10): EnvelopePoint[] {
  const win = Math.max(1, Math.floor((SR * windowMs) / 1000));
  const out: EnvelopePoint[] = [];
  for (let start = 0; start < pcm.length; start += win) {
    let sum = 0;
    const end = Math.min(pcm.length, start + win);
    for (let i = start; i < end; i++) sum += pcm[i] * pcm[i];
    const rms = Math.sqrt(sum / (end - start));
    out.push({ timeSeconds: start / SR, rms });
  }
  return out;
}

export interface Onset {
  timeSeconds: number;
  /** Ratio of this window's energy to the trailing local average. */
  strength: number;
  peakRms: number;
}

/**
 * Detect sharp audio onsets (fast-attack transients) — candidate sound-effect
 * hits. A window is an onset if its energy jumps well above the trailing local
 * average and is a local peak. Heuristic; the learn-style skill labels/prunes
 * the results.
 */
export function detectOnsets(
  env: EnvelopePoint[],
  opts: { minRatio?: number; minRms?: number; refreshMs?: number; minGapMs?: number } = {},
): Onset[] {
  const minRatio = opts.minRatio ?? 2.5;
  const minRms = opts.minRms ?? 0.02;
  const lookback = Math.max(1, Math.floor((opts.refreshMs ?? 150) / 10));
  const minGapWindows = Math.max(1, Math.floor((opts.minGapMs ?? 120) / 10));

  const onsets: Onset[] = [];
  let lastIdx = -Infinity;
  for (let i = lookback; i < env.length - 1; i++) {
    const cur = env[i].rms;
    if (cur < minRms) continue;
    // Trailing local average, excluding the current window.
    let avg = 0;
    for (let j = i - lookback; j < i; j++) avg += env[j].rms;
    avg /= lookback;
    const ratio = cur / (avg + 1e-6);
    const isPeak = cur >= env[i - 1].rms && cur >= env[i + 1].rms;
    if (ratio >= minRatio && isPeak && i - lastIdx >= minGapWindows) {
      onsets.push({ timeSeconds: env[i].timeSeconds, strength: ratio, peakRms: cur });
      lastIdx = i;
    }
  }
  return onsets;
}
