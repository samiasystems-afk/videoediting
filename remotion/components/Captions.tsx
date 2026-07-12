import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import type { Edl, CaptionEvent, CaptionWord, StyleProfile, CaptionStyle } from "../../lib/schemas.js";

/**
 * Animated word-by-word captions. Every visual parameter — colors, font, size,
 * stroke, position, animation, emphasis — comes from the learned style profile
 * (with optional per-caption overrides in the EDL).
 */
export const Captions: React.FC<{ edl: Edl; style: StyleProfile }> = ({ edl, style }) => {
  const fps = edl.fps;
  const captions = edl.events.filter((e): e is CaptionEvent => e.type === "caption");

  return (
    <>
      {captions.map((cap, i) => {
        const from = Math.round(cap.startSeconds * fps);
        const durationInFrames = Math.max(1, Math.round((cap.endSeconds - cap.startSeconds) * fps));
        const cs: CaptionStyle = { ...style.captions, ...(cap.styleOverride ?? {}) };
        return (
          <Sequence key={i} from={from} durationInFrames={durationInFrames} name={`caption ${i}`}>
            <CaptionGroup caption={cap} cs={cs} />
          </Sequence>
        );
      })}
    </>
  );
};

const CaptionGroup: React.FC<{ caption: CaptionEvent; cs: CaptionStyle }> = ({ caption, cs }) => {
  const { height, width } = useVideoConfig();
  const fontSize = cs.fontSizeRel * height;
  const strokeW = cs.strokeWidthRel * fontSize;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        // Anchor the caption block's vertical center at positionY.
        paddingTop: `${cs.positionY * 100}%`,
      }}
    >
      <div
        style={{
          transform: "translateY(-50%)",
          maxWidth: width * 0.86,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: `${fontSize * 0.28}px`,
          fontFamily: cs.fontFamily,
          fontWeight: cs.fontWeight,
          fontSize,
          lineHeight: 1.05,
          textTransform: cs.uppercase ? "uppercase" : "none",
        }}
      >
        {caption.words.map((w, i) => (
          <Word key={i} word={w} cs={cs} strokeW={strokeW} captionStartMs={caption.startSeconds * 1000} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Word: React.FC<{
  word: CaptionWord;
  cs: CaptionStyle;
  strokeW: number;
  captionStartMs: number;
}> = ({ word, cs, strokeW, captionStartMs }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame(); // local to the caption Sequence (0 at caption start)
  const tMs = (frame / fps) * 1000;

  // Word timings in the EDL are absolute (output-timeline) ms. The Sequence
  // resets the frame to 0 at the caption's start, so localize against it.
  const localStartMs = word.startMs - captionStartMs;
  const localEndMs = word.endMs - captionStartMs;

  const appeared = tMs >= localStartMs;
  const active = tMs >= localStartMs && tMs <= localEndMs;

  // Entrance animation keyed to the word's local start frame.
  const startFrame = (localStartMs / 1000) * fps;
  const sinceStart = frame - startFrame;

  let scale = 1;
  let opacity = 1;
  let translateY = 0;

  switch (cs.animation) {
    case "none":
    case "karaoke":
      opacity = appeared ? 1 : 0.001;
      break;
    case "fade":
      opacity = appeared
        ? interpolate(sinceStart, [0, fps * 0.15], [0, 1], { extrapolateRight: "clamp" })
        : 0.001;
      break;
    case "typewriter":
      opacity = appeared ? 1 : 0.001;
      break;
    case "slide-up":
      opacity = appeared
        ? interpolate(sinceStart, [0, fps * 0.18], [0, 1], { extrapolateRight: "clamp" })
        : 0.001;
      translateY = appeared
        ? interpolate(sinceStart, [0, fps * 0.18], [fps * 0.6, 0], { extrapolateRight: "clamp" })
        : 0;
      break;
    case "bounce":
      opacity = appeared ? 1 : 0.001;
      scale = appeared
        ? spring({ frame: sinceStart, fps, config: { damping: 8, stiffness: 140, mass: 0.6 }, from: 0.3, to: 1 })
        : 0.3;
      break;
    case "pop":
    default:
      opacity = appeared ? 1 : 0.001;
      scale = appeared
        ? spring({ frame: sinceStart, fps, config: { damping: 200, stiffness: 200 }, from: 0.6, to: 1 })
        : 0.6;
      break;
  }

  const highlighted = (cs.emphasizeKeywords && word.emphasis) || active;
  const color = highlighted ? cs.highlightColor : cs.textColor;

  const shadow = cs.shadow ? "0px 4px 12px rgba(0,0,0,0.45)" : undefined;
  const stroke = strokeW > 0 ? `${strokeW}px ${cs.strokeColor}` : undefined;

  return (
    <span
      style={{
        display: "inline-block",
        color,
        opacity,
        transform: `translateY(${translateY}px) scale(${highlighted ? scale * 1.06 : scale})`,
        WebkitTextStroke: stroke,
        paintOrder: "stroke fill",
        textShadow: shadow,
      }}
    >
      {word.text}
    </span>
  );
};
