import React from "react";
import { Composition } from "remotion";
import { Promo, type PromoProps } from "./Promo.js";
import { BrandSheet, BRAND_SIZES, type BrandVariant } from "./BrandSheet.js";
import timeline from "./timeline.json";

export const Root: React.FC = () => (
  <>
    <Composition
      id="DegreeFirstPromo"
      component={Promo}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={timeline.duration * 30}
      defaultProps={{ audio: null } as PromoProps}
      calculateMetadata={({ props }) => {
        const fps = (props as PromoProps & { fps?: number }).fps ?? 30;
        return { fps, durationInFrames: Math.round(timeline.duration * fps) };
      }}
    />
    <Composition
      id="Brand"
      component={BrandSheet}
      width={1600}
      height={1000}
      fps={30}
      durationInFrames={1}
      defaultProps={{ variant: "sheet" as BrandVariant }}
      calculateMetadata={({ props }) => {
        const [width, height] = BRAND_SIZES[((props as { variant?: BrandVariant }).variant ?? "sheet") as BrandVariant];
        return { width, height };
      }}
    />
  </>
);
