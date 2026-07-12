import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { Edl, TransitionEvent } from "../../lib/schemas.js";

/**
 * Transitions placed between segments. If you supplied your own transition asset
 * (`overlaySrc`), it plays over the cut. Otherwise a small built-in effect runs:
 * "cut" is invisible; "fade"/"dip"/"dip-to-black" dips through black; anything
 * else does a quick brightness flash so the cut still reads as intentional.
 */
export const TransitionsLayer: React.FC<{ edl: Edl }> = ({ edl }) => {
  const fps = edl.fps;
  const transitions = edl.events.filter((e): e is TransitionEvent => e.type === "transition");

  return (
    <>
      {transitions.map((tr, i) => {
        const dur = Math.max(0.001, tr.durationSeconds);
        const from = Math.round((tr.atSeconds - dur / 2) * fps);
        const durationInFrames = Math.max(1, Math.round(dur * fps));
        if (tr.kind === "cut" && !tr.overlaySrc) return null;
        return (
          <Sequence
            key={i}
            from={Math.max(0, from)}
            durationInFrames={durationInFrames}
            name={`transition ${tr.kind} ${i}`}
          >
            {tr.overlaySrc ? (
              <AbsoluteFill>
                <OffthreadVideo
                  src={tr.overlaySrc}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </AbsoluteFill>
            ) : (
              <BuiltinTransition kind={tr.kind} />
            )}
          </Sequence>
        );
      })}
    </>
  );
};

const BuiltinTransition: React.FC<{ kind: string }> = ({ kind }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames / 2, durationInFrames], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isDark = /fade|dip|black/i.test(kind);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: isDark ? "#000" : "#fff",
        opacity: progress * (isDark ? 1 : 0.65),
      }}
    />
  );
};
