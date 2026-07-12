import React from "react";
import { Composition } from "remotion";
import { EditedVideo } from "./EditedVideo.js";
import { PLACEHOLDER_PROPS, type EditedVideoProps } from "./props.js";

/**
 * The composition's real dimensions/fps/duration come from the EDL prop at
 * render time, so we derive them in calculateMetadata rather than hardcoding.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="EditedVideo"
      component={EditedVideo}
      defaultProps={PLACEHOLDER_PROPS}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={90}
      calculateMetadata={({ props }) => {
        const { edl } = props;
        return {
          width: edl.width,
          height: edl.height,
          fps: edl.fps,
          durationInFrames: Math.max(1, Math.round(edl.durationSeconds * edl.fps)),
        };
      }}
    />
  );
};
