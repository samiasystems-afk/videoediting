#!/usr/bin/env node
/**
 * One-command setup for a fresh session.
 *
 * Ephemeral containers start with only the git repo. Run `npm run setup` (or let
 * the SessionStart hook run it) to install dependencies and create the working
 * directories so the pipeline is ready to use.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function log(msg) {
  process.stdout.write(`[setup] ${msg}\n`);
}

// 1. Install dependencies if node_modules is missing.
if (!fs.existsSync(path.join(root, "node_modules"))) {
  log("Installing npm dependencies (this can take a minute)...");
  execSync("npm install --no-audit --no-fund", { cwd: root, stdio: "inherit" });
} else {
  log("node_modules present — skipping npm install.");
}

// 2. Ensure ffmpeg + ffprobe are available (needed by the pipeline).
function hasBinary(name) {
  try {
    execSync(`which ${name}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
if (hasBinary("ffmpeg") && hasBinary("ffprobe")) {
  log("ffmpeg + ffprobe present.");
} else {
  log("ffmpeg not found — attempting apt install (needs root/network)...");
  try {
    execSync("apt-get update -qq && apt-get install -y --no-install-recommends ffmpeg", {
      stdio: "inherit",
    });
    log("ffmpeg installed.");
  } catch {
    log(
      "Could not install ffmpeg automatically. Install it manually, or set FFMPEG_PATH / FFPROBE_PATH.",
    );
  }
}

// 3. Create ephemeral working directories.
for (const d of [
  "data/uploads",
  "data/frames",
  "data/transcripts",
  "data/renders",
  "style",
  "assets/sfx",
]) {
  fs.mkdirSync(path.join(root, d), { recursive: true });
}
log("Working directories ready.");

// 4. Report which optional capabilities are available.
const hasWhisperKey = Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
log(
  hasWhisperKey
    ? "Transcription: API key found (GROQ_API_KEY/OPENAI_API_KEY)."
    : "Transcription: no API key set. Set GROQ_API_KEY or OPENAI_API_KEY for captions, or captions will need a manual transcript.",
);

log("Done. Try: npm run cli -- --help");
