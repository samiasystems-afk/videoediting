import React from "react";
import { AbsoluteFill } from "remotion";
import type { EditedVideoProps } from "./props.js";
import { MainTrack } from "./components/MainTrack.js";
import { BrollLayer } from "./components/BrollLayer.js";
import { Captions } from "./components/Captions.js";
import { SfxLayer } from "./components/SfxLayer.js";
import { TransitionsLayer } from "./components/TransitionsLayer.js";

/**
 * The full assembled video. Layer order (bottom → top):
 *   1. background          — shows through any gap in the main track
 *   2. main video track    — sequential clips, wrapped in style zooms
 *   3. B-roll inserts       — overlaid full-frame for their duration
 *   4. transitions          — your transition assets / built-in effects over cuts
 *   5. captions             — animated word-by-word, on top of everything visual
 *   6. SFX (audio only)     — your extracted sound kit
 */
export const EditedVideo: React.FC<EditedVideoProps> = ({ edl, style }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: edl.backgroundColor }}>
      <MainTrack edl={edl} />
      <BrollLayer edl={edl} />
      <TransitionsLayer edl={edl} />
      <Captions edl={edl} style={style} />
      <SfxLayer edl={edl} />
    </AbsoluteFill>
  );
};
