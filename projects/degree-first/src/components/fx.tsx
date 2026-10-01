import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { C, rnd } from "../theme.js";

export const NightBg: React.FC<{ tint?: string }> = ({ tint = C.night2 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(130% 85% at 50% 38%, ${tint} 0%, ${C.night} 72%)` }} />
);

export const PaperBg: React.FC<{ glow?: boolean }> = ({ glow = true }) => (
  <AbsoluteFill
    style={{
      background: glow
        ? `radial-gradient(90% 55% at 50% 72%, ${C.primaryTint2} 0%, ${C.paper} 70%)`
        : C.paper,
    }}
  >
    {/* faint dotted grid, Notion-launch style */}
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${C.line} 1.4px, transparent 1.6px)`,
        backgroundSize: "36px 36px",
        opacity: 0.55,
        maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
      }}
    />
  </AbsoluteFill>
);

/** Animated film grain; shifts the tile every 2 frames. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.08 }) => {
  const f = Math.floor(useCurrentFrame() / 2);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile("noise.png")})`,
        backgroundSize: "256px 256px",
        backgroundPosition: `${Math.floor(rnd(f) * 256)}px ${Math.floor(rnd(f + 99) * 256)}px`,
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(120% 75% at 50% 50%, transparent 55%, oklch(0.1 0.01 170 / ${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/** Slow drifting dust particles for the dark scenes. */
export const Dust: React.FC<{ t: number; n?: number; color?: string; seed?: number }> = ({
  t,
  n = 40,
  color = "oklch(0.9 0.05 168)",
  seed = 1,
}) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {Array.from({ length: n }).map((_, i) => {
      const x = rnd(i * 3 + seed) * 1080;
      const y0 = rnd(i * 7 + seed) * 1920;
      const sp = 12 + rnd(i * 11 + seed) * 30;
      const y = (((y0 - t * sp) % 1920) + 1920) % 1920;
      const r = 1.2 + rnd(i * 13 + seed) * 2.6;
      const o = 0.15 + 0.4 * rnd(i * 17 + seed) * (0.6 + 0.4 * Math.sin(t * 1.3 + i));
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x + Math.sin(t * 0.6 + i) * 14,
            top: y,
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            background: color,
            opacity: o,
            boxShadow: `0 0 ${r * 4}px ${color}`,
          }}
        />
      );
    })}
  </AbsoluteFill>
);
