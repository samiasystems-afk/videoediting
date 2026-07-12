import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, useCurrentFrame, interpolate } from "remotion";
import type { Edl, ClipEvent, ZoomEvent } from "../../lib/schemas.js";

/**
 * The primary video track: the ordered sequence of `main` clips, wrapped in a
 * zoom transform driven by the EDL's zoom events. Punch-in zooms ramp up at the
 * start, hold, and ramp back down — matching the learned style.
 */
export const MainTrack: React.FC<{ edl: Edl }> = ({ edl }) => {
  const fps = edl.fps;
  const clips = edl.events.filter(
    (e): e is ClipEvent => e.type === "clip" && e.track === "main",
  );
  const zooms = edl.events.filter((e): e is ZoomEvent => e.type === "zoom");

  return (
    <ZoomWrapper zooms={zooms} fps={fps}>
      {clips.map((clip, i) => {
        const from = Math.round(clip.timelineStartSeconds * fps);
        const durationInFrames = Math.max(1, Math.round((clip.outSeconds - clip.inSeconds) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={durationInFrames} name={clip.label ?? `clip ${i}`}>
            <OffthreadVideo
              src={clip.src}
              trimBefore={Math.round(clip.inSeconds * fps)}
              trimAfter={Math.round(clip.outSeconds * fps)}
              muted={clip.muted}
            />
          </Sequence>
        );
      })}
    </ZoomWrapper>
  );
};

const ZoomWrapper: React.FC<{
  zooms: ZoomEvent[];
  fps: number;
  children: React.ReactNode;
}> = ({ zooms, fps, children }) => {
  const frame = useCurrentFrame();
  const t = frame / fps;

  // Combine overlapping zooms by taking the strongest scale at this instant.
  let scale = 1;
  let originX = 0.5;
  let originY = 0.5;
  for (const z of zooms) {
    const ramp = Math.max(0.0001, z.rampSeconds);
    const s = interpolate(
      t,
      [z.startSeconds, z.startSeconds + ramp, z.endSeconds - ramp, z.endSeconds],
      [1, z.scale, z.scale, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    if (s > scale) {
      scale = s;
      originX = z.focusX;
      originY = z.focusY;
    }
  }

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale})`,
        transformOrigin: `${originX * 100}% ${originY * 100}%`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
