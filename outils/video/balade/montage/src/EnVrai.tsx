// « What if my game was real? » (2026-11-12, le propriétaire : « J'ai un abonnement Higgsfield pour 3 jours tu peux l'utiliser
// pour créer des vidéos promotionnelles de qualité », puis, parmi mes propositions, « Mon jeu en vrai »). Six lieux de la balade :
// chacun d'abord dans le jeu, puis une ligne de lumière en biais le balaie et découvre la même vue « en vrai » : la voyageuse
// devenue une vraie jeune femme, le compagnon un vrai shiba blanc, le lieu photographique. Les vues « en vrai » sont générées avec
// Higgsfield (une image Nano Banana faite sur la première image de la prise du jeu et une vraie photo du lieu, puis Seedance 2.0
// depuis cette image, avec un mouvement qui suit celui de la prise) : elles partent donc de la même image que la prise, et les deux
// jouent ensemble, de part et d'autre de la ligne. Leur son d'origine (vagues, oiseaux, rames…) monte quand la ligne passe. À la
// fin, la ligne repasse dans l'autre sens : on revient au jeu, et on peut y jouer. 19,3 s sur l'air de la danse des fêtes (odori,
// 112 battements, depuis l'entrée de sa mélodie), sans voix. Ça a l'air vrai : le propriétaire doit activer l'étiquette « contenu
// généré par IA » de TikTok en publiant.
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Cadre, Etiquette, Fin, Video } from "./commun";
import { Bande, Son } from "./Son";
import { C, entre, expoS, FPS, POLICE, rebond, W } from "./theme";

const BPM = 112;
/** L'image du temps n (0 : le début de la vidéo, sur l'entrée de la mélodie). */
const b = (n: number) => Math.round((n * 60 * FPS) / BPM);
const sec = (n: number) => (n * 60) / BPM;
export const LONGUEUR_EN_VRAI = b(36);

/** Un lieu : de, a (temps) ; sa prise du jeu (première image = celle de la vue « en vrai ») ; la vue « en vrai » ; la ligne passe
 *  de volet à volet + duree (temps) ; retour : elle repasse dans l'autre sens (du vrai vers le jeu). */
type Lieu = { de: number; a: number; jeu: string; vrai: string; volet: number; duree: number; nom: string; ja: string; retour?: boolean };
const LIEUX: Lieu[] = [
  // le crochet : la ligne passe déjà à la première image (elle sert de couverture), lentement
  { de: 0, a: 6, jeu: "it-plage", vrai: "itsukushima", volet: 0, duree: 3.0, nom: "Itsukushima", ja: "厳島神社" },
  { de: 6, a: 10, jeu: "kk-reflet", vrai: "kinkakuji", volet: 0.75, duree: 1.25, nom: "Kinkaku-ji", ja: "金閣寺" },
  { de: 10, a: 14, jeu: "mt-tunnel", vrai: "motonosumi", volet: 0.75, duree: 1.25, nom: "Motonosumi", ja: "元乃隅神社" },
  { de: 14, a: 18, jeu: "tk-barque", vrai: "takachiho", volet: 0.75, duree: 1.25, nom: "Takachiho", ja: "高千穂峡" },
  { de: 18, a: 22, jeu: "hm-pont", vrai: "himeji", volet: 0.75, duree: 1.25, nom: "Himeji Castle", ja: "姫路城" },
  { de: 22, a: 26, jeu: "gk-village", vrai: "gokayama", volet: 0.75, duree: 1.25, nom: "Gokayama", ja: "五箇山" },
  // retour au jeu : la même vue de Gokayama, la ligne repasse ; le jeu continue derrière la fin
  { de: 26, a: 36, jeu: "gk-village", vrai: "gokayama", volet: 0.5, duree: 1.0, nom: "", ja: "", retour: true },
];
const FIN = b(30);
const ZOOM: [number, number] = [1.0, 1.05];

/** Une étiquette de part et d'autre de la ligne. */
const Pastille: React.FC<{ texte: string; jeu: boolean; x: number; o: number }> = ({ texte, jeu, x, o }) => (
  <div style={{
    position: "absolute", top: 1060, [jeu ? "right" : "left"]: jeu ? W - x + 54 : Math.max(36, x + 54), opacity: o,
    fontFamily: POLICE, fontWeight: 800, fontSize: 40, letterSpacing: 3, color: jeu ? C.encre : "#fff",
    background: jeu ? "rgba(255,250,240,.94)" : C.rouge, border: `5px solid ${C.encre}`, borderRadius: 999, padding: "8px 26px",
    boxShadow: "0 8px 24px rgba(0,0,0,.35)", whiteSpace: "nowrap",
  }}>{texte}</div>
);

/** Un lieu : la vue « en vrai » dessous, le jeu par-dessus, à gauche d'une ligne de lumière en biais qui va de droite à gauche
 *  (au retour : le vrai par-dessus, et le jeu se découvre). Les deux partent de leur première image au début du lieu. */
