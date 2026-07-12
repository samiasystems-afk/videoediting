import type { Edl, StyleProfile } from "../lib/schemas.js";

/**
 * Props passed to the EditedVideo composition. Both are plain JSON objects
 * (already validated by the pipeline) so they serialize cleanly across the
 * Remotion render boundary.
 *
 * All media `src` values inside the EDL are expected to be resolvable URLs by
 * render time — render.ts rewrites them to absolute file:// URLs.
 */
export type EditedVideoProps = {
  edl: Edl;
  style: StyleProfile;
  // Index signature so the type is assignable to Remotion's
  // `Record<string, unknown>` props constraint.
  [key: string]: unknown;
};

/** A tiny placeholder EDL so the composition renders something in the studio. */
export const PLACEHOLDER_PROPS: EditedVideoProps = {
  edl: {
    version: 1,
    width: 1080,
    height: 1920,
    fps: 30,
    durationSeconds: 3,
    backgroundColor: "#111111",
    events: [
      {
        type: "caption",
        startSeconds: 0.2,
        endSeconds: 2.8,
        words: [
          { text: "YOUR", startMs: 200, endMs: 700, emphasis: false },
          { text: "STYLE", startMs: 700, endMs: 1400, emphasis: true },
          { text: "HERE", startMs: 1400, endMs: 2600, emphasis: false },
        ],
      },
    ],
  },
  style: {
    version: 1,
    summary: "",
    width: 1080,
    height: 1920,
    fps: 30,
    captions: {
      fontFamily: "Inter",
      fontWeight: 800,
      fontSizeRel: 0.07,
      uppercase: true,
      textColor: "#FFFFFF",
      highlightColor: "#FFEE00",
      strokeColor: "#000000",
      strokeWidthRel: 0.12,
      shadow: true,
      positionY: 0.75,
      animation: "pop",
      wordsPerGroup: 3,
      emphasizeKeywords: true,
    },
    pacing: { medianShotSeconds: 2.5, silenceCutThresholdSeconds: 0.6, removeFillerWords: true },
    zoom: { perMinute: 6, scale: 1.18, rampSeconds: 0.25, triggerNotes: "" },
    transitions: { kinds: ["cut"], defaultDurationSeconds: 0.3, triggerNotes: "" },
    sfx: [],
    notes: "",
  },
};
