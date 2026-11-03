// Le son d'une vidéo de la balade : l'air du jeu (props bgm : avec ou sans, pour mettre un son TikTok ; la voix et les
// bruitages restent), la voix off (Flora, ElevenLabs v4, « Sarah ») et les bruitages, chacun à son temps. La musique
// baisse sous la voix. Tout part 2 images en avance : l'AAC du MP4 retarde le son d'autant.
import React from "react";
import { interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { s } from "./theme";

const AVANCE = 2;
const VOLUME_VOIX = 0.9;
const VOLUME_SFX = 0.5;
const BAISSE_SOUS_VOIX = 0.45;
const ECART_MINI = 0.08; // (s) entre deux répliques
const borne = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Morceau = { fichier: string; debut: number; volume: number; de?: number; a?: number };
export type Bande = {
  // debut : la seconde de l'air à son départ ; de, a (s) : quand il joue dans la vidéo (toute la vidéo, sinon). Plusieurs morceaux :
  // un air après l'autre (Udo, puis Yakushima)
  musique: Morceau | Morceau[];
  // [fichier de voix/court, début (s), volume (1 sinon : pour une réplique générée plus bas que les autres)]
  voix: [string, number, number?][];
  // [début (s), fichier (sfx/… ou sfx-jeu/…, avec l'extension), volume, durée (s) : pour une ambiance, qui s'efface au bout]
  sfx: [number, string, number, number?][];
  durees: Record<string, number>; // la durée de chaque réplique (s)
};

/** Le rendu s'arrête si deux répliques se superposent, si l'une n'a pas sa durée ou si elle finit après la vidéo. */
const verifier = (bande: Bande, fin: number) => {
  const v = [...bande.voix].sort((p, q) => p[1] - q[1]);
  v.forEach(([nom, a], i) => {
    const d = bande.durees[nom];
    if (d === undefined) throw new Error(`réplique ${nom} : durée inconnue`);
    if (a + d > fin - 0.5) throw new Error(`réplique ${nom} : finit à ${(a + d).toFixed(2)} s, la vidéo à ${fin.toFixed(2)} s`);
    const suivante = v[i + 1];
    if (suivante && a + d + ECART_MINI > suivante[1]) throw new Error(`répliques ${nom} et ${suivante[0]} : elles se superposent (${(a + d).toFixed(2)} s > ${suivante[1].toFixed(2)} s)`);
  });
};

export const Son: React.FC<{ bande: Bande; bgm: boolean }> = ({ bande, bgm }) => {
  const { durationInFrames: duree, fps } = useVideoConfig();
  verifier(bande, duree / fps);
  const sousVoix = (f: number) => Math.max(0, ...bande.voix.map(([nom, a]) => {
    const d = bande.durees[nom];
    return Math.min(interpolate(f, [s(a) - 8, s(a)], [0, 1], borne), interpolate(f, [s(a + d), s(a + d) + 10], [1, 0], borne));
  }));
  const morceaux = Array.isArray(bande.musique) ? bande.musique : [bande.musique];
  return (
    <>
      {bgm ? morceaux.map((m, i) => {
        // (dans une séquence, f compte depuis son début : F, depuis celui de la vidéo)
        const de = s(m.de ?? 0), a = m.a === undefined ? duree : s(m.a), fondu = m.a === undefined ? s(1.4) : 3;
        return (
          <Sequence key={i} from={Math.max(0, de - AVANCE)} durationInFrames={a - de} layout="none">
            <Audio src={staticFile(`musique/${m.fichier}`)} trimBefore={Math.max(0, s(m.debut) + AVANCE - de + Math.max(0, de - AVANCE))}
              volume={(f) => {
                const F = f + de;
                return m.volume * (1 - BAISSE_SOUS_VOIX * sousVoix(F)) * interpolate(F, [de, de + 3, a - fondu, a], [0, 1, 1, 0], borne);
              }} />
          </Sequence>
        );
      }) : null}
      {bande.voix.map(([nom, a, v]) => (
        <Sequence key={nom} from={Math.max(0, s(a) - AVANCE)} layout="none"><Audio src={staticFile(`voix/court/${nom}.wav`)} volume={VOLUME_VOIX * (v ?? 1)} /></Sequence>
      ))}
      {bande.sfx.map(([a, nom, v, d], i) => (
        <Sequence key={i} from={Math.max(0, s(a) - AVANCE)} durationInFrames={s(d ?? 3.4)} layout="none">
          <Audio src={staticFile(nom)} volume={d === undefined ? v * VOLUME_SFX : (f) => v * VOLUME_SFX * interpolate(f, [0, 12, s(d) - 24, s(d)], [0, 1, 1, 0], borne)} />
        </Sequence>
      ))}
    </>
  );
};
