import React from "react";
import { C, F } from "../theme.js";

/** UI primitives authored at the app's native 390px-wide scale (see design/src/core.css). */

export const Chip: React.FC<{ kind: "strong" | "possible" | "no"; style?: React.CSSProperties }> = ({ kind, style }) => {
  const map = {
    strong: { bg: C.primaryTint, fg: C.primaryDeep, dot: C.primary, label: "Strong match" },
    possible: { bg: C.amberTint, fg: C.amberInk, dot: "transparent", label: "Possible match" },
    no: { bg: C.clayTint, fg: C.clay, dot: C.clay, label: "Not eligible" },
  }[kind];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12.5,
        fontWeight: 600,
        padding: "4px 11px",
        borderRadius: 999,
        background: map.bg,
        color: map.fg,
        fontFamily: F.body,
        ...style,
      }}
    >
      <span
        style={{
          width: kind === "possible" ? 5 : 7,
          height: kind === "possible" ? 5 : 7,
          borderRadius: "50%",
          background: map.dot,
          border: kind === "possible" ? `2px solid ${C.goldDeep}` : undefined,
        }}
      />
      {map.label}
    </span>
  );
};

export const Fund: React.FC<{ full?: boolean }> = ({ full = true }) => (
  <span
    style={{
      display: "inline-block",
      fontSize: 11.5,
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      padding: "3px 9px",
      borderRadius: 5,
      fontFamily: F.body,
      background: full ? C.primary : C.goldTint,
      color: full ? "oklch(0.97 0.01 168)" : C.goldDeep,
      border: full ? undefined : "1px solid oklch(0.86 0.07 88)",
    }}
  >
    {full ? "Fully funded" : "Partial funding"}
  </span>
);

export const Due: React.FC<{ day: string; mon: string }> = ({ day, mon }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minWidth: 54,
      borderRadius: 12,
      background: C.surface,
      border: `1px solid ${C.line}`,
      padding: "7px 8px 6px",
      lineHeight: 1.1,
    }}
  >
    <span style={{ fontFamily: F.display, fontSize: 19, fontWeight: 700, color: C.ink }}>{day}</span>
    <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: C.inkFaint }}>{mon}</span>
  </div>
);

export const Verified: React.FC<{ text: string; size?: number }> = ({ text, size = 12 }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: size, color: C.inkFaint }}>
    <svg width={size + 2} height={size + 2} viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6.6" fill="none" stroke={C.primary} strokeWidth="1.5" />
      <path d="M5.2 8.2l1.9 1.9 3.8-4" fill="none" stroke={C.primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    {text}
  </span>
);

export type TickKind = "yes" | "ask" | "no" | "open";
export const Tick: React.FC<{ kind: TickKind; p?: number }> = ({ kind, p = 1 }) => {
  const m = {
    yes: { bg: C.primaryTint, fg: C.primaryDeep, ch: "✓" },
    ask: { bg: C.amberTint, fg: C.amberInk, ch: "…" },
    no: { bg: C.clayTint, fg: C.clay, ch: "✕" },
    open: { bg: C.surface, fg: C.inkFaint, ch: "" },
  }[kind];
  return (
    <span
      style={{
        flex: "none",
        width: 22,
        height: 22,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        background: m.bg,
        color: m.fg,
        border: kind === "open" ? `1.5px dashed ${C.line}` : undefined,
        transform: `scale(${0.6 + 0.4 * p})`,
      }}
    >
      <span style={{ transform: `scale(${p})`, display: "inline-block" }}>{m.ch}</span>
    </span>
  );
};

export const Status: React.FC<{ s: "ready" | "progress" | "open" | "request" | "submitted" }> = ({ s }) => {
  const m = {
    ready: { bg: C.primaryTint, fg: C.primaryDeep, l: "Ready" },
    progress: { bg: C.amberTint, fg: C.amberInk, l: "In progress" },
    open: { bg: C.sand, fg: C.inkFaint, l: "Not started" },
    request: { bg: C.amberTint, fg: C.amberInk, l: "To request" },
    submitted: { bg: C.primary, fg: "oklch(0.97 0.01 168)", l: "Submitted" },
  }[s];
  return (
    <span
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 6,
        background: m.bg,
        color: m.fg,
        whiteSpace: "nowrap",
      }}
    >
      {m.l}
    </span>
  );
};

