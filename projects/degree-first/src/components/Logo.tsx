import React from "react";
import { C, F } from "../theme.js";

/**
 * Degree First mark: a student (gold head + stem) inside the path that becomes the D.
 * `draw` 0→1 strokes the path on; `dot` 0→1 scales the head in (spring-friendly, may overshoot).
 */
export const MARK_PATH = "M36 50 V92 H58 C78 92 92 78 92 60 C92 42 78 28 58 28";
const PATH_LEN = 1;

export const Mark: React.FC<{
  size: number;
  stroke?: string;
  dotColor?: string;
  draw?: number;
  dot?: number;
  glow?: number;
}> = ({ size, stroke = C.primary, dotColor = C.gold, draw = 1, dot = 1, glow = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" style={{ overflow: "visible" }}>
    {glow > 0 && (
      <circle cx="36" cy="28" r={9 + 30 * glow} fill={dotColor} opacity={0.18 * glow} style={{ filter: "blur(6px)" }} />
    )}
    <path
      d={MARK_PATH}
      pathLength={1}
      fill="none"
      stroke={stroke}
      strokeWidth={14}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={PATH_LEN}
      strokeDashoffset={PATH_LEN * (1 - draw)}
      opacity={draw > 0.001 ? 1 : 0}
    />
    <circle cx="36" cy="28" r={9.5 * Math.max(0, dot)} fill={dotColor} />
  </svg>
);

export const Wordmark: React.FC<{ size: number; color?: string; reveal?: number }> = ({
  size,
  color = C.ink,
  reveal = 1,
}) => (
  <div
    style={{
      fontFamily: F.display,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: "-0.035em",
      color,
      whiteSpace: "nowrap",
      clipPath: `inset(-20% ${100 - reveal * 100}% -20% 0)`,
      lineHeight: 1,
    }}
  >
    Degree First
  </div>
);
