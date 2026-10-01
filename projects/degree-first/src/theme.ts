import { Easing, interpolate, spring } from "remotion";

/** Degree First brand tokens — mirrors scholarship-companion/design/src/core.css. */
export const C = {
  paper: "oklch(0.976 0.009 95)",
  surface: "oklch(0.992 0.004 95)",
  sand: "oklch(0.945 0.016 92)",
  ink: "oklch(0.27 0.03 170)",
  inkSoft: "oklch(0.44 0.025 170)",
  inkFaint: "oklch(0.56 0.018 170)",
  line: "oklch(0.885 0.014 120)",
  lineSoft: "oklch(0.925 0.010 110)",
  primary: "oklch(0.46 0.095 168)",
  primaryDeep: "oklch(0.37 0.085 168)",
  primaryTint: "oklch(0.935 0.032 168)",
  primaryTint2: "oklch(0.965 0.018 168)",
  gold: "oklch(0.80 0.125 88)",
  goldDeep: "oklch(0.55 0.115 78)",
  goldTint: "oklch(0.955 0.045 90)",
  amberInk: "oklch(0.50 0.105 70)",
  amberTint: "oklch(0.945 0.045 85)",
  clay: "oklch(0.52 0.13 38)",
  clayTint: "oklch(0.945 0.028 38)",
  // Night palette for the pain + inspire acts.
  night: "oklch(0.16 0.018 170)",
  night2: "oklch(0.21 0.025 170)",
  nightLine: "oklch(0.32 0.03 170)",
  alarm: "oklch(0.63 0.2 27)",
};

export const F = {
  display: "'Bricolage Grotesque', sans-serif",
  body: "'Onest', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const W = 1080;
export const H = 1920;

export const ease = {
  out: Easing.out(Easing.poly(5)),
  inOut: Easing.inOut(Easing.cubic),
  in: Easing.in(Easing.cubic),
  inExpo: Easing.in(Easing.poly(5)),
};

/** Time-based tween in seconds, clamped both sides. */
export function tw(
  t: number,
  t0: number,
  t1: number,
  from: number,
  to: number,
  easing: (x: number) => number = ease.out,
) {
  return interpolate(t, [t0, t1], [from, to], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** Spring that starts at `start` seconds. 0 → 1 (with optional overshoot). */
export function sp(
  t: number,
  fps: number,
  start: number,
  cfg: { damping?: number; stiffness?: number; mass?: number } = {},
) {
  return spring({
    frame: Math.round((t - start) * fps),
    fps,
    config: { damping: cfg.damping ?? 16, stiffness: cfg.stiffness ?? 140, mass: cfg.mass ?? 0.9 },
  });
}

export type CamKey = { t: number; x: number; y: number; s: number };

/**
 * Spring camera. Each key springs from the previous pose. x/y are the point (in
 * scene px) that ends up at the frame centre; s is the zoom.
 */
export function camera(t: number, fps: number, keys: CamKey[], cfg = { damping: 22, stiffness: 120, mass: 1 }) {
  let pose = { x: keys[0].x, y: keys[0].y, s: keys[0].s };
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t < k.t) break;
    const p = sp(t, fps, k.t, cfg);
    pose = {
      x: pose.x + (k.x - pose.x) * p,
      y: pose.y + (k.y - pose.y) * p,
      s: pose.s + (k.s - pose.s) * p,
    };
  }
  return pose;
}

/** Deterministic pseudo-random in [0,1). */
export function rnd(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
