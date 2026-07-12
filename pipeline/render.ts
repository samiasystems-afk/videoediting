import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { parseEdl, StyleProfile, type Edl } from "../lib/schemas.js";
import { ensureDir, paths } from "../lib/paths.js";
import { findChromium } from "../lib/browser.js";
import { startMediaServer, type MediaServer } from "../lib/mediaserver.js";

/**
 * Render an EDL to an MP4 via Remotion.
 *
 * Media `src` values in the EDL are resolved to absolute file:// URLs here:
 *   - clip / broll / transition overlay srcs → relative to `baseDir`
 *   - sfx `file` → relative to assets/sfx/
 * so the EDL the agent writes can use plain relative names.
 */

export type Quality = "draft" | "final";

export interface RenderOptions {
  /** Directory the EDL's clip/broll/overlay srcs are relative to. */
  baseDir: string;
  outPath: string;
  quality?: Quality;
  /** Optional style profile; falls back to schema defaults. */
  style?: StyleProfile;
  onProgress?: (fraction: number) => void;
}

function resolveAbs(src: string, baseDir: string): string {
  return path.isAbsolute(src) ? src : path.resolve(baseDir, src);
}

/**
 * Rewrite every media reference in the EDL to an http URL served by the media
 * server. clip/broll/overlay srcs resolve relative to baseDir; sfx files resolve
 * relative to assets/sfx/. Absolute http(s) URLs are passed through unchanged.
 */
export function resolveEdlMedia(edl: Edl, baseDir: string, server: MediaServer): Edl {
  const toUrl = (src: string, base: string) =>
    /^https?:\/\//.test(src) ? src : server.add(resolveAbs(src, base));
  return {
    ...edl,
    events: edl.events.map((ev) => {
      switch (ev.type) {
        case "clip":
          return { ...ev, src: toUrl(ev.src, baseDir) };
        case "sfx":
          return { ...ev, file: toUrl(ev.file, paths.sfx) };
        case "transition":
          return ev.overlaySrc ? { ...ev, overlaySrc: toUrl(ev.overlaySrc, baseDir) } : ev;
        default:
          return ev;
      }
    }),
  };
}

function loadStyle(explicit?: StyleProfile): StyleProfile {
  if (explicit) return explicit;
  if (fs.existsSync(paths.styleProfile)) {
    return StyleProfile.parse(JSON.parse(fs.readFileSync(paths.styleProfile, "utf8")));
  }
  return StyleProfile.parse({}); // all defaults
}

export async function renderEdl(edl: Edl, opts: RenderOptions): Promise<string> {
  const quality: Quality = opts.quality ?? "final";
  const style = loadStyle(opts.style);

  const browserExecutable = findChromium();
  const chromiumOptions = { gl: "swiftshader" as const };

  const server = await startMediaServer();
  try {
    const resolved = resolveEdlMedia(edl, opts.baseDir, server);
    const inputProps = { edl: resolved, style };

    const entryPoint = path.join(paths.root, "remotion", "index.ts");
    const serveUrl = await bundle({
      entryPoint,
      // Our source uses explicit `.js` import specifiers (required for tsx/Node
      // ESM). Teach Remotion's webpack to resolve those to the real `.ts`/`.tsx`.
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...config.resolve,
          extensionAlias: {
            ...(config.resolve?.extensionAlias ?? {}),
            ".js": [".ts", ".tsx", ".js"],
          },
        },
      }),
    });

    const composition = await selectComposition({
      serveUrl,
      id: "EditedVideo",
      inputProps,
      browserExecutable,
      chromiumOptions,
    });

    ensureDir(path.dirname(opts.outPath));
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: opts.outPath,
      inputProps,
      browserExecutable,
      chromiumOptions,
      // Draft: half resolution + fastest encode for quick review loops.
      scale: quality === "draft" ? 0.5 : 1,
      crf: quality === "draft" ? 28 : 18,
      jpegQuality: quality === "draft" ? 70 : 90,
      x264Preset: quality === "draft" ? "ultrafast" : "medium",
      onProgress: opts.onProgress ? ({ progress }) => opts.onProgress!(progress) : undefined,
    });

    return opts.outPath;
  } finally {
    await server.close();
  }
}

/** Load an edl.json file, render it, return the output path. */
export async function renderEdlFile(
  edlPath: string,
  opts: Omit<RenderOptions, "baseDir"> & { baseDir?: string },
): Promise<string> {
  const edl = parseEdl(JSON.parse(fs.readFileSync(edlPath, "utf8")));
  const baseDir = opts.baseDir ?? path.dirname(path.resolve(edlPath));
  return renderEdl(edl, { ...opts, baseDir });
}

/* CLI: tsx pipeline/render.ts <edl.json> [--out file.mp4] [--draft] [--base dir] */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const edlPath = args.find((a) => !a.startsWith("--"));
  if (!edlPath) {
    console.error("Usage: tsx pipeline/render.ts <edl.json> [--out file.mp4] [--draft] [--base dir]");
    process.exit(1);
  }
  const outIdx = args.indexOf("--out");
  const baseIdx = args.indexOf("--base");
  const quality: Quality = args.includes("--draft") ? "draft" : "final";
  const name = path.basename(edlPath).replace(/\.[^.]+$/, "");
  const outPath =
    outIdx >= 0 ? args[outIdx + 1] : path.join(paths.renders, `${name}.${quality}.mp4`);

  renderEdlFile(edlPath, {
    outPath,
    quality,
    baseDir: baseIdx >= 0 ? args[baseIdx + 1] : undefined,
    onProgress: (f) => process.stdout.write(`\rRendering ${(f * 100).toFixed(0)}%   `),
  })
    .then((out) => {
      process.stdout.write("\n");
      console.log(`Rendered (${quality}) -> ${out}`);
    })
    .catch((e) => {
      console.error("\n" + String(e?.stack ?? e));
      process.exit(1);
    });
}
