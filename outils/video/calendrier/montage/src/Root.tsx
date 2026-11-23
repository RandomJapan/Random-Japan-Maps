// Les vidéos du calendrier de l'Avent (2026-11-23) : la promo « les cadeaux sont vrais » et le tutoriel de la grue, 9:16 pour
// TikTok (et les Shorts), 60 images/s. Avec ou sans la musique (props { bgm: false } : pour mettre un son TikTok ; les bruitages
// restent). Et leurs miniatures.
import React from "react";
import { Composition, Freeze } from "remotion";
import { Cadeaux, DUREE_CADEAUX, MiniatureCadeaux } from "./Cadeaux";
import { Cases, DUREE_CASES } from "./Cases";
import { DUREE_JOURS, Jours } from "./Jours";
import { DUREE_TRADITIONS, Traditions } from "./Traditions";
import { DUREE_GRUE, Grue, MiniatureGrue } from "./Grue";
import { FPS, H, W } from "./theme";

// les vidéos de Noël (plan-noel.md) : la miniature est leur première image (déjà posée, texte compris)
const premiere = (C: React.FC<{ bgm: boolean }>): React.FC => () => <Freeze frame={0}><C bgm={false} /></Freeze>;
const MiniatureJours = premiere(Jours), MiniatureTraditions = premiere(Traditions), MiniatureCases = premiere(Cases);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Cadeaux" component={Cadeaux} durationInFrames={DUREE_CADEAUX} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="Grue" component={Grue} durationInFrames={DUREE_GRUE} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="MiniatureCadeaux" component={MiniatureCadeaux} durationInFrames={1} fps={FPS} width={W} height={H} />
    <Composition id="MiniatureGrue" component={MiniatureGrue} durationInFrames={1} fps={FPS} width={W} height={H} />
    <Composition id="Jours" component={Jours} durationInFrames={DUREE_JOURS} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="Traditions" component={Traditions} durationInFrames={DUREE_TRADITIONS} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="Cases" component={Cases} durationInFrames={DUREE_CASES} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="MiniatureJours" component={MiniatureJours} durationInFrames={1} fps={FPS} width={W} height={H} />
    <Composition id="MiniatureTraditions" component={MiniatureTraditions} durationInFrames={1} fps={FPS} width={W} height={H} />
    <Composition id="MiniatureCases" component={MiniatureCases} durationInFrames={1} fps={FPS} width={W} height={H} />
  </>
);
