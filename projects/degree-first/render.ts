/**
 * Degree First promo renderer.
 *   npx tsx projects/degree-first/render.ts video [--draft] [--fps 60] [--audio audio/score.wav] [--out path] [--frames 0-90]
 *   npx tsx projects/degree-first/render.ts still <frameSec> <out.png>
 *   npx tsx projects/degree-first/render.ts brand <variant> <out.png>
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { findChromium } from "../../lib/browser.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

async function main() {
  const mode = args[0];
  const serveUrl = await bundle({
    entryPoint: path.join(here, "src", "index.ts"),
    publicDir: path.join(here, "public"),
    webpackOverride: (c) => ({
      ...c,
      resolve: { ...c.resolve, extensionAlias: { ".js": [".tsx", ".ts", ".js"] } },
    }),
  });
  const browserExecutable = findChromium();
  const chromiumOptions = { gl: "swiftshader" as const };

  if (mode === "brand") {
    const variant = args[1];
    const inputProps = { variant };
    const comp = await selectComposition({ serveUrl, id: "Brand", inputProps, browserExecutable, chromiumOptions });
    await renderStill({ composition: comp, serveUrl, output: args[2], inputProps, imageFormat: "png", browserExecutable, chromiumOptions });
    console.log("wrote", args[2]);
    return;
  }

  const fps = Number(flag("--fps") ?? 30);
  const audio = flag("--audio") ?? null;
  const inputProps = { audio, fps };
  const comp = await selectComposition({ serveUrl, id: "DegreeFirstPromo", inputProps, browserExecutable, chromiumOptions });

  if (mode === "stills") {
    const times = args[1].split(",").map(Number);
    const dir = args[2];
    fs.mkdirSync(dir, { recursive: true });
    for (const sec of times) {
      await renderStill({
        composition: comp,
        serveUrl,
        output: path.join(dir, `${sec.toFixed(2).padStart(6, "0")}.jpg`),
        frame: Math.min(comp.durationInFrames - 1, Math.round(sec * comp.fps)),
        inputProps,
        imageFormat: "jpeg",
        jpegQuality: 80,
        scale: 0.5,
        browserExecutable,
        chromiumOptions,
      });
    }
    console.log("wrote", times.length, "stills to", dir);
    return;
  }

  if (mode === "still") {
    const sec = Number(args[1]);
    await renderStill({
      composition: comp,
      serveUrl,
      output: args[2],
      frame: Math.round(sec * comp.fps),
      inputProps,
      imageFormat: "jpeg",
      jpegQuality: 85,
      browserExecutable,
      chromiumOptions,
    });
    console.log("wrote", args[2]);
    return;
  }

  const draft = args.includes("--draft");
  const out = flag("--out") ?? path.join(here, "out", draft ? "draft.mp4" : "final.mp4");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const fr = flag("--frames");
  const frameRange = fr ? (fr.split("-").map(Number) as [number, number]) : undefined;
  let last = 0;
  await renderMedia({
    composition: comp,
    serveUrl,
    codec: "h264",
    outputLocation: out,
    inputProps,
    frameRange,
    scale: draft ? 0.5 : 1,
    crf: draft ? 28 : 16,
    x264Preset: draft ? "ultrafast" : "slow",
    pixelFormat: "yuv420p",
    concurrency: 4,
    browserExecutable,
    chromiumOptions,
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 20);
      if (p !== last) {
        last = p;
        console.log(`render ${Math.round(progress * 100)}%`);
      }
    },
  });
  console.log("wrote", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
