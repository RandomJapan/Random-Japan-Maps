// L'écran TikTok et le profil @random_japan_place, reconstruits d'après les captures du propriétaire (en anglais,
// vus depuis un autre compte, le 2026-10-21) : chaque élément est un calque à sa profondeur (translateZ), qui arrive
// avec le ressort « nerveux ». Les pages font 1080 × 2340 (la capture 923 × 2000 × 1,17) ; la caméra (Telephone.tsx)
// les met en perspective. Le profil est celui que voit un visiteur qui ne suit pas encore le compte (bouton rouge
// « Follow ») ; le disque du son montre la photo du compte (le vrai post a la pochette d'un morceau, à d'autres).
import React from "react";
import { Img, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { AjoutAmi, Amis, Bulle, Cloche, Coeur, Etat, Grille, Loupe, Maison, Messages, Note, PartageContour, Partage, Personne, Plus, Reposte, Retour, Signet } from "./Icones";
import { C, entre, expoSortie, POLICE_TIKTOK, rebond, s } from "./theme";
import { T } from "./temps";

export const LARGEUR = 1080, HAUTEUR = 2340;
const OMBRE_TEXTE = "0 2px 6px rgba(0,0,0,.45), 0 0 18px rgba(0,0,0,.25)";

type CalqueProps = {
  x: number; y: number; z: number; kz: number; arrivee?: number; children: React.ReactNode;
  style?: React.CSSProperties; w?: number; h?: number;
};
/** Un calque de l'interface, à sa profondeur z (× kz : 0 pendant le plongeon) ; s'il a une arrivée, il vient de
 *  140 px devant l'écran et rebondit en place (le ressort « nerveux »). */
export const Calque: React.FC<CalqueProps> = ({ x, y, z, kz, arrivee, children, style, w, h }) => {
  const f = useCurrentFrame();
  const v = arrivee === undefined ? 1 : rebond(f, arrivee);
  const dz = (z + 140 * (1 - v)) * kz;
  const opacite = arrivee === undefined ? 1 : Math.min(1, Math.max(0, (f - arrivee) / 5));
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h, opacity: opacite,
      transform: `translateZ(${dz.toFixed(2)}px) scale(${(0.55 + 0.45 * v).toFixed(4)})`, transformOrigin: "50% 50%",
      ...style,
    }}>{children}</div>
  );
};

