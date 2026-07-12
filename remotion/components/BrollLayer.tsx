import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence } from "remotion";
import type { Edl, ClipEvent } from "../../lib/schemas.js";

/**
 * B-roll inserts: `broll`-track clips overlaid full-frame on top of the main
 * track for their duration. Their audio is usually muted so the talking-head
 * audio underneath keeps playing.
 */
export const BrollLayer: React.FC<{ edl: Edl }> = ({ edl }) => {
  const fps = edl.fps;
  const broll = edl.events.filter(
    (e): e is ClipEvent => e.type === "clip" && e.track === "broll",
  );

  return (
    <>
      {broll.map((clip, i) => {
        const from = Math.round(clip.timelineStartSeconds * fps);
        const durationInFrames = Math.max(1, Math.round((clip.outSeconds - clip.inSeconds) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={durationInFrames} name={clip.label ?? `broll ${i}`}>
            <AbsoluteFill style={{ backgroundColor: "#000" }}>
              <OffthreadVideo
                src={clip.src}
                trimBefore={Math.round(clip.inSeconds * fps)}
                trimAfter={Math.round(clip.outSeconds * fps)}
                muted={clip.muted}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </>
  );
};
