import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F, ease, rnd, sp, tw } from "../theme.js";
import { Kinetic } from "../components/Text.js";
import { Dust, Grain, NightBg, Vignette } from "../components/fx.js";

type SceneProps = { t: number; fps: number };

/* ------------------------------------------------------------------ */
/* Portals: every scholarship lives behind a different website.        */
/* All names are fictional (product rule 5).                           */
/* ------------------------------------------------------------------ */
export const PORTALS = [
  { name: "Northbridge Global Scholars Award", url: "apply.northbridgetrust.org/portal", hue: 250, kind: 0 },
  { name: "European Futures Fellowship", url: "portal.ef-foundation.eu/login", hue: 300, kind: 1 },
  { name: "Atlantic Graduate Opportunity Grant", url: "atlanticfund.org/apply/step-4", hue: 25, kind: 2 },
  { name: "Meridian Leaders Scholarship", url: "meridian-leaders.org/account", hue: 150, kind: 3 },
  { name: "Kestrel Foundation Masters Award", url: "kestrelfoundation.net/forms", hue: 200, kind: 1 },
  { name: "Southgate Fellowship", url: "southgate.ac/fellows/apply", hue: 60, kind: 0 },
  { name: "Halden Excellence Scholarship", url: "halden-university.ac/aid", hue: 330, kind: 2 },
  { name: "Orion Global Grant", url: "oriongrant.org/application", hue: 280, kind: 3 },
  { name: "Lumen Research Scholarship", url: "lumenresearch.org/apply", hue: 100, kind: 1 },
  { name: "Baobab Fund for Engineers", url: "baobabfund.org/portal", hue: 45, kind: 0 },
  { name: "Nordlys Study Abroad Award", url: "nordlys-award.org/form", hue: 220, kind: 2 },
  { name: "Cedar Women in STEM Grant", url: "cedargrant.org/apply", hue: 170, kind: 3 },
];

const Lines: React.FC<{ n: number; w?: number[] }> = ({ n, w = [90, 70, 82, 60] }) => (
  <>
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} style={{ height: 12, width: `${w[i % w.length]}%`, borderRadius: 6, background: "oklch(0.9 0.005 250)", marginBottom: 12 }} />
    ))}
  </>
);

