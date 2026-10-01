import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F, ease, sp, tw } from "../theme.js";
import { Dust, Grain, Vignette } from "../components/fx.js";
import { Kinetic } from "../components/Text.js";
import landDots from "../data/land-dots.json";

type V3 = [number, number, number];
const rad = Math.PI / 180;
const toV = (lat: number, lon: number): V3 => [
  Math.cos(lat * rad) * Math.cos(lon * rad),
  Math.cos(lat * rad) * Math.sin(lon * rad),
  Math.sin(lat * rad),
];
/** Rotate so (lat0, lon0) faces the viewer. Returns [depth, screenX, screenY] on the unit sphere. */
const view = (v: V3, lat0: number, lon0: number): V3 => {
  const cl = Math.cos(-lon0 * rad), sl = Math.sin(-lon0 * rad);
  const x1 = v[0] * cl - v[1] * sl;
  const y1 = v[0] * sl + v[1] * cl;
  const z1 = v[2];
  const ca = Math.cos(lat0 * rad), sa = Math.sin(lat0 * rad);
  const x2 = x1 * ca + z1 * sa;
  const z2 = -x1 * sa + z1 * ca;
  return [x2, y1, -z2];
};
const slerp = (a: V3, b: V3, f: number): V3 => {
  const d = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const om = Math.acos(d);
  if (om < 1e-6) return a;
  const s = Math.sin(om);
  const ka = Math.sin((1 - f) * om) / s, kb = Math.sin(f * om) / s;
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
};

const CITY: Record<string, [number, number]> = {
  Nairobi: [-1.29, 36.82], Lagos: [6.52, 3.38], Cairo: [30.04, 31.24], Khartoum: [15.5, 32.56], Accra: [5.6, -0.19],
  "Addis Ababa": [9.03, 38.74], Kampala: [0.35, 32.58], Dakar: [14.72, -17.47], Tunis: [36.8, 10.18], Kinshasa: [-4.44, 15.27],
  "Dar es Salaam": [-6.79, 39.21], Amman: [31.95, 35.93], Casablanca: [33.57, -7.59], Lusaka: [-15.39, 28.32],
  London: [51.5, -0.13], Berlin: [52.52, 13.4], Amsterdam: [52.37, 4.9], Edinburgh: [55.95, -3.19], Paris: [48.86, 2.35],
  Stockholm: [59.33, 18.07], Dublin: [53.35, -6.26], Toronto: [43.65, -79.38], Munich: [48.14, 11.58], Brussels: [50.85, 4.35],
  Rome: [41.9, 12.5], Boston: [42.36, -71.06], Vienna: [48.21, 16.37], Madrid: [40.42, -3.7],
};

const HERO = [
  { from: "Nairobi", to: "Edinburgh", t: 0.6 },
  { from: "Lagos", to: "London", t: 1.5 },
  { from: "Cairo", to: "Berlin", t: 2.4 },
  { from: "Khartoum", to: "Amsterdam", t: 3.3 },
  { from: "Accra", to: "Paris", t: 4.2 },
];
const MORE = [
  ["Addis Ababa", "Stockholm"], ["Kampala", "Dublin"], ["Dakar", "Toronto"], ["Tunis", "Munich"], ["Kinshasa", "Brussels"],
  ["Dar es Salaam", "Rome"], ["Amman", "Vienna"], ["Casablanca", "Boston"], ["Lusaka", "Madrid"], ["Nairobi", "Munich"],
  ["Lagos", "Toronto"], ["Cairo", "Dublin"],
].map(([from, to], i) => ({ from, to, t: 5.2 + i * 0.07 }));

