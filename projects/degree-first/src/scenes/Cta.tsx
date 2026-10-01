import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F, ease, sp, tw } from "../theme.js";
import { Mark, Wordmark } from "../components/Logo.js";
import { Kinetic } from "../components/Text.js";
import { Dust, Grain } from "../components/fx.js";

/** 60–66s. App icon, wordmark, the one gold action: join the waitlist. */
export const Cta: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const icon = sp(t, fps, 0.0, { damping: 11, stiffness: 150, mass: 0.8 });
  const draw = tw(t, 0.1, 0.8, 0, 1, ease.inOut);
  const word = tw(t, 0.45, 1.0, 0, 1);
  const btn = sp(t, fps, 1.6, { damping: 10, stiffness: 220, mass: 0.7 });
  const pulse = t > 2.0 ? 0.5 + 0.5 * Math.sin((t - 2.0) * Math.PI * 2) : 0;
  const shimmer = tw(t, 2.2, 3.0, -0.3, 1.3, ease.inOut);
  const bio = tw(t, 2.2, 2.6, 0, 1);
  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: `radial-gradient(100% 60% at 50% 42%, oklch(0.36 0.08 168) 0%, oklch(0.2 0.04 168) 75%)`,
      }}
    >
      <Dust t={t + 60} n={45} color="oklch(0.88 0.12 88)" seed={4} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 0 }}>
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: 74,
            background: C.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${icon}) rotate(${(1 - icon) * -12}deg)`,
            boxShadow: "0 50px 100px -30px oklch(0.1 0.03 168 / 0.8), inset 0 2px 0 oklch(1 0 0 / 0.15)",
            marginBottom: 56,
          }}
        >
          <Mark size={250} stroke={C.paper} draw={draw} dot={sp(t, fps, 0.15, { damping: 8, stiffness: 180 })} glow={0.5} />
        </div>
        <div style={{ transform: `translateY(${(1 - word) * 30}px)` }}>
          <Wordmark size={140} color={C.paper} reveal={word} />
        </div>
        <div style={{ marginTop: 34 }}>
          <Kinetic t={t} text="Every application. One clear path." start={0.9} size={54} weight={600} color="oklch(0.88 0.03 168)" stagger={0.04} />
        </div>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            marginTop: 90,
            padding: "38px 74px",
            borderRadius: 999,
            background: C.gold,
            color: "oklch(0.25 0.05 80)",
            fontFamily: F.body,
            fontWeight: 750,
            fontSize: 60,
            transform: `scale(${btn * (1 + 0.025 * pulse)})`,
            boxShadow: `0 0 ${50 + 40 * pulse}px ${10 + 10 * pulse}px oklch(0.8 0.13 88 / ${0.35 + 0.2 * pulse})`,
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
          Join the waitlist <span style={{ fontSize: 64 }}>→</span>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(105deg, transparent ${shimmer * 100 - 14}%, oklch(1 0 0 / 0.6) ${shimmer * 100}%, transparent ${shimmer * 100 + 14}%)`,
            }}
          />
        </div>
        <div
          style={{
            marginTop: 44,
            fontFamily: F.body,
            fontWeight: 650,
            fontSize: 42,
            letterSpacing: "0.02em",
            color: "oklch(0.9 0.02 168)",
            opacity: bio,
            transform: `translateY(${(1 - bio) * 20}px)`,
          }}
        >
          Link in bio
        </div>
      </AbsoluteFill>
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};