export const PortalWindow: React.FC<{ i: number; w?: number }> = ({ i, w = 600 }) => {
  const p = PORTALS[i % PORTALS.length];
  const accent = `oklch(0.55 0.15 ${p.hue})`;
  return (
    <div
      style={{
        width: w,
        borderRadius: 18,
        overflow: "hidden",
        background: "oklch(0.985 0 0)",
        boxShadow: "0 40px 80px -20px oklch(0.05 0.01 170 / 0.7), 0 0 0 1px oklch(0.4 0.01 250 / 0.3)",
        fontFamily: F.body,
        color: "oklch(0.25 0.01 250)",
      }}
    >
      <div style={{ height: 52, background: "oklch(0.93 0.005 250)", display: "flex", alignItems: "center", gap: 10, padding: "0 18px" }}>
        {["oklch(0.7 0.18 25)", "oklch(0.8 0.15 85)", "oklch(0.72 0.17 145)"].map((c) => (
          <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
        ))}
        <div
          style={{
            marginLeft: 12,
            flex: 1,
            height: 32,
            borderRadius: 9,
            background: "white",
            fontSize: 17,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            color: "oklch(0.45 0.01 250)",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          🔒 {p.url}
        </div>
      </div>
      <div style={{ height: 10, background: accent }} />
      <div style={{ padding: "22px 26px 26px" }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 28, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-0.02em" }}>
          {p.name}
        </div>
        {p.kind === 0 && (
          <>
            {["Email address", "Password"].map((l) => (
              <div key={l} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 15, marginBottom: 6, color: "oklch(0.5 0.01 250)" }}>{l}</div>
                <div style={{ height: 40, borderRadius: 8, border: "1.5px solid oklch(0.85 0.005 250)" }} />
              </div>
            ))}
            <div style={{ height: 46, width: 170, borderRadius: 8, background: accent, color: "white", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
              Sign in
            </div>
          </>
        )}
        {p.kind === 1 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Step 4 of 9 · Supporting documents</div>
            <div style={{ height: 10, borderRadius: 5, background: "oklch(0.92 0.005 250)", marginBottom: 16 }}>
              <div style={{ width: "40%", height: "100%", borderRadius: 5, background: accent }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {["Transcript", "Reference", "Passport"].map((d) => (
                <div key={d} style={{ flex: 1, height: 84, borderRadius: 10, border: "2px dashed oklch(0.82 0.005 250)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "oklch(0.55 0.01 250)" }}>
                  {d}
                </div>
              ))}
            </div>
          </>
        )}
        {p.kind === 2 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Personal statement (max. 750 words)</div>
            <div style={{ borderRadius: 10, border: "1.5px solid oklch(0.85 0.005 250)", padding: 16 }}>
              <Lines n={4} />
            </div>
          </>
        )}
        {p.kind === 3 && (
          <>
            <div
              style={{
                borderRadius: 10,
                background: "oklch(0.95 0.04 25)",
                color: "oklch(0.45 0.16 25)",
                padding: "14px 16px",
                fontWeight: 600,
                fontSize: 17,
                marginBottom: 14,
              }}
            >
              ⚠ Your session has expired. Please sign in again.
            </div>
            <Lines n={3} />
          </>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 0–4s  HOOK                                                          */
/* ------------------------------------------------------------------ */
export const Hook: React.FC<SceneProps> = ({ t, fps }) => {
  const slots = [
    [-120, 120, -7], [520, 60, 5], [180, 420, -3], [-60, 760, 6], [560, 640, -6], [140, 1040, 4],
    [-140, 1320, -5], [500, 1180, 7], [260, 1500, -4], [600, 1580, 3], [-20, 280, 3], [420, 900, -2],
  ];
  // camera shake that decays after each slam
  const lastSlam = Math.min(11, Math.floor(t / 0.25));
  const since = t - lastSlam * 0.25;
  const shakeAmp = t < 3 ? 14 * Math.exp(-since * 18) : 0;
  const sx = Math.sin(t * 90) * shakeAmp;
  const sy = Math.cos(t * 77) * shakeAmp;
  const dim = tw(t, 2.95, 3.3, 0, 1, ease.out);
  const lines = [
    { s: -0.6, e: 0.92, txt: "12 scholarships." },
    { s: 1.0, e: 1.92, txt: "12 portals." },
    { s: 2.0, e: 2.92, txt: "12 deadlines." },
  ];
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <NightBg />
      <AbsoluteFill
        style={{
          transform: `translate(${sx}px, ${sy}px) scale(${1 - 0.06 * dim + t * 0.012})`,
          filter: `blur(${dim * 10}px)`,
          opacity: 1 - 0.7 * dim,
        }}
      >
        {[[300, 260, 2], [-80, 980, -4], [520, 1380, 5]].map(([x, y, r], i) => (
          <div key={`pre${i}`} style={{ position: "absolute", left: x, top: y, transform: `rotate(${r}deg) scale(0.92)`, opacity: 0.55, filter: "blur(2px)" }}>
            <PortalWindow i={i + 6} />
          </div>
        ))}
        {slots.map(([x, y, r], i) => {
          const st = i * 0.25 - 0.02;
          if (t < st) return null;
          const p = sp(t, fps, st, { damping: 26, stiffness: 420, mass: 0.7 });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `rotate(${r}deg) scale(${1.4 - 0.4 * p})`,
                opacity: Math.min(1, p * 3),
              }}
            >
              <PortalWindow i={i} />
            </div>
          );
        })}
      </AbsoluteFill>
      {/* readability band */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom, transparent 32%, oklch(0.12 0.015 170 / ${0.88 * (1 - dim)}) 44%, oklch(0.12 0.015 170 / ${0.88 * (1 - dim)}) 56%, transparent 68%)`,
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {lines.map((l) => (
          <div key={l.txt} style={{ position: "absolute" }}>
            <Kinetic t={t} text={l.txt} start={l.s} end={l.e} size={138} color="oklch(0.98 0.005 95)" stagger={0.05} maxWidth={1060} />
          </div>
        ))}
        <div style={{ position: "absolute", display: "flex", alignItems: "center" }}>
          <Kinetic t={t} text="And one of you." start={3.05} size={110} color="oklch(0.98 0.005 95)" weight={600} />
          {t > 3.3 && (
            <div
              style={{
                width: 8,
                height: 110,
                marginLeft: 14,
                background: C.gold,
                opacity: Math.floor(t * 3) % 2 === 0 ? 1 : 0,
              }}
            />
          )}
        </div>
      </AbsoluteFill>
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 4–8s  QUESTIONS — the mental load                                   */
/* ------------------------------------------------------------------ */
const TOASTS = [
  { app: "Notes", c: 85, txt: "Did I send the reference letter?" },
  { app: "Calendar", c: 25, txt: "Deadline 23:59 GMT. Is that my time?" },
  { app: "Mail", c: 250, txt: "Your application is incomplete." },
  { app: "Notes", c: 85, txt: "Certified transcript, or a scan?" },
  { app: "Portal", c: 300, txt: "Session expired. Sign in again." },
  { app: "Notes", c: 85, txt: "Essay limit: 500 words or 750?" },
  { app: "Mail", c: 250, txt: "Re: Re: Re: Application status?" },
  { app: "Portal", c: 300, txt: "Error 404. Page not found." },
];
const FLOOD = [
  "IELTS required?", "Upload failed", "Which portal was this?", "Password reset", "Deadline moved?",
  "Missing document", "Did they reply?", "Which essay prompt?", "Reference: 2 or 3?", "Is it still open?",
  "Draft not saved", "Status: pending", "Wrong file format", "Verify your email",
];

const Toast: React.FC<{ app: string; hue: number; txt: string; scale?: number }> = ({ app, hue, txt, scale = 1 }) => (
  <div
    style={{
      width: 880 * scale,
      borderRadius: 34 * scale,
      padding: `${22 * scale}px ${26 * scale}px`,
      background: "oklch(0.3 0.015 170 / 0.82)",
      backdropFilter: "blur(20px)",
      border: "1px solid oklch(0.5 0.02 170 / 0.35)",
      boxShadow: "0 30px 60px -20px oklch(0.05 0.01 170 / 0.8)",
      display: "flex",
      gap: 20 * scale,
      alignItems: "center",
      fontFamily: F.body,
      color: "oklch(0.97 0.005 95)",
    }}
  >
    <div
      style={{
        flex: "none",
        width: 64 * scale,
        height: 64 * scale,
        borderRadius: 16 * scale,
        background: `oklch(0.62 0.15 ${hue})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 30 * scale,
        fontWeight: 800,
        color: "white",
      }}
    >
      {app[0]}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22 * scale, opacity: 0.6, fontWeight: 600 }}>
        <span>{app.toUpperCase()}</span>
        <span>now</span>
      </div>
      <div style={{ fontSize: 34 * scale, fontWeight: 600, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {txt}
      </div>
    </div>
  </div>
);

export const Questions: React.FC<SceneProps> = ({ t, fps }) => {
  const push = 1 + 0.16 * tw(t, 0, 4, 0, 1, ease.inOut);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <NightBg tint="oklch(0.24 0.03 170)" />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        {TOASTS.map((q, i) => {
          const st = i * 0.45 - 0.12;
          if (t < st - 0.02) return null;
          const p = sp(t, fps, st, { damping: 18, stiffness: 260, mass: 0.8 });
          const side = i % 2 === 0 ? -1 : 1;
          const x = 100 + (rnd(i + 3) - 0.5) * 120 + side * (1 - p) * 900;
          const y = 260 + i * 175 + (rnd(i + 9) - 0.5) * 40;
          const r = (rnd(i + 21) - 0.5) * 7;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y, transform: `rotate(${r * p}deg)` }}>
              <Toast app={q.app} hue={q.c} txt={q.txt} />
            </div>
          );
        })}
        {FLOOD.map((txt, i) => {
          const st = 3.45 + i * 0.035;
          if (t < st) return null;
          const p = sp(t, fps, st, { damping: 20, stiffness: 300, mass: 0.6 });
          const x = rnd(i + 40) * 700 - 80;
          const y = rnd(i + 70) * 1800;
          return (
            <div
              key={`f${i}`}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `scale(${0.4 + 0.25 * p}) rotate(${(rnd(i + 5) - 0.5) * 16}deg)`,
                transformOrigin: "0 0",
                opacity: Math.min(1, p * 2),
              }}
            >
              <Toast app={["Mail", "Portal", "Notes"][i % 3]} hue={[250, 300, 85][i % 3]} txt={txt} />
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `oklch(0.1 0.01 170 / ${tw(t, 3.5, 4, 0, 0.35)})` }} />
      <Vignette strength={0.7} />
      <Grain />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 8–10s  THE SPREADSHEET                                               */
/* ------------------------------------------------------------------ */
const ROWS: [string, string, string, string, string?][] = [
  ["Northbridge Global Scholars", "14 Oct?", "submitted??", "ref letter", "warn"],
  ["European Futures Fellowship", "—", "check email", "IELTS ??", "bad"],
  ["Atlantic Opportunity Grant", "9 Jan", "not started", "essay x2"],
  ["Meridian Leaders", "passed?", "—", "transcript", "bad"],
  ["Kestrel Foundation", "30 Nov", "in progress", "which portal?", "warn"],
  ["Halden Excellence", "21 Oct", "??", "passport copy"],
  ["Southgate Fellowship", "Dec?", "draft", "2 references", "warn"],
  ["Lumen Research", "1 Dec", "account made", "IELTS, CV", "warn"],
  ["Baobab Fund", "?", "rejected?", "—", "bad"],
  ["Nordlys Award", "15 Jan", "not started", "motivation ltr"],
  ["Cedar STEM Grant", "Nov??", "pending", "certified copy", "warn"],
  ["Orion Global Grant", "", "", "", "bad"],
];

export const Sheet: React.FC<SceneProps> = ({ t, fps }) => {
  const enter = sp(t, fps, 0, { damping: 20, stiffness: 160 });
  const typed1 = "???".slice(0, Math.max(0, Math.floor((t - 0.4) / 0.08)));
  const typed2 = "ask who??".slice(0, Math.max(0, Math.floor((t - 1.2) / 0.06)));
  const cell = (txt: string, k: number, flag?: string, bold = false) => (
    <div
      key={k}
      style={{
        borderRight: "1px solid oklch(0.88 0.005 140)",
        borderBottom: "1px solid oklch(0.88 0.005 140)",
        padding: "0 12px",
        height: 78,
        display: "flex",
        alignItems: "center",
        fontSize: 25,
        fontWeight: bold ? 700 : 400,
        whiteSpace: "nowrap",
        overflow: "hidden",
        background:
          flag === "bad" ? "oklch(0.92 0.06 25)" : flag === "warn" ? "oklch(0.95 0.08 95)" : "white",
        color: flag === "bad" ? "oklch(0.45 0.17 25)" : "oklch(0.25 0.01 250)",
      }}
    >
      {txt}
    </div>
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <NightBg />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 210 }}>
        <Kinetic t={t} text="Your “system”." start={0.05} size={120} color="oklch(0.98 0.005 95)" />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 520,
          width: 1180,
          transform: `translateY(${(1 - enter) * 500}px) rotate(${-2.5 + t * 0.6}deg) scale(${1.12 + t * 0.03})`,
          transformOrigin: "30% 0",
          borderRadius: 18,
          overflow: "hidden",
          background: "white",
          boxShadow: "0 50px 100px -30px black",
          fontFamily: F.body,
        }}
      >
        <div style={{ height: 70, background: "oklch(0.45 0.12 150)", color: "white", display: "flex", alignItems: "center", padding: "0 24px", fontSize: 24, fontWeight: 700, gap: 14 }}>
          <span style={{ background: "white", color: "oklch(0.45 0.12 150)", borderRadius: 6, padding: "2px 8px", fontSize: 20 }}>X</span>
          scholarships_FINAL_v7 (2) — actual final.xlsx
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "56px 380px 170px 230px 260px" }}>
          {["", "Scholarship", "Deadline", "Status", "Still need"].map((h, k) => (
            <div key={k} style={{ height: 52, background: "oklch(0.95 0.005 140)", borderRight: "1px solid oklch(0.85 0.005 140)", borderBottom: "1px solid oklch(0.85 0.005 140)", display: "flex", alignItems: "center", padding: "0 12px", fontWeight: 700, fontSize: 20, color: "oklch(0.4 0.01 250)" }}>
              {h}
            </div>
          ))}
          {ROWS.map((r, i) => (
            <React.Fragment key={i}>
              {cell(String(i + 1), 0, undefined)}
              {cell(r[0], 1, undefined, true)}
              {cell(i === ROWS.length - 1 ? typed1 : r[1], 2, r[4])}
              {cell(r[2], 3, r[4] === "bad" ? "bad" : undefined)}
              {cell(i === ROWS.length - 1 ? typed2 : r[3], 4, r[4] === "warn" ? "warn" : undefined)}
            </React.Fragment>
          ))}
        </div>
      </div>
      <Vignette strength={0.75} />
      <Grain />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 10–12s  MISSED                                                       */