export const Globe: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const R = 470 * (0.82 + 0.18 * sp(t, fps, 0, { damping: 20, stiffness: 60 })) * (1 - 0.08 * tw(t, 5.2, 6.4, 0, 1, ease.inOut));
  const cx = 540;
  const cy = 1180 + 120 * tw(t, 6.4, 9.5, 0, 1, ease.inOut);
  const lon0 = 8 + t * 2.2;
  const lat0 = 24;
  const P = (v: V3) => {
    const w = view(v, lat0, lon0);
    return { x: cx + w[1] * R, y: cy + w[2] * R, d: w[0], r2: w[1] * w[1] + w[2] * w[2] };
  };

  const dots = (landDots as number[][]).map(([lon, lat], i) => {
    const p = P(toV(lat, lon));
    if (p.d <= 0.02) return null;
    const africa = lat > -36 && lat < 37 && lon > -18 && lon < 52;
    return (
      <circle
        key={i}
        cx={p.x}
        cy={p.y}
        r={2.3 + 1.3 * p.d}
        fill={africa ? "oklch(0.82 0.11 150)" : "oklch(0.7 0.09 168)"}
        opacity={0.25 + 0.7 * p.d}
      />
    );
  });

  const arc = (a: { from: string; to: string; t: number }, k: number, lift = 0.22) => {
    const dur = 0.85;
    const f = tw(t, a.t, a.t + dur, 0, 1, ease.inOut);
    if (f <= 0) return null;
    const A = toV(...CITY[a.from]);
    const B = toV(...CITY[a.to]);
    const N = 48;
    const pts: string[] = [];
    let head = { x: 0, y: 0, vis: false };
    for (let i = 0; i <= N * f; i++) {
      const u = i / N;
      const v = slerp(A, B, u);
      const h = 1 + lift * Math.sin(Math.PI * u);
      const p = P([v[0] * h, v[1] * h, v[2] * h]);
      const vis = p.d > 0 || p.r2 * R * R > R * R;
      if (vis) pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      head = { x: p.x, y: p.y, vis };
    }
    const src = P(A);
    const pulse = tw(t, a.t, a.t + 0.9, 0, 1, ease.out);
    return (
      <g key={`${a.from}-${a.to}-${k}`}>
        {src.d > 0 && (
          <>
            <circle cx={src.x} cy={src.y} r={10 + 50 * pulse} fill="none" stroke={C.gold} strokeWidth={4 * (1 - pulse)} opacity={1 - pulse} />
            <circle cx={src.x} cy={src.y} r={8} fill={C.gold} />
          </>
        )}
        <polyline points={pts.join(" ")} fill="none" stroke={C.gold} strokeWidth={5} strokeLinecap="round" opacity={0.95} style={{ filter: "drop-shadow(0 0 8px oklch(0.85 0.13 88))" }} />
        {head.vis && f < 1 && <circle cx={head.x} cy={head.y} r={9} fill="white" style={{ filter: "drop-shadow(0 0 10px white)" }} />}
        {f >= 1 && head.vis && <circle cx={head.x} cy={head.y} r={6} fill="oklch(0.95 0.05 90)" />}
      </g>
    );
  };

  // city slot under "From"
  const idx = HERO.reduce((acc, h, i) => (t >= h.t - 0.05 ? i : acc), -1);
  const cityP = idx >= 0 ? tw(t, HERO[idx].t - 0.05, HERO[idx].t + 0.3, 0, 1, ease.out) : 0;
  const fromOut = tw(t, 4.95, 5.2, 0, 1, ease.in);

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: `radial-gradient(90% 60% at 50% 62%, oklch(0.26 0.05 168) 0%, ${C.night} 70%)` }}>
      <Dust t={t + 50} n={70} color="oklch(0.95 0.02 95)" seed={9} />
      {/* atmosphere */}
      <div
        style={{
          position: "absolute",
          left: cx - R * 1.25,
          top: cy - R * 1.25,
          width: R * 2.5,
          height: R * 2.5,
          borderRadius: "50%",
          background: "radial-gradient(circle, oklch(0.6 0.12 168 / 0.35) 38%, oklch(0.6 0.12 168 / 0.08) 52%, transparent 66%)",
        }}
      />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <radialGradient id="ocean" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="oklch(0.3 0.05 168)" />
            <stop offset="100%" stopColor="oklch(0.15 0.025 168)" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={R} fill="url(#ocean)" />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="oklch(0.7 0.1 168 / 0.5)" strokeWidth={2} />
        {dots}
        {HERO.map((a, k) => arc(a, k))}
        {MORE.map((a, k) => arc(a, k + 10, 0.18))}
      </svg>
      {/* headline stack */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 210 }}>
        {t < 5.25 && (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 30,
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 120,
              letterSpacing: "-0.035em",
              color: "oklch(0.97 0.005 95)",
              opacity: tw(t, 0.25, 0.6, 0, 1) * (1 - fromOut),
              transform: `translateY(${-fromOut * 80}px)`,
            }}
          >
            <span>From</span>
            <span style={{ display: "inline-block", overflow: "hidden", height: 140, color: C.gold }}>
              {idx >= 0 && (
                <span style={{ display: "inline-block", transform: `translateY(${(1 - cityP) * 100}%)` }}>{HERO[idx].from}.</span>
              )}
            </span>
          </div>
        )}
        <div style={{ position: "absolute", top: 210 }}>
          <Kinetic t={t} text="To anywhere." start={5.2} end={6.3} size={140} color={C.gold} />
        </div>
        <div style={{ position: "absolute", top: 180, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <Kinetic t={t} text="Talent is everywhere." start={6.55} end={9.7} size={112} color="oklch(0.97 0.005 95)" />
          <Kinetic t={t} text="Opportunity should be too." start={8.15} end={9.7} size={112} color="oklch(0.97 0.005 95)" highlight={["Opportunity"]} highlightColor={C.gold} />
        </div>
      </AbsoluteFill>
      <Vignette strength={0.6} />
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};