/** Le doigt du visiteur : un rond translucide qui vient se poser, appuie (il rétrécit) et lance une onde. */
export const Doigt: React.FC<{ chemin: [number, number, number][]; appui: number; z?: number; clair?: boolean }> = ({ chemin, appui, z = 150, clair }) => {
  const f = useCurrentFrame();
  const debut = chemin[0][0];
  if (f < debut || f > appui + s(0.5)) return null;
  // la position : de clé en clé, en S exponentiel
  let x = chemin[0][1], y = chemin[0][2];
  for (let i = 1; i < chemin.length; i++) {
    const [f1, x1, y1] = chemin[i], [f0, x0, y0] = chemin[i - 1];
    if (f >= f0) { const u = expoSortie(entre(f, f0, f1)); x = x0 + (x1 - x0) * u; y = y0 + (y1 - y0) * u; }
  }
  const presse = f >= appui && f < appui + 5 ? 0.78 : f >= appui + 5 ? 0.78 + 0.22 * rebond(f, appui + 5) : 1;
  const apparition = Math.min(1, (f - debut) / 6), depart = f > appui + s(0.3) ? 1 - (f - appui - s(0.3)) / s(0.2) : 1;
  const onde = entre(f, appui, appui + s(0.38));
  const teinte = clair ? "rgba(255,255,255,.38)" : "rgba(22,24,35,.2)";
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateZ(${z}px)`, opacity: Math.max(0, Math.min(apparition, depart)) }}>
      {f >= appui && (
        <div style={{
          position: "absolute", left: 0, top: 0, width: 100 + 220 * expoSortie(onde), height: 100 + 220 * expoSortie(onde), borderRadius: "50%",
          transform: "translate(-50%, -50%)", border: `5px solid ${clair ? "rgba(255,255,255,.85)" : "rgba(32,213,236,.9)"}`, opacity: 1 - onde,
        }} />
      )}
      <div style={{
        position: "absolute", left: 0, top: 0, width: 104, height: 104, borderRadius: "50%", transform: `translate(-50%, -50%) scale(${presse})`,
        background: teinte, border: "4px solid rgba(255,255,255,.95)", boxShadow: "0 14px 34px rgba(0,0,0,.35), inset 0 0 0 2px rgba(0,0,0,.08)",
      }} />
    </div>
  );
};

/** Un bouton de la colonne de droite : l'icône et son compte. */
const Action: React.FC<{ icone: React.ReactNode; texte: string }> = ({ icone, texte }) => (
  <div style={{ width: 150, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, filter: "drop-shadow(0 3px 6px rgba(0,0,0,.35))" }}>
    {icone}
    <span style={{ color: "#fff", fontSize: 34, fontWeight: 700, textShadow: OMBRE_TEXTE }}>{texte}</span>
  </div>
);

/** Le post Aogashima dans le fil « For You ». kz : la profondeur des calques (0 = tout à plat). */
export const PagePost: React.FC<{ kz: number }> = ({ kz }) => {
  const f = useCurrentFrame();
  const appuiNom = f >= T.tapNom - 2 && f < T.tapNom + 9;
  const avance = Math.min(1, f / s(3.6)); // la barre de lecture
  const disque = (f / 60) * 70; // le disque du son tourne
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: LARGEUR, height: HAUTEUR, transformStyle: "preserve-3d", fontFamily: POLICE_TIKTOK }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 74, background: "#000", boxShadow: "0 80px 180px rgba(0,0,0,.6), 0 0 0 3px rgba(255,255,255,.08)" }} />
      <OffthreadVideo src={staticFile("tiktok/aogashima.mp4")} muted
        style={{ position: "absolute", left: 0, top: 0, width: LARGEUR, height: 2200, objectFit: "cover", borderRadius: "74px 74px 0 0" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: LARGEUR, height: 2200, borderRadius: "74px 74px 0 0",
        background: "linear-gradient(rgba(0,0,0,.42), rgba(0,0,0,0) 16%, rgba(0,0,0,0) 62%, rgba(0,0,0,.55))" }} />
      <Calque x={0} y={0} z={18} kz={kz} w={LARGEUR}><Etat couleur="#fff" /></Calque>
      {/* les onglets du haut : « Following », « For You » (actif), la loupe */}
      <Calque x={0} y={120} z={26} kz={kz} w={LARGEUR} h={110}>
        <div style={{ display: "flex", justifyContent: "center", gap: 46, alignItems: "flex-start", color: "#fff", fontSize: 46, textShadow: OMBRE_TEXTE }}>
          <span style={{ fontWeight: 600, opacity: 0.68 }}>Following</span>
          <span style={{ fontWeight: 800, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            For You<span style={{ width: 70, height: 7, borderRadius: 4, background: "#fff" }} />
          </span>
        </div>
        <Loupe taille={58} style={{ position: "absolute", right: 56, top: 4, filter: "drop-shadow(0 2px 4px rgba(0,0,0,.4))" }} />
      </Calque>
      {/* la colonne de droite */}
      <Calque x={918} y={1160} z={44} kz={kz} w={140}>
        <div style={{ position: "relative", width: 132, height: 132, borderRadius: "50%", border: "4px solid #fff", boxShadow: "0 6px 16px rgba(0,0,0,.4)" }}>
          <Img src={staticFile("tiktok/avatar.jpg")} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          <div style={{ position: "absolute", left: 40, bottom: -24, width: 48, height: 48, borderRadius: "50%", background: C.rougeTiktok, display: "grid", placeItems: "center" }}>
            <Plus taille={30} />
          </div>
        </div>
      </Calque>
      <Calque x={909} y={1360} z={54} kz={kz}><Action icone={<Coeur taille={98} />} texte="25.3K" /></Calque>
      <Calque x={909} y={1540} z={50} kz={kz}><Action icone={<Bulle taille={92} />} texte="201" /></Calque>
      <Calque x={909} y={1715} z={46} kz={kz}><Action icone={<Signet taille={86} />} texte="6,802" /></Calque>
      <Calque x={909} y={1890} z={42} kz={kz}><Action icone={<Partage taille={90} />} texte="2,384" /></Calque>
      <Calque x={930} y={2068} z={38} kz={kz}>
        <div style={{ width: 108, height: 108, borderRadius: "50%", background: "radial-gradient(#3a3a40 0 30%, #1b1b20 31% 100%)", display: "grid", placeItems: "center", transform: `rotate(${disque}deg)`, boxShadow: "0 6px 14px rgba(0,0,0,.5)" }}>
          <Img src={staticFile("tiktok/avatar.jpg")} style={{ width: 58, height: 58, borderRadius: "50%" }} />
        </div>
      </Calque>
      {/* en bas à gauche : le compte (appuyé à 3 s), la légende, le son */}
      <Calque x={44} y={1846} z={36} kz={kz} w={840}>
        <div style={{ color: "#fff", textShadow: OMBRE_TEXTE }}>
          <div style={{ fontSize: 48, fontWeight: 800, display: "inline-block", borderRadius: 12, padding: "2px 8px", margin: "-2px -8px",
            background: appuiNom ? "rgba(255,255,255,.22)" : "transparent", opacity: appuiNom ? 0.75 : 1 }}>
            Random Japan Place <span style={{ fontWeight: 500, opacity: 0.7 }}>· 06-27</span>
          </div>
          <div style={{ fontSize: 43, fontWeight: 500, marginTop: 14 }}>Aogashima | Tokyo 📍 <span style={{ opacity: 0.7 }}>...more</span></div>
          <div style={{ fontSize: 40, fontWeight: 600, marginTop: 20, display: "flex", gap: 14, alignItems: "center" }}>
            <Note taille={38} /> original sound - Random Japan Place
          </div>
        </div>
      </Calque>
      {/* la barre de lecture et la barre du bas */}
      <div style={{ position: "absolute", left: 0, top: 2192, width: LARGEUR, height: 6, background: "rgba(255,255,255,.25)" }}>
        <div style={{ width: `${avance * 100}%`, height: "100%", background: "rgba(255,255,255,.9)" }} />
      </div>
      <Calque x={0} y={2198} z={12} kz={kz} w={LARGEUR} h={142}>
        <div style={{ height: 142, borderRadius: "0 0 74px 74px", background: "#000", display: "flex", justifyContent: "space-around", alignItems: "center", color: "#fff", fontSize: 28, fontWeight: 600, padding: "0 10px 10px" }}>
          {[[<Maison key="m" taille={58} />, "Home", 1], [<Amis key="a" taille={58} />, "Friends", 0.75]].map(([i, t, o]) => (
            <span key={t as string} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: o as number }}>{i}{t as string}</span>
          ))}
          <span style={{ width: 118, height: 76, borderRadius: 18, background: "#fff", boxShadow: `-7px 0 0 ${C.cyanTiktok}, 7px 0 0 ${C.rougeTiktok}`, display: "grid", placeItems: "center" }}><Plus taille={44} couleur="#000" /></span>
          {[[<Messages key="i" taille={58} />, "Inbox"], [<Personne key="p" taille={58} />, "Profile"]].map(([i, t]) => (
            <span key={t as string} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: 0.75 }}>{i}{t as string}</span>
          ))}
        </div>
      </Calque>
    </div>
  );
};

// la grille du profil : les vignettes de la capture, avec leurs « Pinned » et leurs vues (trois colonnes, la troisième
// rangée coupée par le bas)
const COL = [0, 361, 722], LARGE = 358, RANGS: [number, number][] = [[1134, 477], [1614, 477], [2094, 246]];

/** Le profil vu par un visiteur. lien : 0 → 1, le lien de la bio s'allume ; plonge : 0 → 1, le plongeon (le lien
 *  devient un écran blanc). */
export const PageProfil: React.FC<{ kz: number; lien: number; appuye: boolean; plonge: number }> = ({ kz, lien, appuye, plonge }) => {
  const a = (n: number) => T.profil + Math.round(n * 3.3); // l'arrivée du n-ième élément (55 ms d'écart)
  // le lien grossit, lisible, jusqu'aux trois quarts du plongeon (×5 environ), puis s'efface dans le blanc de sa pastille
  const texteLien = 1 - Math.min(1, Math.max(0, (plonge - 0.74) / 0.12));
  const blanc = Math.min(1, Math.max(0, (plonge - 0.66) / 0.24));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: LARGEUR, height: HAUTEUR, transformStyle: "preserve-3d", fontFamily: POLICE_TIKTOK, color: C.noir }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 74, background: "#fff", boxShadow: "0 80px 180px rgba(0,0,0,.55)" }} />
      <Calque x={0} y={0} z={10} kz={kz} w={LARGEUR}><Etat couleur={C.noir} /></Calque>
      <Calque x={44} y={150} z={16} kz={kz} arrivee={a(0)}><Retour taille={72} /></Calque>
      <Calque x={850} y={152} z={16} kz={kz} arrivee={a(0.5)}><Cloche taille={68} /></Calque>
      <Calque x={958} y={152} z={16} kz={kz} arrivee={a(0.8)}><PartageContour taille={70} /></Calque>
      <Calque x={735} y={258} z={70} kz={kz} arrivee={a(0)}>
        <div style={{ width: 340, height: 340, borderRadius: "50%", border: `9px solid ${C.cyanTiktok}`, padding: 9, boxShadow: "0 18px 40px rgba(0,0,0,.18)", background: "#fff" }}>
          <Img src={staticFile("tiktok/avatar.jpg")} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
        </div>
      </Calque>
      <Calque x={44} y={292} z={40} kz={kz} arrivee={a(1)} w={680}>
        <div style={{ fontSize: 62, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: -0.5 }}>Random Japan Place</div>
        <div style={{ fontSize: 40, color: C.gris, fontWeight: 600, marginTop: 6 }}>@random_japan_place</div>
      </Calque>
      <Calque x={44} y={470} z={30} kz={kz} arrivee={a(2)} w={660}>
        <div style={{ display: "flex", gap: 66 }}>
          {[["5", "Following"], ["4,556", "Followers"], ["131K", "Likes"]].map(([n, t]) => (
            <div key={t}><div style={{ fontSize: 48, fontWeight: 800 }}>{n}</div><div style={{ fontSize: 38, color: C.gris, marginTop: 2 }}>{t}</div></div>
          ))}
        </div>
      </Calque>
      <Calque x={36} y={618} z={50} kz={kz} arrivee={a(3)} w={1008} h={118}>
        <div style={{ display: "flex", gap: 22, height: 118 }}>
          <div style={{ flex: 1.36, borderRadius: 18, background: C.rougeTiktok, color: "#fff", fontSize: 46, fontWeight: 700, display: "grid", placeItems: "center", boxShadow: "0 10px 24px rgba(254,44,85,.35)" }}>Follow</div>
          <div style={{ flex: 1, borderRadius: 18, background: C.grisClair, fontSize: 46, fontWeight: 700, display: "grid", placeItems: "center" }}>Message</div>
          <div style={{ width: 118, borderRadius: "50%", background: C.grisClair, display: "grid", placeItems: "center" }}><AjoutAmi taille={58} /></div>
        </div>
      </Calque>
      <Calque x={44} y={768} z={24} kz={kz} arrivee={a(4)} w={1000}>
        <div style={{ fontSize: 41, lineHeight: "58px" }}>
          <div>Everyday a new place from Japan to explore ✨⛩️</div>
          <div>Follow for more content ✅</div>
          <div>My interactive map with all of the places ⬇️</div>
        </div>
      </Calque>
      {/* le lien de la bio : il s'allume (une pastille cyan), puis, au plongeon, la pastille blanchit et devient l'écran */}
      <Calque x={30} y={934} z={60} kz={kz} arrivee={a(5)} w={760} h={80}>
        <div style={{
          position: "absolute", left: 0, top: 0, width: 760, height: 80, borderRadius: 18, transformOrigin: "0 50%",
          transform: `scaleX(${expoSortie(lien).toFixed(4)}) scale(${appuye ? 0.965 : 1})`,
          background: `rgba(${Math.round(210 + 45 * blanc)}, ${Math.round(246 + 9 * blanc)}, ${Math.round(250 + 5 * blanc)}, 1)`,
          boxShadow: lien > 0 ? `0 0 0 ${3 * (1 - blanc)}px rgba(32,213,236,${0.9 * lien}), 0 10px 30px rgba(32,213,236,${0.35 * lien * (1 - blanc)})` : "none",
        }} />
        <div style={{ position: "absolute", left: 14, top: 10, fontSize: 43, fontWeight: 800, whiteSpace: "nowrap", opacity: texteLien,
          color: lien > 0.5 ? "#0b5d69" : C.noir }}>https://map.randomjapanplace.com/</div>
      </Calque>
      <Calque x={0} y={1030} z={14} kz={kz} arrivee={a(6)} w={LARGEUR} h={104}>
        <div style={{ position: "relative", height: 104, borderBottom: "1px solid #e3e3e4" }}>
          <Grille taille={62} style={{ position: "absolute", left: 239, top: 18 }} />
          <div style={{ position: "absolute", left: 210, bottom: -2, width: 120, height: 6, borderRadius: 3, background: C.noir }} />
          <Reposte taille={60} style={{ position: "absolute", left: 760, top: 20 }} />
        </div>
      </Calque>
      {RANGS.map(([y, h], r) => COL.map((x, c) => (
        <Calque key={`${r}-${c}`} x={x} y={y} z={12 + ((r * 3 + c) % 3) * 8} kz={kz} arrivee={a(7 + (r * 3 + c) * 0.6)} w={LARGE} h={h}>
          <Img src={staticFile(`tiktok/grille-${r}-${c}.jpg`)} style={{ width: LARGE, height: h, objectFit: "cover", objectPosition: "top",
            borderRadius: r === 2 ? (c === 0 ? "0 0 0 74px" : c === 2 ? "0 0 74px 0" : 0) : 0 }} />
        </Calque>
      )))}
    </div>
  );
};
