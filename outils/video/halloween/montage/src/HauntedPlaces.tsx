// Vidéo 1 : « Japan's most haunted places » (20 s). L'accroche : un tunnel noir et le titre dès la première image ;
// puis quatre lieux hantés, chacun avec la carte la nuit (plongée sur le lieu, ses yōkai) et la vidéo du
// propriétaire dans une carte-photo ; la fin : tout est sur la carte, avec sept yōkai à trouver. Un conteur (voix off
// « George », ElevenLabs par Flora) dit chaque lieu : les plans durent le temps de sa phrase.
// Musique : « Kengeki » de PeriTune (CC BY 4.0), environ 165 battements par minute, premier temps à 0,27 s (mesurés :
// autocorrélation du flux spectral, et les premières attaques à 1,00, 1,36 et 2,08 s) : les coupes tombent sur les temps.
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import {
  Ambiance, CartePhoto, ClipPlein, Eclair, Etiquette, Fin, Glisse, GrosTitre, Musique, Nappe, Rush, Son, SourcesCarte, Voix,
} from "./commun";

const TEMPS = 60 / 165;
const b = (n: number) => Math.round((0.27 + n * TEMPS) * 30); // le n-ième temps, en images
export const DUREE_HANTES = 600;

const LIEUX = [
  { voix: "hantes-nagoro", rush: "v1-nagoro", clip: "nagoro-classe", clipDebut: 1.2, nom: "Nagoro", ou: "Tokushima · the scarecrow village", phrase: "Here, dolls outnumber the living.", legende: "Nagoro" },
  { voix: "hantes-osorezan", rush: "v1-osorezan", clip: "osorezan-jizo", clipDebut: 0.4, nom: "Mount Osore", ou: "Aomori · 恐山", phrase: "Said to be the gate to the afterlife.", legende: "Osorezan" },
  { voix: "hantes-enfer", rush: "v1-noboribetsu", clip: "enfer-vapeur", clipDebut: 0, clipVitesse: 0.4, nom: "Hell Valley", ou: "Noboribetsu, Hokkaidō · 地獄谷", phrase: "It steams and boils, day and night.", legende: "Jigokudani" },
  { voix: "hantes-himeji", rush: "v1-himeji", clip: "himeji-ombre", clipDebut: 0.3, nom: "Himeji Castle", ou: "Hyōgo · 姫路城", phrase: "A ghost still counts plates in its well…", legende: "Okiku's well" },
];

export const HauntedPlaces: React.FC<{ musique: boolean }> = ({ musique }) => {
  // l'accroche : neuf temps (la phrase du conteur) ; chaque lieu, neuf temps ; la fin, le reste (3,4 s)
  const debuts = [b(9), b(18), b(27), b(36), b(45)];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* L'accroche : l'entrée du tunnel, puis dedans */}
      <Sequence durationInFrames={b(5)} name="Tunnel">
        <ClipPlein nom="tunnel-entree" debut={0.5} y={46} zoom={[1.05, 1.16]} />
      </Sequence>
      <Sequence from={b(5)} durationInFrames={debuts[0] - b(5)} name="Tunnel dedans">
        <ClipPlein nom="tunnel" debut={1.0} vitesse={1.3} y={45} zoom={[1.1, 1.22]} />
      </Sequence>
      <Sequence durationInFrames={debuts[0]} name="Titre">
        <GrosTitre haut="DON'T GO THERE AT NIGHT" titre="Japan's most haunted places" bas="…and they're all on my map" />
      </Sequence>
      <Sequence from={4} durationInFrames={8} name="Éclair du début"><Eclair duree={8} force={0.55} /></Sequence>
      <Sequence from={b(5) - 1} durationInFrames={10} name="Éclair"><Eclair /></Sequence>

      {/* Les quatre lieux */}
      {LIEUX.map((l, i) => {
        const duree = debuts[i + 1] - debuts[i];
        return (
          <Sequence key={l.rush} from={debuts[i]} durationInFrames={duree} name={l.nom}>
            <Glisse duree={duree}>
              <Rush nom={l.rush} debut={0.9} vitesse={1.25} />
              <SourcesCarte />
              <CartePhoto nom={l.clip} debut={l.clipDebut} vitesse={"clipVitesse" in l ? l.clipVitesse : 1} penche={i % 2 ? -3 : 3} legende={l.legende} />
              <Etiquette n={i + 1} nom={l.nom} ou={l.ou} phrase={l.phrase} />
            </Glisse>
          </Sequence>
        );
      })}

      {/* La fin : le Kansai la nuit, ses yōkai ; l'adresse */}
      <Sequence from={debuts[4]} name="Fin">
        <Rush nom="v1-fin" debut={1.2} vitesse={1.3} />
        <SourcesCarte />
        <Fin accroche="All on my 3D map of Japan" sous="+ 7 hidden yōkai to find 🎃" credit={musique ? "♪ Kengeki · PeriTune (CC BY 4.0)" : undefined} />
      </Sequence>
      <Sequence from={debuts[4] - 1} durationInFrames={8}><Eclair duree={8} force={0.7} /></Sequence>

      <Ambiance />

      {/* Le son */}
      {musique ? <Musique nom="peritune-kengeki" fin={DUREE_HANTES} volume={0.42} /> : null}
      <Nappe nom="vent" fin={DUREE_HANTES} volume={0.35} />
      <Voix nom="hantes-accroche" a={0} />
      {LIEUX.map((l, i) => <Voix key={l.voix} nom={l.voix} a={debuts[i] + 2} />)}
      <Voix nom="hantes-fin" a={debuts[4] + 1} />
      <Son nom="tonnerre" a={3} volume={0.8} />
      <Son nom="heartbeat-single" a={20} volume={0.7} />
      <Son nom="glitch-static" a={b(5) - 2} volume={0.3} />
      {debuts.slice(0, 4).map((d) => <Son key={d} nom="whoosh-fast" a={d - 6} volume={0.55} />)}
      {debuts.slice(0, 4).map((d) => <Son key={`p${d}`} nom="bass-hit-short" a={d + 4} volume={0.6} />)}
      <Son nom="tonnerre" a={debuts[4] - 2} volume={0.6} />
    </AbsoluteFill>
  );
};
