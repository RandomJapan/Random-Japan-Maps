// Une composition par épisode (Day1, Day2…), lue dans episodes.json (écrit par preparer.py). La miniature est l'image 0 de
// chaque épisode (déjà posée : texte compris), rendue par finir.py.
import React from "react";
import { Composition } from "remotion";
import { Daily, DUREE } from "./Daily";
import EPISODES from "./episodes.json";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    {Object.keys(EPISODES).map((n) => (
      <Composition key={n} id={`Day${n}`} component={Daily} durationInFrames={DUREE} fps={FPS} width={W} height={H}
        defaultProps={{ jour: Number(n), bgm: true }} />
    ))}
  </>
);
