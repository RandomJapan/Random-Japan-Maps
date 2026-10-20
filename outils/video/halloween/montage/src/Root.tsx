// Les trois vidéos d'Halloween (2026-10-21), 30 images/s, 20 s au plus : en 16:9 (1920 × 1080) et en vertical 9:16
// pour TikTok (1080 × 1920, « …V » : mêmes temps et mêmes sons, les rushes de rushes-v/). Chacune existe avec et sans
// musique (props { musique: false } : pour mettre un son TikTok, les bruitages restent).
import React from "react";
import { Composition } from "remotion";
import { DUREE_HANTES, HauntedPlaces } from "./HauntedPlaces";
import { DUREE_DEFILE, NightParade } from "./NightParade";
import { DUREE_SPOOKY, SpookyMap } from "./SpookyMap";

const VIDEOS = [
  { id: "HauntedPlaces", component: HauntedPlaces, durationInFrames: DUREE_HANTES },
  { id: "NightParade", component: NightParade, durationInFrames: DUREE_DEFILE },
  { id: "SpookyMap", component: SpookyMap, durationInFrames: DUREE_SPOOKY },
];

export const RemotionRoot: React.FC = () => (
  <>
    {VIDEOS.map((c) => (
      <React.Fragment key={c.id}>
        <Composition {...c} fps={30} width={1920} height={1080} defaultProps={{ musique: true }} />
        <Composition {...c} id={`${c.id}V`} fps={30} width={1080} height={1920} defaultProps={{ musique: true }} />
      </React.Fragment>
    ))}
  </>
);
