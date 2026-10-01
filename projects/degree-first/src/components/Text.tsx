import React from "react";
import { C, F, ease, tw } from "../theme.js";

/**
 * Kinetic headline: each word rises out of a mask with a short stagger and
 * de-blurs. Exits by sliding up. Times are scene-local seconds.
 */
export const Kinetic: React.FC<{
  t: number;
  text: string;
  start: number;
  end?: number;
  size?: number;
  color?: string;
  weight?: number;
  stagger?: number;
  align?: "center" | "left";
  highlight?: string[];
  highlightColor?: string;
  lineHeight?: number;
  maxWidth?: number;
  style?: React.CSSProperties;
}> = ({
  t,
  text,
  start,
  end = 1e9,
  size = 96,
  color = C.ink,
  weight = 700,
  stagger = 0.06,
  align = "center",
  highlight = [],
  highlightColor = C.primary,
  lineHeight = 1.04,
  maxWidth = 960,
  style,
}) => {
  if (t < start - 0.01 || t > end + 0.5) return null;
  const lines = text.split("|");
  let wi = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start", ...style }}>
      {lines.map((line, li) => (
    <div
      key={li}
      style={{
        fontFamily: F.display,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: "-0.035em",
        lineHeight,
        color,
        textAlign: align,
        maxWidth,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: size * 0.24,
        marginTop: li > 0 ? -size * 0.14 : 0,
      }}
    >
      {line.split(" ").map((w) => {
        const i = wi++;
        const s = start + i * stagger;
        const inP = tw(t, s, s + 0.55, 0, 1, ease.out);
        const outP = tw(t, end + i * 0.025, end + 0.3 + i * 0.025, 0, 1, ease.in);
        const y = (1 - inP) * 105 - outP * 105;
        const blur = (1 - inP) * 10 + outP * 6;
        const clean = w.replace(/[.,!?]/g, "");
        const hl = highlight.some((h) => h.replace(/[.,!?]/g, "") === clean);
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: "0.06em 0.02em 0.12em" }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${y}%)`,
                filter: `blur(${blur}px)`,
                color: hl ? highlightColor : undefined,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
      ))}
    </div>
  );
};

/** Small uppercase label used above headlines (Notion-style eyebrow). */
export const Eyebrow: React.FC<{ t: number; start: number; text: string; color?: string; end?: number }> = ({
  t,
  start,
  text,
  color = C.primary,
  end = 1e9,
}) => {
  const p = tw(t, start, start + 0.5, 0, 1);
  const o = tw(t, end, end + 0.25, 1, 0, ease.in);
  return (
    <div
      style={{
        fontFamily: F.body,
        fontWeight: 700,
        fontSize: 30,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
        opacity: p * o,
        transform: `translateY(${(1 - p) * 20}px)`,
      }}
    >
      {text}
    </div>
  );
};
