import React from "react";
import { Audio, Sequence } from "remotion";
import type { Edl, SfxEvent } from "../../lib/schemas.js";

/**
 * Sound-effect layer: plays your own extracted SFX (from assets/sfx/, rewritten
 * to file:// URLs at render time) at the moments the agent placed them.
 */
export const SfxLayer: React.FC<{ edl: Edl }> = ({ edl }) => {
  const fps = edl.fps;
  const sfx = edl.events.filter((e): e is SfxEvent => e.type === "sfx");
  return (
    <>
      {sfx.map((s, i) => (
        <Sequence key={i} from={Math.round(s.atSeconds * fps)} name={`sfx ${i}`}>
          <Audio src={s.file} volume={s.gain} />
        </Sequence>
      ))}
    </>
  );
};
