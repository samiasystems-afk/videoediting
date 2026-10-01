import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F, camera, ease, sp, tw, type CamKey } from "../theme.js";
import { Kinetic } from "../components/Text.js";
import { PaperBg } from "../components/fx.js";
import { Mark } from "../components/Logo.js";
import { Chip, Due, Fund, NextStep, Phone, Pointer, Status, Tick, Verified } from "../components/ui.js";

type SceneProps = { t: number; fps: number; dur: number };

/* Phone placement on the 1080×1920 stage. */
const PS = 2.1;
const PX = (1080 - 414 * PS) / 2;
const PY = 600;
const ph = (x: number, y: number) => ({ x: PX + (12 + x) * PS, y: PY + (12 + y) * PS });
const ANCHOR = { x: 540, y: 1250 };
const at = (t: number, x: number, y: number, s: number): CamKey => {
  const p = ph(x, y);
  return { t, x: p.x, y: p.y, s };
};
const HOME: CamKey = { t: 0, x: ANCHOR.x, y: ANCHOR.y, s: 1 };

/** Shared frame: paper bg, a camera-driven stage, headlines on top, enter/exit motion. */
const Frame: React.FC<{
  t: number;
  fps: number;
  dur: number;
  keys: CamKey[];
  headlines: React.ReactNode;
  children: React.ReactNode;
  bg?: React.ReactNode;
}> = ({ t, fps, dur, keys, headlines, children, bg }) => {
  const cam = camera(t, fps, keys);
  const enter = sp(t, fps, -0.15, { damping: 20, stiffness: 120, mass: 1 });
  const exit = tw(t, dur - 0.27, dur, 0, 1, ease.in);
  const stageY = (1 - enter) * 1100 - exit * 1500;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {bg ?? <PaperBg />}
      <AbsoluteFill style={{ transform: `translateY(${stageY}px)` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${ANCHOR.x - cam.x * cam.s}px, ${ANCHOR.y - cam.y * cam.s}px) scale(${cam.s})`,
          }}
        >
          {children}
        </div>
      </AbsoluteFill>
      {/* headline zone keeps a paper fade so zoomed UI never fights the text */}
      <AbsoluteFill
        style={{
          height: 600,
          background: `linear-gradient(to bottom, ${C.paper} 0%, ${C.paper} 70%, oklch(0.976 0.009 95 / 0) 100%)`,
          transform: `translateY(${-exit * 700}px)`,
        }}
      >
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 170 }}>{headlines}</AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Head: React.FC<{ t: number; text: string; start: number; end?: number; hl?: string[]; size?: number }> = ({
  t,
  text,
  start,
  end,
  hl = [],
  size = 92,
}) => (
  <div style={{ position: "absolute", top: 170, width: 1000, display: "flex", justifyContent: "center" }}>
    <Kinetic t={t} text={text} start={start} end={end} size={size} highlight={hl} maxWidth={980} />
  </div>
);

/* ------------------------------------------------------------------ */
/* Onboarding — tell us who you are                                    */
/* ------------------------------------------------------------------ */
const Pill: React.FC<{ t: number; label: string; tap?: number; wide?: boolean }> = ({ t, label, tap, wide }) => {
  const on = tap !== undefined ? tw(t, tap, tap + 0.18, 0, 1) : 0;
  const ring = tap !== undefined ? tw(t, tap - 0.22, tap, 0, 1, ease.out) * (1 - tw(t, tap + 0.1, tap + 0.4, 0, 1)) : 0;
  const press = tap !== undefined ? Math.max(0, 1 - Math.abs(t - tap) / 0.12) : 0;
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 15px",
        borderRadius: wide ? 12 : 999,
        border: `1.5px solid ${on > 0.5 ? C.primary : C.line}`,
        background: on > 0.5 ? C.primaryTint2 : C.surface,
        fontSize: 14.5,
        fontWeight: on > 0.5 ? 650 : 500,
        color: on > 0.5 ? C.primaryDeep : C.ink,
        transform: `scale(${1 - press * 0.06})`,
        width: wide ? "100%" : undefined,
      }}
    >
      {wide && (
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: `${on > 0.5 ? 6 : 2}px solid ${on > 0.5 ? C.primary : C.line}`,
            boxSizing: "border-box",
          }}
        />
      )}
      {!wide && on > 0.5 && <span style={{ color: C.primary, fontWeight: 800 }}>✓</span>}
      {label}
      {ring > 0 && (
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 46,
            height: 46,
            marginLeft: -23,
            marginTop: -23,
            borderRadius: "50%",
            background: "oklch(0.3 0.03 170 / 0.18)",
            border: "2px solid white",
            boxShadow: "0 4px 14px oklch(0.2 0.03 170 / 0.3)",
            opacity: ring,
            transform: `scale(${1 - press * 0.25})`,
          }}
        />
      )}
    </div>
  );
};

const Q: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft, marginBottom: 9 }}>{label}</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
  </div>
);

export const Onboard: React.FC<SceneProps> = ({ t, fps, dur }) => {
  const taps = [0.6, 1.2, 1.8, 2.1, 2.6];
  const done = taps.filter((x) => t > x).length;
  const cta = 3.3;
  const ctaPress = Math.max(0, 1 - Math.abs(t - cta) / 0.12);
  const keys: CamKey[] = [HOME, at(0.35, 195, 250, 1.12), at(1.55, 195, 400, 1.12), at(2.45, 195, 540, 1.15), at(3.0, 195, 690, 1.3)];
  return (
    <Frame
      t={t}
      fps={fps}
      dur={dur}
      keys={keys}
      headlines={<Head t={t} text="Tell us who you are." start={0.05} hl={["you"]} />}
    >
      <div style={{ position: "absolute", left: PX, top: PY, transform: `scale(${PS})`, transformOrigin: "0 0" }}>
        <Phone height={1000}>
          <div style={{ padding: "8px 22px" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: C.line, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(1, Math.max(0, (done - i * 1.25) / 1.25)) * 100}%`,
                      background: C.primary,
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ fontFamily: F.display, fontSize: 27, fontWeight: 600, lineHeight: 1.15, marginBottom: 6, letterSpacing: "-0.01em" }}>
              Let's find scholarships you can actually win
            </div>
            <div style={{ fontSize: 14, color: C.inkSoft, marginBottom: 22 }}>Four questions. Under two minutes.</div>
            <Q label="I'm a citizen of">
              <Pill t={t} label="Kenya" tap={taps[0]} />
              <Pill t={t} label="Nigeria" />
              <Pill t={t} label="Egypt" />
              <Pill t={t} label="Sudan" />
              <Pill t={t} label="Ghana" />
              <Pill t={t} label="Ethiopia" />
              <Pill t={t} label="+ 54 more" />
            </Q>
            <Q label="I want to study a">
              <Pill t={t} label="Bachelor's" />
              <Pill t={t} label="Master's" tap={taps[1]} />
              <Pill t={t} label="PhD" />
            </Q>
            <Q label="Where">
              <Pill t={t} label="UK" tap={taps[2]} />
              <Pill t={t} label="Europe" tap={taps[3]} />
              <Pill t={t} label="US" />
              <Pill t={t} label="Canada" />
              <Pill t={t} label="I'm open" />
            </Q>
            <Q label="Funding">
              <Pill t={t} label="Fully funded only" tap={taps[4]} wide />
              <Pill t={t} label="Partial funding is fine" wide />
              <Pill t={t} label="Show me everything" wide />
            </Q>
            <div
              style={{
                position: "relative",
                marginTop: 14,
                height: 54,
                borderRadius: 999,
                background: t > cta ? C.primaryDeep : C.primary,
                color: "oklch(0.97 0.01 168)",
                fontWeight: 650,
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${1 - ctaPress * 0.05})`,
                boxShadow: `0 0 0 ${tw(t, cta, cta + 0.4, 0, 14)}px oklch(0.46 0.095 168 / ${0.35 * (1 - tw(t, cta, cta + 0.4, 0, 1))})`,
              }}
            >
              Find my scholarships →
              {Math.abs(t - cta) < 0.35 && (
                <span
                  style={{
                    position: "absolute",
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: "oklch(0.99 0 0 / 0.25)",
                    border: "2px solid white",
                    opacity: 1 - Math.abs(t - cta) / 0.35,
                  }}
                />
              )}
            </div>
          </div>
        </Phone>
      </div>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* Matches — three honest states                                       */
/* ------------------------------------------------------------------ */
const MatchCard: React.FC<{
  kind: "strong" | "possible" | "no";
  full: boolean;
  title: string;
  meta: string;
  why: React.ReactNode;
  day: string;
  mon: string;
  left: string;
  checked: string;
  enter: number;
  focus: number;
}> = ({ kind, full, title, meta, why, day, mon, left, checked, enter, focus }) => (
  <div
    style={{
      background: C.surface,
      border: `1px solid ${focus > 0.01 ? C.line : C.lineSoft}`,
      borderRadius: 18,
      padding: "14px 16px",
      marginBottom: 12,
      transform: `translateY(${(1 - enter) * 160}px)`,
      opacity: Math.min(1, enter * 1.5),
      boxShadow: `0 ${16 * focus}px ${40 * focus}px -12px oklch(0.3 0.05 170 / ${0.25 * focus})`,
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <Chip kind={kind} />
      <Fund full={full} />
    </div>
    <div style={{ fontFamily: F.display, fontSize: 17.5, fontWeight: 600, lineHeight: 1.2, opacity: kind === "no" ? 0.6 : 1 }}>{title}</div>
    <div style={{ fontSize: 12.5, color: C.inkFaint, margin: "2px 0 8px" }}>{meta}</div>
    <div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.4, marginBottom: 10 }}>{why}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${C.lineSoft}`, paddingTop: 10 }}>
      <Due day={day} mon={mon} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{left}</div>
        <Verified text={checked} />
      </div>
    </div>
  </div>
);

