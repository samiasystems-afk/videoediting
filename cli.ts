#!/usr/bin/env -S npx tsx
/**
 * Command dispatcher for the video-editing pipeline. The agent (or you) runs
 * these mechanical steps; the creative decisions (style profile, EDL) are
 * written as JSON by the agent between steps.
 *
 *   ingest <video> [--sfx]          probe, sample frames, silences, SFX onsets
 *   transcribe <video> [--lang en]  Whisper word-level transcript
 *   cut-sfx <video> <sec> <name>    extract a sound-effect clip into assets/sfx/
 *   render <edl.json> [--draft] [--base dir] [--out file.mp4]
 *   validate <edl.json>             check an EDL against the schema
 *   info                            print environment/capability status
 */
import fs from "node:fs";
import path from "node:path";
import { ingestVideo } from "./pipeline/ingest.js";
import { transcribeToFile, transcriptionAvailable } from "./pipeline/transcribe.js";
import { renderEdlFile } from "./pipeline/render.js";
import { extractSfxClip } from "./lib/sfx.js";
import { parseEdl } from "./lib/schemas.js";
import { paths, ensureWorkingDirs } from "./lib/paths.js";
import { findChromium } from "./lib/browser.js";

function arg(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  ensureWorkingDirs();

  switch (cmd) {
    case "ingest": {
      const src = rest.find((a) => !a.startsWith("--"));
      if (!src) throw new Error("Usage: cli ingest <video> [--sfx]");
      const r = await ingestVideo(src, { detectSfx: rest.includes("--sfx") });
      console.log(JSON.stringify({ report: path.join(r.outDir, "ingest.json"), meta: r.meta, frames: r.frames.length, sceneChanges: r.sceneChangeSeconds.length, silences: r.silences.length, sfxOnsets: r.sfxOnsets.length }, null, 2));
      break;
    }
    case "transcribe": {
      const src = rest.find((a) => !a.startsWith("--"));
      if (!src) throw new Error("Usage: cli transcribe <video> [--lang en]");
      const out = await transcribeToFile(src, { language: arg(rest, "--lang") });
      console.log(out);
      break;
    }
    case "cut-sfx": {
      const [src, sec, name] = rest.filter((a) => !a.startsWith("--"));
      if (!src || !sec || !name) throw new Error("Usage: cli cut-sfx <video> <seconds> <name>");
      const out = await extractSfxClip(src, Number(sec), name);
      console.log(out);
      break;
    }
    case "render": {
      const edl = rest.find((a) => !a.startsWith("--"));
      if (!edl) throw new Error("Usage: cli render <edl.json> [--draft] [--base dir] [--out file.mp4]");
      const quality = rest.includes("--draft") ? "draft" : "final";
      const name = path.basename(edl).replace(/\.[^.]+$/, "");
      const out = arg(rest, "--out") ?? path.join(paths.renders, `${name}.${quality}.mp4`);
      const result = await renderEdlFile(edl, {
        outPath: out,
        quality,
        baseDir: arg(rest, "--base"),
        onProgress: (f) => process.stdout.write(`\rRendering ${(f * 100).toFixed(0)}%   `),
      });
      process.stdout.write("\n");
      console.log(result);
      break;
    }
    case "validate": {
      const edl = rest.find((a) => !a.startsWith("--"));
      if (!edl) throw new Error("Usage: cli validate <edl.json>");
      parseEdl(JSON.parse(fs.readFileSync(edl, "utf8")));
      console.log("OK: EDL is valid.");
      break;
    }
    case "info": {
      console.log(
        JSON.stringify(
          {
            chromium: findChromium() ?? "NOT FOUND",
            transcription: transcriptionAvailable() ? "available" : "no API key (set GROQ_API_KEY or OPENAI_API_KEY)",
            styleProfile: fs.existsSync(paths.styleProfile) ? "present" : "not learned yet",
            sfxKit: fs.existsSync(paths.sfxManifest) ? "present" : "empty",
          },
          null,
          2,
        ),
      );
      break;
    }
    case "--help":
    case undefined:
      console.log(
        "Commands: ingest, transcribe, cut-sfx, render, validate, info\n" +
          "  cli ingest <video> [--sfx]\n" +
          "  cli transcribe <video> [--lang en]\n" +
          "  cli cut-sfx <video> <seconds> <name>\n" +
          "  cli render <edl.json> [--draft] [--base dir] [--out file.mp4]\n" +
          "  cli validate <edl.json>\n" +
          "  cli info",
      );
      break;
    default:
      throw new Error(`Unknown command: ${cmd}. Try: cli --help`);
  }
}

main().catch((e) => {
  console.error(String(e?.stack ?? e));
  process.exit(1);
});
