import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

/** Absolute path to the repo root (this file lives in <root>/lib). */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const paths = {
  root: ROOT,
  /** Ephemeral working data — gitignored, wiped between sessions. */
  data: path.join(ROOT, "data"),
  uploads: path.join(ROOT, "data", "uploads"),
  frames: path.join(ROOT, "data", "frames"),
  transcripts: path.join(ROOT, "data", "transcripts"),
  renders: path.join(ROOT, "data", "renders"),
  /** Committed, versioned. */
  style: path.join(ROOT, "style"),
  styleProfile: path.join(ROOT, "style", "style-profile.json"),
  sfx: path.join(ROOT, "assets", "sfx"),
  sfxManifest: path.join(ROOT, "assets", "sfx", "manifest.json"),
};

/** Create a directory (and parents) if it does not already exist. */
export function ensureDir(dir: string): string {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Ensure all the working directories exist. Safe to call repeatedly. */
export function ensureWorkingDirs(): void {
  for (const d of [
    paths.data,
    paths.uploads,
    paths.frames,
    paths.transcripts,
    paths.renders,
    paths.style,
    paths.sfx,
  ]) {
    ensureDir(d);
  }
}
