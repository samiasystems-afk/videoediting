import { z } from "zod";

/**
 * The two data contracts the whole system hinges on:
 *
 *   StyleProfile  — the learned, human-readable description of *your* editing
 *                   style. Produced once by the `learn-style` skill, committed
 *                   to the repo, and read on every edit.
 *
 *   EDL           — an Edit Decision List: the multi-track timeline for a single
 *                   video. Produced by the `edit-video` skill, validated here,
 *                   and consumed by the Remotion renderer. This is the document
 *                   the agent edits when you give feedback.
 *
 * Both are plain JSON. You can read and hand-correct either one.
 */

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

/** Hex color like "#FFEE00". */
export const HexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Expected hex color like #FFEE00");

/** Normalized position 0..1 within the frame (0 = top/left, 1 = bottom/right). */
export const Norm = z.number().min(0).max(1);

/* ------------------------------------------------------------------ */
/* StyleProfile                                                        */
/* ------------------------------------------------------------------ */

export const CaptionAnimation = z.enum([
  "none",
  "fade",
  "pop", // word scales up on entry
  "bounce", // word overshoots then settles
  "slide-up",
  "karaoke", // highlight the active word within a visible group
  "typewriter",
]);
export type CaptionAnimation = z.infer<typeof CaptionAnimation>;

export const CaptionStyle = z.object({
  fontFamily: z.string().default("Inter"),
  fontWeight: z.number().int().min(100).max(900).default(800),
  /** Caption text height as a fraction of video height. */
  fontSizeRel: z.number().min(0.02).max(0.2).default(0.06),
  uppercase: z.boolean().default(true),
  textColor: HexColor.default("#FFFFFF"),
  /** Color applied to the currently-spoken / emphasized word. */
  highlightColor: HexColor.default("#FFEE00"),
  strokeColor: HexColor.default("#000000"),
  /** Stroke width as a fraction of font size. 0 = no stroke. */
  strokeWidthRel: z.number().min(0).max(0.5).default(0.12),
  /** Drop-shadow toggle. */
  shadow: z.boolean().default(true),
  /** Vertical position of the caption block, 0 (top) .. 1 (bottom). */
  positionY: Norm.default(0.78),
  animation: CaptionAnimation.default("pop"),
  /** How many words appear at once (1 = one word at a time). */
  wordsPerGroup: z.number().int().min(1).max(8).default(3),
  /** Emphasize (highlight color / larger) certain word kinds. */
  emphasizeKeywords: z.boolean().default(true),
});
export type CaptionStyle = z.infer<typeof CaptionStyle>;

export const PacingStyle = z.object({
  /** Median shot length in seconds observed in the reference edits. */
  medianShotSeconds: z.number().positive().default(2.5),
  /** Remove silences longer than this many seconds (jump cut). 0 disables. */
  silenceCutThresholdSeconds: z.number().min(0).default(0.6),
  /** Strip filler words ("um", "uh", "like") when cutting. */
  removeFillerWords: z.boolean().default(true),
});
export type PacingStyle = z.infer<typeof PacingStyle>;

export const ZoomStyle = z.object({
  /** Roughly how many punch-in zooms per minute. */
  perMinute: z.number().min(0).default(6),
  /** Zoom scale for a punch-in, e.g. 1.15 = 15% closer. */
  scale: z.number().min(1).max(3).default(1.18),
  /** Zoom ramp duration in seconds. */
  rampSeconds: z.number().min(0).default(0.25),
  /** Human note on when zooms trigger (emphasis, new sentence, reactions...). */
  triggerNotes: z.string().default("On emphasized words and topic changes."),
});
export type ZoomStyle = z.infer<typeof ZoomStyle>;

export const SfxHabit = z.object({
  /** Filename in assets/sfx/ that this habit refers to. */
  file: z.string(),
  /** What the sound is ("whoosh", "pop", "ding", "riser"). */
  label: z.string(),
  /** When you tend to trigger it — free text used by the agent. */
  triggerNotes: z.string().default(""),
  /** Playback gain multiplier. */
  gain: z.number().min(0).max(4).default(1),
});
export type SfxHabit = z.infer<typeof SfxHabit>;

export const TransitionStyle = z.object({
  /** Named transition kinds you use, e.g. ["cut", "whip-pan", "zoom-blur"]. */
  kinds: z.array(z.string()).default(["cut"]),
  /** Default transition duration in seconds (ignored by hard cuts). */
  defaultDurationSeconds: z.number().min(0).default(0.3),
  triggerNotes: z.string().default("Hard cut by default; effects on scene changes."),
});
export type TransitionStyle = z.infer<typeof TransitionStyle>;

export const StyleProfile = z.object({
  version: z.literal(1).default(1),
  /** Free-text summary the agent writes describing the overall vibe. */
  summary: z.string().default(""),
  /** Target output frame, e.g. 1080x1920 vertical. */
  width: z.number().int().positive().default(1080),
  height: z.number().int().positive().default(1920),
  fps: z.number().int().positive().default(30),
  captions: CaptionStyle.default({}),
  pacing: PacingStyle.default({}),
  zoom: ZoomStyle.default({}),
  transitions: TransitionStyle.default({}),
  /** The sound kit extracted from your example videos. */
  sfx: z.array(SfxHabit).default([]),
  /** Anything not captured above, in the agent's words. */
  notes: z.string().default(""),
});
export type StyleProfile = z.infer<typeof StyleProfile>;

