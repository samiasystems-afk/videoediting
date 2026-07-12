import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";

/**
 * Resolve the ffmpeg / ffprobe binaries.
 *
 * We do NOT depend on the `ffmpeg-static` npm package because it downloads a
 * binary from GitHub at install time, which the environment proxy blocks. Instead
 * we resolve, in order:
 *   1. explicit env vars FFMPEG_PATH / FFPROBE_PATH
 *   2. a binary on PATH (installed by `npm run setup` via apt, or already present)
 */
function resolveBinary(envVar: string, name: string): string {
  const fromEnv = process.env[envVar];
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  const probe = spawnSync(process.platform === "win32" ? "where" : "which", [name], {
    encoding: "utf8",
  });
  const found = probe.stdout?.split("\n")[0]?.trim();
  if (found) return found;

  throw new Error(
    `Could not find ${name}. Install it (\`npm run setup\` runs \`apt-get install ffmpeg\`) or set ${envVar}.`,
  );
}

let _ffmpeg: string | undefined;
let _ffprobe: string | undefined;

export function ffmpegPath(): string {
  return (_ffmpeg ??= resolveBinary("FFMPEG_PATH", "ffmpeg"));
}

export function ffprobePath(): string {
  return (_ffprobe ??= resolveBinary("FFPROBE_PATH", "ffprobe"));
}

/** Run ffmpeg with the given args, rejecting on a non-zero exit. */
export function runFfmpeg(args: string[]): Promise<void> {
  return run(ffmpegPath(), args);
}

/** Run ffprobe and return its stdout. */
export function runFfprobe(args: string[]): Promise<string> {
  return runCapture(ffprobePath(), args);
}

function run(bin: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("error", reject);
    p.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${bin} exited ${code}\n${stderr.slice(-2000)}`)),
    );
  });
}

function runCapture(bin: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += d.toString()));
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("error", reject);
    p.on("close", (code) =>
      code === 0
        ? resolve(stdout)
        : reject(new Error(`${bin} exited ${code}\n${stderr.slice(-2000)}`)),
    );
  });
}