/* ------------------------------------------------------------------ */
export const Missed: React.FC<SceneProps> = ({ t, fps }) => {
  const stamp = sp(t, fps, 0.3, { damping: 14, stiffness: 380, mass: 0.7 });
  const since = t - 0.3;
  const shake = since > 0 ? 22 * Math.exp(-since * 10) : 0;
  const cardIn = sp(t, fps, 0, { damping: 22, stiffness: 200 });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <NightBg tint="oklch(0.22 0.04 25)" />
      <AbsoluteFill style={{ transform: `translate(${Math.sin(t * 95) * shake}px, ${Math.cos(t * 83) * shake}px)` }}>
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
          <Kinetic t={t} text="Miss one detail." start={0.0} size={124} color="oklch(0.98 0.005 95)" />
        </AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 90,
            top: 640,
            width: 900,
            borderRadius: 28,
            background: "oklch(0.985 0.003 95)",
            padding: "44px 48px",
            fontFamily: F.body,
            transform: `scale(${0.9 + 0.1 * cardIn}) translateY(${(1 - cardIn) * 80}px)`,
            boxShadow: "0 50px 100px -30px black",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.1em", color: C.inkFaint }}>NORTHBRIDGE TRUST</div>
          <div style={{ fontFamily: F.display, fontSize: 52, fontWeight: 700, lineHeight: 1.08, margin: "10px 0 22px", color: C.ink, letterSpacing: "-0.02em" }}>
            Global Scholars Award 2027
          </div>
          <div style={{ fontSize: 30, color: C.inkSoft, lineHeight: 1.4 }}>
            Applications closed on <b style={{ color: C.ink }}>14 October, 23:59 UK time</b>.
          </div>
          <div style={{ marginTop: 26, display: "inline-flex", alignItems: "center", gap: 12, background: "oklch(0.94 0.04 25)", color: "oklch(0.48 0.18 25)", fontWeight: 700, fontSize: 28, padding: "12px 20px", borderRadius: 14 }}>
            ● Closed 2 hours ago
          </div>
          <div style={{ marginTop: 22, fontSize: 28, color: C.inkFaint }}>Next intake opens September 2028.</div>
          <div
            style={{
              position: "absolute",
              right: 36,
              top: 236,
              transform: `rotate(-14deg) scale(${2.4 - 1.4 * stamp})`,
              opacity: Math.min(1, stamp * 2),
              border: `8px solid ${C.alarm}`,
              color: C.alarm,
              fontFamily: F.display,
              fontWeight: 800,
              fontSize: 92,
              padding: "4px 26px",
              borderRadius: 18,
              letterSpacing: "0.04em",
              mixBlendMode: "multiply",
            }}
          >
            MISSED
          </div>
        </div>
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 1330 }}>
          <Kinetic
            t={t}
            text="Lose a whole year."
            start={1.0}
            size={124}
            color="oklch(0.98 0.005 95)"
            highlight={["whole", "year"]}
            highlightColor="oklch(0.72 0.17 30)"
          />
        </AbsoluteFill>
      </AbsoluteFill>
      <Vignette strength={0.8} />
      <Grain />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 12–15s  REFLECT                                                      */
/* ------------------------------------------------------------------ */
export const Reflect: React.FC<SceneProps> = ({ t }) => {
  const push = 1 + 0.05 * t;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <NightBg tint="oklch(0.19 0.02 170)" />
      <Dust t={t + 12} n={50} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${push})`, gap: 50 }}>
        <Kinetic t={t} text="Talent was never the problem." start={0.15} end={2.7} size={104} color="oklch(0.96 0.005 95)" weight={600} maxWidth={900} />
        <Kinetic
          t={t}
          text="Keeping track was."
          start={1.45}
          end={2.75}
          size={124}
          color="oklch(0.96 0.005 95)"
          highlight={["track"]}
          highlightColor={C.gold}
        />
      </AbsoluteFill>
      <Vignette strength={0.85} />
      <Grain />
    </AbsoluteFill>
  );
};