/** The gold thread — the one next step. */
export const NextStep: React.FC<{ kicker?: string; text: React.ReactNode; glow?: number; style?: React.CSSProperties }> = ({
  kicker = "Your next step",
  text,
  glow = 0,
  style,
}) => (
  <div
    style={{
      background: C.goldTint,
      border: "1px solid oklch(0.87 0.06 90)",
      borderRadius: 18,
      padding: "14px 16px",
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      boxShadow: glow > 0 ? `0 0 ${40 * glow}px ${8 * glow}px oklch(0.85 0.13 88 / ${0.45 * glow})` : undefined,
      ...style,
    }}
  >
    <div
      style={{
        flex: "none",
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: C.gold,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M3 11a5 5 0 0 1 10 0z" fill="oklch(0.35 0.08 80)" />
      </svg>
    </div>
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.goldDeep,
        }}
      >
        {kicker}
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink, lineHeight: 1.35 }}>{text}</div>
    </div>
  </div>
);

/** A phone: rounded device frame with the app's paper screen. Children are laid out at 390px. */
export const Phone: React.FC<{ children: React.ReactNode; height?: number; style?: React.CSSProperties }> = ({
  children,
  height = 844,
  style,
}) => (
  <div
    style={{
      width: 390 + 24,
      height: height + 24,
      borderRadius: 62,
      background: "oklch(0.22 0.02 170)",
      padding: 12,
      boxShadow: "0 60px 120px -30px oklch(0.25 0.04 170 / 0.45), 0 0 0 1.5px oklch(0.35 0.02 170)",
      ...style,
    }}
  >
    <div
      style={{
        width: 390,
        height,
        borderRadius: 50,
        overflow: "hidden",
        background: C.paper,
        position: "relative",
        fontFamily: F.body,
        color: C.ink,
        fontSize: 15,
        lineHeight: 1.5,
      }}
    >
      <div
        style={{
          height: 54,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "0 30px 6px",
          fontSize: 14,
          fontWeight: 600,
          color: C.inkSoft,
        }}
      >
        <span>9:41</span>
        <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <svg width="18" height="11" viewBox="0 0 18 11">
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={i * 4.6} y={8 - i * 2.4} width="3.2" height={3 + i * 2.4} rx="0.8" fill={C.inkSoft} />
            ))}
          </svg>
          <svg width="25" height="12" viewBox="0 0 25 12">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke={C.inkSoft} />
            <rect x="2.5" y="2.5" width="15" height="7" rx="1.5" fill={C.inkSoft} />
          </svg>
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 11,
          left: "50%",
          transform: "translateX(-50%)",
          width: 118,
          height: 34,
          borderRadius: 20,
          background: "oklch(0.18 0.01 170)",
        }}
      />
      {children}
    </div>
  </div>
);

/** Touch indicator for taps (Notion-style soft cursor). */
export const Touch: React.FC<{ x: number; y: number; press: number; visible: number }> = ({ x, y, press, visible }) => (
  <div
    style={{
      position: "absolute",
      left: x - 22,
      top: y - 22,
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: "oklch(0.3 0.03 170 / 0.22)",
      border: "2px solid oklch(0.99 0 0 / 0.9)",
      boxShadow: "0 6px 18px oklch(0.2 0.03 170 / 0.25)",
      transform: `scale(${1 - 0.22 * press})`,
      opacity: visible,
      pointerEvents: "none",
    }}
  />
);

/** Desktop pointer arrow. */
export const Pointer: React.FC<{ x: number; y: number; scale?: number; grab?: boolean }> = ({ x, y, scale = 1, grab }) => (
  <svg
    width={28 * scale}
    height={34 * scale}
    viewBox="0 0 28 34"
    style={{ position: "absolute", left: x, top: y, zIndex: 20, filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.3))", overflow: "visible" }}
  >
    {grab ? (
      <g>
        <circle cx="10" cy="10" r="11" fill="white" stroke="#111" strokeWidth="2" />
        <circle cx="10" cy="10" r="4" fill="#111" />
      </g>
    ) : (
      <path d="M2 2 L2 26 L8.5 20 L13 31 L17.5 29 L13 18.5 L22 18.5 Z" fill="white" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
    )}
  </svg>
);
