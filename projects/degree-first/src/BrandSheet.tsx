import React, { useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { C, F } from "./theme.js";
import { Mark, Wordmark } from "./components/Logo.js";

export type BrandVariant = "sheet" | "icon" | "mark" | "mark-light" | "lockup" | "lockup-dark";
export const BRAND_SIZES: Record<BrandVariant, [number, number]> = {
  sheet: [1600, 1000],
  icon: [1024, 1024],
  mark: [1024, 1024],
  "mark-light": [1024, 1024],
  lockup: [2000, 560],
  "lockup-dark": [2000, 560],
};

function useBrandFont() {
  useState(() => {
    const h = delayRender("font");
    new FontFace("Bricolage Grotesque", `url(${staticFile("fonts/BricolageGrotesque.woff2")})`, { weight: "400 800" })
      .load()
      .then((f) => {
        document.fonts.add(f);
        continueRender(h);
      });
    return h;
  });
}

const Icon: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.225,
      background: C.primary,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Mark size={size * 0.84} stroke={C.paper} />
  </div>
);

const Lockup: React.FC<{ dark?: boolean; k?: number }> = ({ dark, k = 1 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 48 * k }}>
    <Mark size={360 * k} stroke={dark ? C.paper : C.primary} />
    <Wordmark size={250 * k} color={dark ? C.paper : C.ink} />
  </div>
);

export const BrandSheet: React.FC<{ variant?: BrandVariant }> = ({ variant = "sheet" }) => {
  useBrandFont();
  if (variant === "icon") return <Icon size={1024} />;
  if (variant === "mark") return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><Mark size={1024} /></AbsoluteFill>;
  if (variant === "mark-light")
    return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><Mark size={1024} stroke={C.paper} /></AbsoluteFill>;
  if (variant === "lockup" || variant === "lockup-dark")
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Lockup dark={variant === "lockup-dark"} />
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill style={{ background: C.paper, fontFamily: F.body, padding: 70, gap: 60 }}>
      <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
        <Icon size={300} />
        <Lockup k={0.5} />
      </div>
      <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
        <div style={{ width: 300, height: 300, flex: "none", borderRadius: 40, background: C.night, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mark size={240} stroke={C.paper} />
        </div>
        <div style={{ flex: "none", background: C.primaryDeep, borderRadius: 40, height: 300, padding: "0 56px", display: "flex", alignItems: "center" }}>
          <Lockup dark k={0.36} />
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
          {[96, 48, 24].map((sz) => (
            <Icon key={sz} size={sz} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
