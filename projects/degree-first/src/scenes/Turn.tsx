import React from "react";
import { AbsoluteFill } from "remotion";
import { C, ease, rnd, sp, tw } from "../theme.js";
import { Mark, Wordmark } from "../components/Logo.js";
import { Kinetic } from "../components/Text.js";
import { Grain, NightBg, PaperBg } from "../components/fx.js";
import { PortalWindow } from "./Pain.js";

/**
 * 15–19s. The chaos is pulled into one gold point, which becomes the head of
 * the Degree First mark. Night flips to paper with a circular wipe.
 */
export const Turn: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const IMPACT = 1.0;
  const wipe = tw(t, IMPACT, IMPACT + 0.7, 0, 1, ease.out);
  const ring = tw(t, IMPACT, IMPACT + 0.9, 0, 1, ease.out);
  const dotGrow = tw(t, 0, IMPACT, 0.25, 1, ease.inExpo);
  const dotSpring = sp(t, fps, IMPACT, { damping: 9, stiffness: 160, mass: 0.7 });
  const draw = tw(t, IMPACT + 0.08, IMPACT + 0.85, 0, 1, ease.inOut);
  const word = tw(t, IMPACT + 0.55, IMPACT + 1.15, 0, 1, ease.out);
  // exit: logo lifts away at 3.75 (=18.75 abs)
  const exit = tw(t, 3.72, 4.0, 0, 1, ease.in);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <NightBg />
      {/* suck-in of the chaos */}
      {t < IMPACT + 0.05 &&
        Array.from({ length: 22 }).map((_, i) => {
          const a0 = rnd(i + 1) * Math.PI * 2;
          const r0 = 900 + rnd(i + 7) * 500;
          const st = rnd(i + 3) * 0.25;
          const p = tw(t, st, IMPACT, 0, 1, ease.inExpo);
          const a = a0 + p * 2.2;
          const r = r0 * (1 - p);
          const s = 0.55 * (1 - p) + 0.02;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 540 + Math.cos(a) * r - 300,
                top: 960 + Math.sin(a) * r - 200,
                transform: `scale(${s}) rotate(${a * 40}deg)`,
                opacity: 1 - p * 0.6,
              }}
            >
              <PortalWindow i={i} />
            </div>
          );
        })}
      {/* gold point gathering energy */}
      {t < IMPACT + 0.1 && (
        <div
          style={{
            position: "absolute",
            left: 540 - 40 * dotGrow,
            top: 960 - 40 * dotGrow,
            width: 80 * dotGrow,
            height: 80 * dotGrow,
            borderRadius: "50%",
            background: C.gold,
            boxShadow: `0 0 ${120 * dotGrow}px ${40 * dotGrow}px oklch(0.85 0.13 88 / 0.55)`,
          }}
        />
      )}
      {/* paper wipe */}
      <AbsoluteFill style={{ clipPath: `circle(${wipe * 1300}px at 540px 960px)` }}>
        <PaperBg />
      </AbsoluteFill>
      {/* shockwave ring */}
      {t > IMPACT && ring < 1 && (
        <div
          style={{
            position: "absolute",
            left: 540 - ring * 900,
            top: 960 - ring * 900,
            width: ring * 1800,
            height: ring * 1800,
            borderRadius: "50%",
            border: `${10 * (1 - ring)}px solid ${C.gold}`,
            opacity: 1 - ring,
          }}
        />
      )}
      {t >= IMPACT && (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            transform: `translateY(${-exit * 900}px)`,
            opacity: 1 - exit,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36, marginTop: -120 }}>
            <div style={{ transform: `scale(${0.85 + 0.15 * tw(t, IMPACT, IMPACT + 1.4, 0, 1)})` }}>
              <Mark size={380} draw={draw} dot={dotSpring} glow={tw(t, IMPACT, IMPACT + 1.2, 1, 0.25)} />
            </div>
            <div style={{ transform: `translateY(${(1 - word) * 40}px)` }}>
              <Wordmark size={132} reveal={word} />
            </div>
            <div style={{ height: 20 }} />
            <Kinetic t={t} text="Every scholarship application." start={2.3} size={62} weight={600} color={C.inkSoft} stagger={0.04} />
            <div style={{ marginTop: -24 }}>
              <Kinetic t={t} text="One clear path." start={2.6} size={62} weight={700} color={C.primary} stagger={0.05} />
            </div>
          </div>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ opacity: 1 - wipe }}>
        <Grain />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
