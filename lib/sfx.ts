import fs from "node:fs";
import path from "node:path";
import { runFfmpeg } from "./ffmpeg.js";
import { ensureDir, paths } from "./paths.js";

/**
 * Extract a short sound-effect clip from a source video around a timestamp and
 * save it into assets/sfx/. Used by learn-style to build your sound kit from the
 * SFX onsets ingest detected in your example videos.
 *
 * The clip is normalized to a standard loudness and written as a small wav.
 */
export async function extractSfxClip(
  src: string,
  atSeconds: number,
  outName: string,
  opts: { preRollSeconds?: number; durationSeconds?: number } = {},
): Promise<string> {
  const pre = opts.preRollSeconds ?? 0.05;
  const dur = opts.durationSeconds ?? 0.6;
  const start = Math.max(0, atSeconds - pre);
  ensureDir(paths.sfx);
  const outFile = outName.endsWith(".wav") ? outName : `${outName}.wav`;
  const outPath = path.join(paths.sfx, outFile);
  await runFfmpeg([
    "-y",
    "-ss",
    start.toFixed(3),
    "-i",
    src,
    "-t",
    dur.toFixed(3),
    "-vn",
    "-ac",
    "1",
    "-ar",
    "44100",
    // Trim leading/trailing near-silence so the hit starts promptly.
    "-af",
    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",
    outPath,
  ]);
  return outPath;
}

export interface SfxManifestEntry {
  file: string;
  label: string;
  sourceVideo: string;
  atSeconds: number;
  triggerNotes: string;
}

/** Read the SFX manifest (assets/sfx/manifest.json), or [] if none. */
export function readSfxManifest(): SfxManifestEntry[] {
  if (!fs.existsSync(paths.sfxManifest)) return [];
  return JSON.parse(fs.readFileSync(paths.sfxManifest, "utf8"));
}

/** Write the SFX manifest. */
export function writeSfxManifest(entries: SfxManifestEntry[]): void {
  ensureDir(paths.sfx);
  fs.writeFileSync(paths.sfxManifest, JSON.stringify(entries, null, 2));
}