const UnLieu: React.FC<{ l: Lieu }> = ({ l }) => {
  const f = useCurrentFrame(); // (depuis le début du lieu)
  const duree = b(l.a) - b(l.de);
  const v0 = b(l.de + l.volet) - b(l.de), D = b(l.de + l.volet + l.duree) - b(l.de + l.volet);
  // (le crochet : la ligne est déjà au tiers de l'écran à la première image, la couverture montre les deux côtés, puis elle
  // continue d'un pas régulier ; ailleurs, elle part et freine en S)
  const u = l.de === 0
    ? 0.36 + 0.64 * (entre(f, 0, D) * 0.6 + expoS(entre(f, 0, D)) * 0.4)
    : expoS(entre(f, v0, v0 + D)) * 0.55 + entre(f, v0, v0 + D) * 0.45;
  const x = 1240 - 1400 * u, biais = 300;
  const poly = `polygon(0 0, ${x + biais / 2}px 0, ${x - biais / 2}px 100%, 0 100%)`;
  const dessus = l.retour ? `reel/vrai-${l.vrai}` : `carte/${l.jeu}`;
  const dessous = l.retour ? `carte/${l.jeu}` : `reel/vrai-${l.vrai}`;
  // un coup de zoom à l'arrivée du lieu (une coupe sur le temps)
  const punch = l.de === 0 ? 1 : 1 + 0.08 * (1 - rebond(f, 0, 320, 20));
  const oPastilles = Math.min(1, Math.max(0, (f - v0 + 8) / 8)) * (1 - entre(f, v0 + D, v0 + D + 10));
  return (
    <AbsoluteFill style={{ transform: `scale(${punch.toFixed(4)})` }}>
      <Video prise={dessous} duree={duree} zoom={ZOOM} />
      {u < 1 && (
        <AbsoluteFill style={{ clipPath: poly }}>
          <Video prise={dessus} duree={duree} zoom={ZOOM} />
        </AbsoluteFill>
      )}
      {u > 0 && u < 1 && (
        <div style={{
          position: "absolute", top: -100, bottom: -100, left: x - 7, width: 14, background: "#fff",
          transform: `skewX(${(-Math.atan2(biais, 1920) * 180 / Math.PI).toFixed(2)}deg)`,
          boxShadow: "0 0 30px 12px rgba(255,255,255,.75), 0 0 90px 30px rgba(255,236,190,.45)",
        }} />
      )}
      <Pastille texte={l.retour ? "BUT REAL" : "MY GAME"} jeu={!l.retour} x={x} o={oPastilles} />
      <Pastille texte={l.retour ? "MY GAME" : "BUT REAL"} jeu={!!l.retour} x={x} o={oPastilles} />
    </AbsoluteFill>
  );
};

const BANDE: Bande = {
  musique: { fichier: "odori.wav", debut: 0.15 + sec(8), volume: 2.0 },
  voix: [],
  durees: {},
  sfx: [
    // la ligne de lumière, à chaque passage ; le son du lieu « en vrai » monte avec elle (et s'en va au lieu suivant). (À 1,6, ambiance
    // et effets étaient aussi forts que la musique, parfois 5 dB au-dessus : 1,0.)
    ...LIEUX.flatMap((l): [number, string, number, number?][] => [
      [sec(l.de + l.volet) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.5],
      [sec(l.de + l.volet), "sfx-jeu/magie.wav", 0.45],
      ...(l.retour ? [] : [[sec(l.de + l.volet), `sfx/vrai-${l.vrai}.wav`, 1.0, sec(l.a - l.de - l.volet) + 0.25] as [number, string, number, number]]),
      ...(l.de > 0 && !l.retour ? [[sec(l.de) - 0.12, "sfx/swoosh-quick.mp3", 0.5] as [number, string, number]] : []),
    ]),
    // la fin
    [sec(30), "sfx/sparkle-touch.mp3", 0.6], [sec(30) + 0.4, "sfx/pop.mp3", 0.5],
  ],
};

export const EnVrai: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  // le flou de mouvement seulement autour des coupes (le coup de zoom)
  const flou = LIEUX.some((l) => l.de > 0 && f >= b(l.de) - 1 && f <= b(l.de) + 8);
  const image = (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {LIEUX.map((l, i) => (
        <Sequence key={i} from={b(l.de)} durationInFrames={b(l.a) - b(l.de)} layout="none">
          <UnLieu l={l} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {flou ? <CameraMotionBlur shutterAngle={200} samples={6}>{image}</CameraMotionBlur> : image}
      {/* (le dégradé sous les mots du haut) */}
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.28) 0px, rgba(0,0,0,0) 520px)", opacity: f < FIN ? 1 : 0 }} />
      <Cadre texte={"What if my game\nwas *real*? 🤯"} de={-60} a={b(5.5)} y={230} taille={74} />
      {LIEUX.filter((l) => l.nom).map((l, i) => (
        <Etiquette key={i} n={String(i + 1)} nom={l.nom} ja={l.ja} de={b(l.de + l.volet + l.duree) - 4} a={b(l.a) - 6} y={1250} />
      ))}
      <Cadre texte={"You can *play* it 🎮\nfor free, on my map"} de={b(26.5)} a={FIN - 6} y={230} taille={70} />
      <Fin de={FIN} titre={"Japan in 3D"} ligne={"Walk it in 3D · free"} />
      <Son bande={BANDE} bgm={bgm} />
    </AbsoluteFill>
  );
};
