// Les trois vidéos d'Halloween (2026-10-21), en 16:9, 30 images/s, 20 s au plus. Chacune existe avec et sans
// musique (props { musique: false } : pour mettre un son TikTok, les bruitages restent).
import React from "react";
import { Composition } from "remotion";
import { DUREE_HANTES, HauntedPlaces } from "./HauntedPlaces";
import { DUREE_DEFILE, NightParade } from "./NightParade";
import { DUREE_SPOOKY, SpookyMap } from "./SpookyMap";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HauntedPlaces" component={HauntedPlaces} durationInFrames={DUREE_HANTES} fps={30} width={1920} height={1080} defaultProps={{ musique: true }} />
    <Composition id="NightParade" component={NightParade} durationInFrames={DUREE_DEFILE} fps={30} width={1920} height={1080} defaultProps={{ musique: true }} />
    <Composition id="SpookyMap" component={SpookyMap} durationInFrames={DUREE_SPOOKY} fps={30} width={1920} height={1080} defaultProps={{ musique: true }} />
  </>
);