export const Matches: React.FC<SceneProps> = ({ t, fps, dur }) => {
  const e = [0.3, 0.5, 0.7].map((s) => sp(t, fps, s, { damping: 18, stiffness: 150 }));
  const keys: CamKey[] = [
    HOME,
    at(0.2, 195, 330, 1.0),
    at(2.0, 195, 215, 1.38),
    at(3.5, 195, 450, 1.38),
    at(4.7, 195, 680, 1.38),
  ];
  const f1 = tw(t, 2.0, 2.3, 0, 1) * (1 - tw(t, 3.4, 3.6, 0, 1));
  const f2 = tw(t, 3.5, 3.8, 0, 1) * (1 - tw(t, 4.6, 4.8, 0, 1));
  const f3 = tw(t, 4.7, 5.0, 0, 1);
  return (
    <Frame
      t={t}
      fps={fps}
      dur={dur}
      keys={keys}
      headlines={
        <>
          <Head t={t} text="Find scholarships|you can actually win." start={0.05} end={1.85} size={84} hl={["actually"]} />
          <Head t={t} text="Strong. Possible.|Not eligible." start={2.0} end={4.05} size={84} />
          <Head t={t} text="Every rule explained.|No fake scores." start={4.2} size={84} hl={["explained."]} />
        </>
      }
    >
      <div style={{ position: "absolute", left: PX, top: PY, transform: `scale(${PS})`, transformOrigin: "0 0" }}>
        <Phone height={1100}>
          <div style={{ padding: "6px 18px" }}>
            <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 600, padding: "0 4px" }}>Discover</div>
            <div style={{ fontSize: 13.5, color: C.inkSoft, margin: "0 4px 12px" }}>
              We found <b style={{ color: C.ink }}>12 opportunities</b> that fit your profile.
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {["Fully funded", "UK · Europe", "Master's"].map((l, i) => (
                <span
                  key={l}
                  style={{
                    padding: "7px 13px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 650,
                    background: i === 0 ? C.ink : C.surface,
                    color: i === 0 ? C.paper : C.ink,
                    border: i === 0 ? undefined : `1.5px solid ${C.line}`,
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
            <MatchCard
              kind="strong"
              full
              title="Northbridge Global Scholars Award"
              meta="Northbridge Trust · UK · Master's · Data science"
              why={
                <>
                  You meet the published <b style={{ color: C.ink }}>nationality, degree and experience</b> rules. Covers tuition, living costs, travel and visa.
                </>
              }
              day="14"
              mon="OCT"
              left="38 days remaining"
              checked="Checked 3 days ago"
              enter={e[0]}
              focus={f1}
            />
            <MatchCard
              kind="possible"
              full
              title="European Futures Fellowship"
              meta="EF Foundation · Netherlands · Master's · AI & society"
              why={
                <>
                  We need your <b style={{ color: C.ink }}>English test status</b> to confirm. Everything else checks out.
                </>
              }
              day="02"
              mon="NOV"
              left="57 days remaining"
              checked="Checked yesterday"
              enter={e[1]}
              focus={f2}
            />
            <MatchCard
              kind="no"
              full={false}
              title="Atlantic Graduate Opportunity Grant"
              meta="Atlantic Fund · US · Master's · Computing"
              why={
                <>
                  Open to <b style={{ color: C.ink }}>US permanent residents only</b>, per the funder's published rules.
                </>
              }
              day="09"
              mon="JAN"
              left="125 days remaining"
              checked="Checked 6 days ago"
              enter={e[2]}
              focus={f3}
            />
          </div>
        </Phone>
      </div>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* Source — every rule traceable                                        */
/* ------------------------------------------------------------------ */
export const Source: React.FC<SceneProps> = ({ t, fps, dur }) => {
  const ticks = [0.4, 0.7, 1.0];
  const ask = sp(t, fps, 1.3, { damping: 12, stiffness: 220 });
  const covers = ["Tuition", "Living stipend", "Flights", "Visa"];
  const keys: CamKey[] = [HOME, at(0.1, 195, 300, 1.1), at(1.8, 195, 500, 1.4), at(2.75, 195, 640, 1.3)];
  return (
    <Frame
      t={t}
      fps={fps}
      dur={dur}
      keys={keys}
      headlines={
        <>
          <Head t={t} text="Every rule, straight|from the source." start={0.05} end={2.65} size={86} hl={["source."]} />
          <Head t={t} text="Know exactly|what's covered." start={2.8} size={86} hl={["covered."]} />
        </>
      }
    >
      <div style={{ position: "absolute", left: PX, top: PY, transform: `scale(${PS})`, transformOrigin: "0 0" }}>
        <Phone height={1100}>
          <div style={{ padding: "6px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, color: C.inkFaint }}>Northbridge Trust · UK</span>
              <Fund full />
            </div>
            <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600, lineHeight: 1.15, marginBottom: 14 }}>
              Northbridge Global Scholars Award
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", color: C.inkFaint, marginBottom: 4 }}>YOU MEET THIS</div>
            {["Citizen of an eligible country", "Bachelor's degree, upper second or above", "Two years of work experience"].map((l, i) => (
              <div key={l} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.lineSoft}`, alignItems: "center" }}>
                <Tick kind="yes" p={sp(t, fps, ticks[i], { damping: 11, stiffness: 260 })} />
                <span style={{ fontSize: 14.5 }}>{l}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", color: C.inkFaint, margin: "14px 0 4px" }}>WE NEED MORE INFORMATION</div>
            <div style={{ display: "flex", gap: 12, padding: "10px 0", alignItems: "center", transform: `scale(${0.9 + 0.1 * ask})`, opacity: Math.min(1, ask * 2), transformOrigin: "0 50%" }}>
              <Tick kind="ask" />
              <div>
                <div style={{ fontSize: 14.5 }}>English test: IELTS 6.5 overall</div>
                <div style={{ fontSize: 12.5, color: C.amberInk, fontWeight: 600 }}>Add your test status to confirm →</div>
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 14px", marginTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", color: C.inkFaint, marginBottom: 6 }}>FROM THE OFFICIAL RULES</div>
              <div style={{ fontSize: 13.5, fontStyle: "italic", color: C.inkSoft, lineHeight: 1.45, borderLeft: `3px solid ${C.primary}`, paddingLeft: 10 }}>
                “Applicants must hold a bachelor's degree with upper second-class honours, or the international equivalent.”
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <Verified text="Official source · Checked 3 days ago" />
                <span style={{ fontSize: 12, fontWeight: 650, color: C.primaryDeep }}>View ↗</span>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", color: C.inkFaint, margin: "18px 0 8px" }}>WHAT IT COVERS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {covers.map((c, i) => {
                const p = sp(t, fps, 2.9 + i * 0.2, { damping: 11, stiffness: 240 });
                return (
                  <span
                    key={c}
                    style={{
                      display: "inline-flex",
                      gap: 6,
                      alignItems: "center",
                      padding: "7px 12px",
                      borderRadius: 999,
                      background: C.primaryTint,
                      color: C.primaryDeep,
                      fontWeight: 650,
                      fontSize: 13.5,
                      transform: `scale(${p})`,
                    }}
                  >
                    ✓ {c}
                  </span>
                );
              })}
            </div>
          </div>
        </Phone>
      </div>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* Board — every application, one view                                  */
/* ------------------------------------------------------------------ */
type Card = { id: string; title: string; due: string; prog: [number, number] };
const COLS = ["Not started", "In progress", "Ready", "Submitted"];
const CW = 380;
const GAP = 26;
const BX = 300; // board origin inside the window
const BY = 230;

const BoardCard: React.FC<{ c: Card; col: number; lift?: number; done?: boolean }> = ({ c, col, lift = 0, done }) => (
  <div
    style={{
      width: CW - 28,
      background: C.surface,
      border: `1px solid ${C.line}`,
      borderRadius: 16,
      padding: "16px 18px",
      boxShadow: `0 ${4 + 30 * lift}px ${12 + 50 * lift}px -10px oklch(0.25 0.05 170 / ${0.15 + 0.3 * lift})`,
      transform: `rotate(${lift * 3}deg) scale(${1 + lift * 0.05})`,
    }}
  >
    <div style={{ fontFamily: F.display, fontSize: 25, fontWeight: 600, lineHeight: 1.18, marginBottom: 12 }}>{c.title}</div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <span style={{ fontSize: 18, color: C.inkSoft, fontWeight: 600 }}>{col === 3 ? `Submitted ${c.due}` : `Due ${c.due}`}</span>
      {col === 3 || done ? <Status s="submitted" /> : col === 2 ? <Status s="ready" /> : col === 1 ? <Status s="progress" /> : <Status s="open" />}
    </div>
    <div style={{ height: 7, borderRadius: 4, background: C.lineSoft, overflow: "hidden" }}>
      <div style={{ width: `${(c.prog[0] / c.prog[1]) * 100}%`, height: "100%", background: C.primary, borderRadius: 4 }} />
    </div>
    <div style={{ fontSize: 17, color: C.inkFaint, marginTop: 6 }}>
      {c.prog[0]} of {c.prog[1]} requirements done
    </div>
  </div>
);

export const Board: React.FC<SceneProps> = ({ t, fps, dur }) => {
  const P1 = 1.6, D1 = 2.6, P2 = 3.3, D2 = 4.1;
  const colX = (i: number) => BX + i * (CW + GAP) + 14;
  const cardY = (row: number) => BY + 80 + row * 210;
  const base: Record<string, { col: number; row: number; c: Card }> = {
    a: { col: 0, row: 0, c: { id: "a", title: "Atlantic Graduate Opportunity Grant", due: "9 Jan", prog: [0, 6] } },
    m: { col: 0, row: 1, c: { id: "m", title: "Meridian Leaders Scholarship", due: "20 Feb", prog: [1, 5] } },
    n: { col: 1, row: 0, c: { id: "n", title: "Northbridge Global Scholars Award", due: "14 Oct", prog: [9, 14] } },
    e: { col: 1, row: 1, c: { id: "e", title: "European Futures Fellowship", due: "2 Nov", prog: [7, 8] } },
    k: { col: 1, row: 2, c: { id: "k", title: "Kestrel Foundation Award", due: "30 Nov", prog: [3, 9] } },
    h: { col: 2, row: 0, c: { id: "h", title: "Halden Excellence Scholarship", due: "21 Oct", prog: [7, 7] } },
    s: { col: 3, row: 0, c: { id: "s", title: "Southgate Fellowship", due: "12 Sep", prog: [6, 6] } },
    o: { col: 3, row: 1, c: { id: "o", title: "Orion Global Grant", due: "28 Aug", prog: [5, 5] } },
  };
  // move 1: European Futures In progress → Ready (lands under Halden)
  const m1 = tw(t, P1 + 0.15, D1, 0, 1, ease.inOut);
  const e0 = { x: colX(1), y: cardY(1) };
  const e1 = { x: colX(2), y: cardY(1) };
  const eLift = tw(t, P1, P1 + 0.15, 0, 1) * (1 - tw(t, D1, D1 + 0.15, 0, 1));
  const ePos = { x: e0.x + (e1.x - e0.x) * m1, y: e0.y + (e1.y - e0.y) * m1 - Math.sin(m1 * Math.PI) * 40 };
  const eProg: [number, number] = t > D1 ? [8, 8] : [7, 8];
  // Kestrel slides up into the gap once European Futures leaves
  const kUp = tw(t, P1 + 0.3, P1 + 0.8, 0, 1);
  // move 2: Halden Ready → Submitted (lands at row 0, pushing others down)
  const m2 = tw(t, P2 + 0.15, D2, 0, 1, ease.inOut);
  const h0 = { x: colX(2), y: cardY(0) };
  const h1 = { x: colX(3), y: cardY(0) };
  const hLift = tw(t, P2, P2 + 0.15, 0, 1) * (1 - tw(t, D2, D2 + 0.15, 0, 1));
  const hPos = { x: h0.x + (h1.x - h0.x) * m2, y: h0.y + (h1.y - h0.y) * m2 - Math.sin(m2 * Math.PI) * 40 };
  const subDown = tw(t, P2 + 0.5, D2, 0, 1, ease.inOut);
  const eUp = tw(t, D2 - 0.1, D2 + 0.4, 0, 1, ease.inOut); // European Futures rises to Ready row 0
  const burst = tw(t, D2, D2 + 0.6, 0, 1, ease.out);

  // pointer follows the dragged card
  let ptr = { x: colX(1) + 200, y: cardY(1) + 260 };
  if (t < P1) {
    const k = tw(t, 0.8, P1, 0, 1, ease.inOut);
    ptr = { x: colX(1) + 420 - 220 * k, y: cardY(1) + 300 - 230 * k };
  } else if (t < P2 - 0.6) {
    ptr = { x: ePos.x + 200, y: ePos.y + 70 };
  } else if (t < P2) {
    const k = tw(t, D1 + 0.2, P2, 0, 1, ease.inOut);
    ptr = { x: e1.x + 200 + (h0.x - e1.x) * k, y: e1.y + 70 + (h0.y - e1.y) * k };
  } else {
    ptr = { x: hPos.x + 200, y: hPos.y + 70 };
  }

  // window placement on stage
  const WX = 0, WY = 0;
  const center = (wx: number, wy: number, s: number, tt: number): CamKey => ({ t: tt, x: WX + wx, y: WY + wy, s });
  const keys: CamKey[] = [
    center(990, 900, 0.545, 0),
    center(colX(1) + 190, 540, 1.45, 1.0),
    center(colX(2) + 40, 540, 1.45, 1.7),
    center(colX(3) - 20, 500, 1.45, 3.3),
    center(990, 900, 0.545, 4.8),
  ];
  const counts = t > D2 ? [2, 2, 1, 3] : t > D1 ? [2, 2, 2, 2] : [2, 3, 1, 2];

  return (
    <Frame
      t={t}
      fps={fps}
      dur={dur}
      keys={keys}
      headlines={
        <>
          <Head t={t} text="Every application.|One board." start={0.05} end={4.6} hl={["One", "board."]} />
          <Head t={t} text="Always know where|each one stands." start={4.75} size={84} hl={["stands."]} />
        </>
      }
    >
      <div
        style={{
          position: "absolute",
          left: WX,
          top: WY,
          width: 1980,
          height: 1280,
          borderRadius: 26,
          background: C.paper,
          border: `1.5px solid ${C.line}`,
          boxShadow: "0 60px 140px -40px oklch(0.25 0.05 170 / 0.45)",
          overflow: "hidden",
          fontFamily: F.body,
          color: C.ink,
        }}
      >
        {/* sidebar */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 260, background: C.surface, borderRight: `1px solid ${C.lineSoft}`, padding: "34px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
            <Mark size={40} />
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 23, letterSpacing: "-0.03em" }}>Degree First</span>
          </div>
          {["Home", "Discover", "Applications", "Profile"].map((l, i) => (
            <div
              key={l}
              style={{
                padding: "13px 16px",
                borderRadius: 12,
                fontSize: 19,
                fontWeight: 650,
                marginBottom: 6,
                background: i === 2 ? C.primaryTint2 : undefined,
                color: i === 2 ? C.primaryDeep : C.inkSoft,
              }}
            >
              {l}
            </div>
          ))}
        </div>
        {/* header */}
        <div style={{ position: "absolute", left: BX, top: 50, right: 40 }}>
          <div style={{ fontSize: 17, color: C.inkFaint, marginBottom: 6 }}>Applications</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: F.display, fontSize: 44, fontWeight: 600, letterSpacing: "-0.02em" }}>My applications</div>
            <div style={{ display: "flex", gap: 8, background: C.sand, borderRadius: 12, padding: 5 }}>
              {["Board", "List", "Timeline"].map((v, i) => (
                <span key={v} style={{ padding: "8px 18px", borderRadius: 9, fontSize: 17, fontWeight: 650, background: i === 0 ? C.surface : undefined, color: i === 0 ? C.ink : C.inkFaint }}>
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* columns */}
        {COLS.map((name, i) => (
          <div key={name} style={{ position: "absolute", left: BX + i * (CW + GAP), top: BY, width: CW, height: 980, borderRadius: 20, background: i === 3 ? C.primaryTint2 : C.sand }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "18px 20px", fontWeight: 700, fontSize: 19 }}>
              <span>{name}</span>
              <span style={{ color: C.inkFaint }}>{counts[i]}</span>
            </div>
          </div>
        ))}
        {/* static cards */}
        {Object.values(base).map(({ col, row, c }) => {
          if (c.id === "e" || c.id === "h") return null;
          let y = cardY(row);
          if (c.id === "k") y = cardY(2) - (cardY(2) - cardY(1)) * kUp;
          if (col === 3) y = cardY(row) + (cardY(row + 1) - cardY(row)) * subDown;
          return (
            <div key={c.id} style={{ position: "absolute", left: colX(col), top: y }}>
              <BoardCard c={c} col={col} />
            </div>
          );
        })}
        {/* European Futures — moving */}
        <div style={{ position: "absolute", left: ePos.x, top: t > D2 ? cardY(1) - (cardY(1) - cardY(0)) * eUp : ePos.y, zIndex: 5 }}>
          <BoardCard c={{ ...base.e.c, prog: eProg }} col={t > D1 ? 2 : 1} lift={eLift} />
        </div>
        {/* Halden — moving */}
        <div style={{ position: "absolute", left: hPos.x, top: hPos.y, zIndex: 6 }}>
          <BoardCard c={base.h.c} col={t > D2 ? 3 : 2} lift={hLift} />
          {burst > 0 && burst < 1 &&
            Array.from({ length: 14 }).map((_, i) => {
              const a = (i / 14) * Math.PI * 2;
              const r = 60 + 160 * burst;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 176 + Math.cos(a) * r * 1.4,
                    top: 80 + Math.sin(a) * r,
                    width: 12,
                    height: 12,
                    borderRadius: i % 2 ? 3 : 6,
                    background: i % 3 === 0 ? C.gold : C.primary,
                    opacity: 1 - burst,
                    transform: `rotate(${i * 40 + burst * 200}deg)`,
                  }}
                />
              );
            })}
        </div>
        {t > 0.7 && t < 4.6 && <Pointer x={ptr.x} y={ptr.y} scale={1.9} grab={(t > P1 && t < D1) || (t > P2 && t < D2)} />}
      </div>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* Next step — the gold thread                                          */
/* ------------------------------------------------------------------ */
export const Next: React.FC<SceneProps> = ({ t, fps, dur }) => {
  const SWAP = 3.6;
  const T1 = 2.6; // transcript done
  const shimmer = tw(t, 1.05, 1.9, -0.3, 1.3, ease.inOut);
  const glow = tw(t, 1.0, 1.4, 0, 1) * (1 - tw(t, 2.2, 2.6, 0, 1)) + tw(t, SWAP, SWAP + 0.3, 0, 1) * 0.8;
  const swap = tw(t, SWAP - 0.15, SWAP + 0.2, 0, 1);
  const done = t > SWAP ? 10 : 9;
  const ringP = tw(t, 0.3, 1.0, 0, 9 / 14) + tw(t, SWAP, SWAP + 0.5, 0, 1 / 14);
  const tp = (x: number) => sp(t, fps, x, { damping: 11, stiffness: 260 });
  const keys: CamKey[] = [HOME, at(0.1, 195, 250, 1.05), at(1.0, 195, 250, 1.42), at(2.3, 195, 470, 1.3), at(SWAP - 0.1, 195, 250, 1.42)];
  return (
    <Frame
      t={t}
      fps={fps}
      dur={dur}
      keys={keys}
      headlines={
        <>
          <Head t={t} text="Always know|your next step." start={0.05} end={SWAP - 0.25} hl={["next", "step."]} />
          <Head t={t} text="It moves forward|when you do." start={SWAP - 0.05} size={86} hl={["forward"]} />
        </>
      }
    >
      <div style={{ position: "absolute", left: PX, top: PY, transform: `scale(${PS})`, transformOrigin: "0 0" }}>
        <Phone height={1100}>
          <div style={{ padding: "4px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>‹</div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: C.goldDeep, background: C.goldTint, border: "1px solid oklch(0.87 0.06 90)", borderRadius: 999, padding: "5px 11px" }}>
                DEGREE FIRST PLUS
              </span>
            </div>
            <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600, lineHeight: 1.15, marginBottom: 12 }}>Northbridge Global Scholars Award</div>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
              <svg width="58" height="58" viewBox="0 0 58 58">
                <circle cx="29" cy="29" r="24" fill="none" stroke={C.lineSoft} strokeWidth="7" />
                <circle
                  cx="29"
                  cy="29"
                  r="24"
                  fill="none"
                  stroke={C.primary}
                  strokeWidth="7"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={`${ringP} 1`}
                  transform="rotate(-90 29 29)"
                />
                <text x="29" y="34" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.ink} fontFamily="Onest">
                  {done}/14
                </text>
              </svg>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{done} of 14 requirements done</div>
                <div style={{ fontSize: 12.5, color: C.inkSoft }}>Due 14 Oct, 23:59 UK time · 38 days left</div>
              </div>
            </div>
            <div style={{ position: "relative", overflow: "hidden", borderRadius: 18 }}>
              <NextStep
                glow={glow}
                text={
                  <span style={{ display: "block", position: "relative", height: 40 }}>
                    <span style={{ position: "absolute", inset: 0, transform: `translateY(${-swap * 60}px)`, opacity: 1 - swap }}>
                      Upload your certified transcript. It must be an official English copy.
                    </span>
                    <span style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - swap) * 60}px)`, opacity: swap }}>
                      Request your academic reference by 12 October. Referees need two weeks.
                    </span>
                  </span>
                }
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(105deg, transparent ${shimmer * 100 - 15}%, oklch(1 0 0 / 0.65) ${shimmer * 100}%, transparent ${shimmer * 100 + 15}%)`,
                  pointerEvents: "none",
                }}
              />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", color: C.inkFaint, margin: "18px 0 2px" }}>DOCUMENTS</div>
            {[
              { l: "Passport scan", s: "ready" as const, k: "yes" as const },
              { l: "Degree certificate", s: "ready" as const, k: "yes" as const },
              { l: "Certified transcript", s: t > T1 ? ("ready" as const) : ("open" as const), k: t > T1 ? ("yes" as const) : ("open" as const), p: t > T1 ? tp(T1) : 1 },
            ].map((r) => (
              <div key={r.l} style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: `1px solid ${C.lineSoft}`, alignItems: "center" }}>
                <Tick kind={r.k} p={r.p ?? 1} />
                <span style={{ flex: 1, fontSize: 14.5 }}>{r.l}</span>
                <Status s={r.s} />
              </div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", color: C.inkFaint, margin: "16px 0 2px" }}>ESSAYS</div>
            <div style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: `1px solid ${C.lineSoft}`, alignItems: "center" }}>
              <Tick kind="ask" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5 }}>“Why this course, why now?”</div>
                <div style={{ fontSize: 12.5, color: C.inkFaint }}>500 words · draft at 380</div>
              </div>
              <Status s="progress" />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", color: C.inkFaint, margin: "16px 0 2px" }}>REFERENCES</div>
            <div style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: `1px solid ${C.lineSoft}`, alignItems: "center" }}>
              <Tick kind="ask" />
              <span style={{ flex: 1, fontSize: 14.5 }}>Academic: Dr. Wanjiru</span>
              <Status s="request" />
            </div>
            <div style={{ display: "flex", gap: 12, padding: "11px 0", alignItems: "center" }}>
              <Tick kind="yes" />
              <span style={{ flex: 1, fontSize: 14.5 }}>Professional: J. Otieno</span>
              <Status s="ready" />
            </div>
          </div>
        </Phone>
      </div>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* Reminders — deadlines that come to you                              */
/* ------------------------------------------------------------------ */
export const Remind: React.FC<SceneProps> = ({ t, fps, dur }) => {
  const N = 1.2;
  const note = sp(t, fps, N, { damping: 16, stiffness: 200 });
  const dates = [
    { d: "12", m: "OCT", l: "Academic reference", s: "Suggested request date" },
    { d: "14", m: "OCT", l: "Northbridge Global Scholars", s: "Deadline · 23:59 UK time" },
    { d: "02", m: "NOV", l: "European Futures Fellowship", s: "Deadline · 17:00 CET" },
    { d: "30", m: "NOV", l: "Kestrel Foundation Award", s: "Deadline · 23:59 GMT" },
  ];
  return (
    <Frame
      t={t}
      fps={fps}
      dur={dur}
      keys={[HOME, { t: 0.1, x: 540, y: 1200, s: 1.0 }, { t: N + 0.1, x: 540, y: 1150, s: 1.04 }]}
      headlines={<Head t={t} text="Never miss|a deadline again." start={-0.1} hl={["Never"]} />}
    >
      <div style={{ position: "absolute", left: 80, top: 860, width: 920, fontFamily: F.body }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.1em", color: C.inkFaint, marginBottom: 18 }}>KEY DATES</div>
        {dates.map((x, i) => {
          const p = sp(t, fps, -0.1 + i * 0.1, { damping: 18, stiffness: 180 });
          return (
            <div
              key={x.l}
              style={{
                display: "flex",
                gap: 26,
                alignItems: "center",
                padding: "22px 0",
                borderBottom: `2px solid ${C.lineSoft}`,
                transform: `translateX(${(1 - p) * 300}px)`,
                opacity: Math.min(1, p * 1.5),
              }}
            >
              <div
                style={{
                  flex: "none",
                  width: 128,
                  height: 128,
                  borderRadius: 24,
                  border: `2px solid ${i === 1 ? C.primary : C.line}`,
                  background: i === 1 ? C.primaryTint2 : C.surface,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1.05,
                }}
              >
                <span style={{ fontFamily: F.display, fontSize: 50, fontWeight: 700 }}>{x.d}</span>
                <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.08em", color: C.inkFaint }}>{x.m}</span>
              </div>
              <div>
                <div style={{ fontSize: 40, fontWeight: 650, lineHeight: 1.2 }}>{x.l}</div>
                <div style={{ fontSize: 30, color: C.inkFaint }}>{x.s}</div>
              </div>
            </div>
          );
        })}
      </div>
      {/* the helpful notification — the inverse of act one */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 560 + (1 - note) * -500,
          width: 960,
          borderRadius: 40,
          padding: "26px 30px",
          background: "oklch(0.995 0.003 95 / 0.92)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 40px 80px -20px oklch(0.25 0.05 170 / 0.4)",
          display: "flex",
          gap: 22,
          alignItems: "center",
          fontFamily: F.body,
          opacity: t > N - 0.05 ? 1 : 0,
        }}
      >
        <div style={{ flex: "none", width: 84, height: 84, borderRadius: 20, background: C.primaryDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mark size={70} stroke={C.paper} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: C.inkFaint, fontWeight: 650 }}>
            <span>DEGREE FIRST</span>
            <span>now</span>
          </div>
          <div style={{ fontSize: 33, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>Northbridge closes in 7 days</div>
          <div style={{ fontSize: 28, color: C.inkSoft, lineHeight: 1.3 }}>You're 10 of 14 done. Next: your academic reference.</div>
        </div>
      </div>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* Recap — four beats                                                   */
/* ------------------------------------------------------------------ */
export const Recap: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const beats = [
    { w: "Find.", bg: C.paper, fg: C.ink, icon: "⌕" },
    { w: "Match.", bg: C.primaryTint, fg: C.primaryDeep, icon: "●" },
    { w: "Track.", bg: C.primary, fg: C.paper, icon: "▦" },
    { w: "Submit.", bg: C.ink, fg: C.gold, icon: "✓" },
  ];
  const i = Math.min(3, Math.floor(t / 0.5));
  const b = beats[i];
  const p = sp(t, fps, i * 0.5, { damping: 12, stiffness: 300, mass: 0.6 });
  return (
    <AbsoluteFill style={{ background: b.bg, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: F.display,
          fontWeight: 800,
          fontSize: 230,
          letterSpacing: "-0.05em",
          color: b.fg,
          transform: `scale(${1.25 - 0.25 * p})`,
          display: "flex",
          alignItems: "center",
          gap: 30,
        }}
      >
        {b.w}
      </div>
      <div style={{ position: "absolute", bottom: 260, display: "flex", gap: 22 }}>
        {beats.map((x, k) => (
          <div key={k} style={{ width: 70, height: 10, borderRadius: 5, background: b.fg, opacity: k <= i ? 0.9 : 0.2 }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
