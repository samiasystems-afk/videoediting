import React, { useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import timeline from "./timeline.json";
import { Hook, Missed, Questions, Reflect, Sheet } from "./scenes/Pain.js";
import { Turn } from "./scenes/Turn.js";
import { Board, Matches, Next, Onboard, Recap, Remind, Source } from "./scenes/Product.js";
import { Globe } from "./scenes/Globe.js";
import { Cta } from "./scenes/Cta.js";

export type PromoProps = { audio: string | null };

type SceneComp = React.FC<{ t: number; fps: number; dur: number }>;
const SCENES: [keyof typeof timeline.scenes, SceneComp][] = [
  ["hook", Hook],
  ["questions", Questions],
  ["sheet", Sheet],
  ["missed", Missed],
  ["reflect", Reflect],
  ["turn", Turn],
  ["onboard", Onboard],
  ["matches", Matches],
  ["source", Source],
  ["board", Board],
  ["next", Next],
  ["remind", Remind],
  ["recap", Recap],
  ["globe", Globe],
  ["cta", Cta],
];

const FONTS: [string, string, string][] = [
  ["Bricolage Grotesque", "fonts/BricolageGrotesque.woff2", "400 800"],
  ["Onest", "fonts/Onest.woff2", "400 800"],
  ["JetBrains Mono", "fonts/JetBrainsMono.woff2", "500"],
];

function useFonts() {
  const [handle] = useState(() => {
    const h = delayRender("brand fonts");
    Promise.all(
      FONTS.map(([family, file, weight]) => new FontFace(family, `url(${staticFile(file)})`, { weight }).load()),
    )
      .then((faces) => {
        faces.forEach((f) => document.fonts.add(f));
        continueRender(h);
      })
      .catch((err) => {
        console.error(err);
        continueRender(h);
      });
    return h;
  });
  return handle;
}

const Scene: React.FC<{ C: SceneComp; dur: number }> = ({ C, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <C t={frame / fps} fps={fps} dur={dur} />;
};

export const Promo: React.FC<PromoProps> = ({ audio }) => {
  useFonts();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "black" }}>
      {SCENES.map(([key, Comp]) => {
        const [s, e] = timeline.scenes[key];
        const from = Math.round(s * fps);
        const durF = Math.round(e * fps) - from;
        return (
          <Sequence key={key} from={from} durationInFrames={durF} name={key}>
            <Scene C={Comp} dur={e - s} />
          </Sequence>
        );
      })}
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