/* ------------------------------------------------------------------ */
/* EDL — the per-video multi-track timeline                            */
/* ------------------------------------------------------------------ */

/** A single word with its timing, used to drive animated captions. */
export const CaptionWord = z.object({
  text: z.string(),
  startMs: z.number().min(0),
  endMs: z.number().min(0),
  /** Emphasize this word (highlight color / scale bump). */
  emphasis: z.boolean().default(false),
});
export type CaptionWord = z.infer<typeof CaptionWord>;

/**
 * A source clip placed on the main timeline. The final video is the ordered
 * concatenation of the `main` track's clips; `broll` clips overlay on top for
 * their duration.
 */
export const ClipEvent = z.object({
  type: z.literal("clip"),
  /** Which track: the primary sequence, or an overlaid B-roll insert. */
  track: z.enum(["main", "broll"]).default("main"),
  /** Path to the source video file (relative to the job/materials dir). */
  src: z.string(),
  /** In/out points within the source file, in seconds. */
  inSeconds: z.number().min(0),
  outSeconds: z.number().min(0),
  /** Where this clip starts on the OUTPUT timeline, in seconds. */
  timelineStartSeconds: z.number().min(0),
  /** Optional label for the agent's own bookkeeping. */
  label: z.string().optional(),
  /** Mute this clip's audio (common for B-roll over talking-head audio). */
  muted: z.boolean().default(false),
});
export type ClipEvent = z.infer<typeof ClipEvent>;

export const CaptionEvent = z.object({
  type: z.literal("caption"),
  /** Output-timeline start/end for the whole caption group, in seconds. */
  startSeconds: z.number().min(0),
  endSeconds: z.number().min(0),
  words: z.array(CaptionWord).min(1),
  /** Optional per-caption override of the profile's caption style. */
  styleOverride: CaptionStyle.partial().optional(),
});
export type CaptionEvent = z.infer<typeof CaptionEvent>;

export const ZoomEvent = z.object({
  type: z.literal("zoom"),
  startSeconds: z.number().min(0),
  endSeconds: z.number().min(0),
  scale: z.number().min(1).max(3).default(1.18),
  /** Focal point of the zoom, normalized within the frame. */
  focusX: Norm.default(0.5),
  focusY: Norm.default(0.5),
  rampSeconds: z.number().min(0).default(0.25),
});
export type ZoomEvent = z.infer<typeof ZoomEvent>;

export const SfxEvent = z.object({
  type: z.literal("sfx"),
  /** Filename in assets/sfx/. */
  file: z.string(),
  atSeconds: z.number().min(0),
  gain: z.number().min(0).max(4).default(1),
});
export type SfxEvent = z.infer<typeof SfxEvent>;

export const TransitionEvent = z.object({
  type: z.literal("transition"),
  /** Named kind, must exist in the profile's transition kinds or be "cut". */
  kind: z.string().default("cut"),
  /** Center point on the output timeline where the transition sits. */
  atSeconds: z.number().min(0),
  durationSeconds: z.number().min(0).default(0.3),
  /** Optional path to a transition overlay clip (your own asset). */
  overlaySrc: z.string().optional(),
});
export type TransitionEvent = z.infer<typeof TransitionEvent>;

export const EdlEvent = z.discriminatedUnion("type", [
  ClipEvent,
  CaptionEvent,
  ZoomEvent,
  SfxEvent,
  TransitionEvent,
]);
export type EdlEvent = z.infer<typeof EdlEvent>;

export const Edl = z
  .object({
    version: z.literal(1).default(1),
    width: z.number().int().positive().default(1080),
    height: z.number().int().positive().default(1920),
    fps: z.number().int().positive().default(30),
    /** Total output duration in seconds. Must cover every event. */
    durationSeconds: z.number().positive(),
    /** Background color shown where no clip covers the frame. */
    backgroundColor: HexColor.default("#000000"),
    events: z.array(EdlEvent).default([]),
  })
  .superRefine((edl, ctx) => {
    for (const [i, ev] of edl.events.entries()) {
      const end =
        "endSeconds" in ev
          ? ev.endSeconds
          : "atSeconds" in ev
            ? ev.atSeconds
            : "timelineStartSeconds" in ev
              ? ev.timelineStartSeconds
              : 0;
      if (end > edl.durationSeconds + 0.001) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Event ${i} (${ev.type}) ends at ${end}s, past durationSeconds ${edl.durationSeconds}s`,
          path: ["events", i],
        });
      }
      if ("inSeconds" in ev && ev.outSeconds <= ev.inSeconds) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Clip event ${i} has outSeconds <= inSeconds`,
          path: ["events", i],
        });
      }
    }
  });
export type Edl = z.infer<typeof Edl>;

/* ------------------------------------------------------------------ */
/* Parse helpers                                                       */
/* ------------------------------------------------------------------ */

export function parseStyleProfile(data: unknown): StyleProfile {
  return StyleProfile.parse(data);
}

export function parseEdl(data: unknown): Edl {
  return Edl.parse(data);
}
