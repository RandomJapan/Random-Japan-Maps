"""Les personnages de la balade 3D détourés (fond transparent), pour les carrousels TikTok (2026-11-24).

    python outils/video/carrousels/detourer.py            # toutes les poses
    python outils/video/carrousels/detourer.py fille kon  # seulement celles-là

Il faut le site en local (python -m http.server 8123 --directory site), Microsoft Edge et Playwright.
La vraie balade (site/balade/), en mode photo (?photo=perso : rien ne bouge), dans Edge sans fenêtre avec la vraie carte
graphique. Pour chaque pose, on ne garde que les personnages voulus (tout le reste du lieu est caché), on pose la caméra, et
on dessine la scène deux fois de suite, directement dans la toile (sans la passe finale du jeu : son halo et sa vignette
salissaient le fond) : une fois sur un fond noir, une fois sur un fond blanc. La différence des deux donne la transparence
de chaque pixel (un pixel du personnage est le même sur les deux fonds ; un pixel du fond passe du noir au blanc).
Sortie : videos/carte/carrousels/images/detoures/<pose>.png (rogné au personnage, une marge autour).
"""
import base64
import io
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

RACINE = Path(__file__).resolve().parents[3]
SORTIE = RACINE / 'videos' / 'carte' / 'carrousels' / 'images' / 'detoures'
PORT = '8123'

# ce que la balade a déjà en mémoire : la voyageuse, Kon, tous les achats (pour pouvoir tout lui faire porter)
STOCKAGE = {
    'baladePerso': 'fille', 'baladeCompagnon': 'kon', 'baladeMarchandVu': 'oui',
    'baladeAchats': json.dumps(['danse', 'traces', 'accessoires', 'feux', 'masque', 'happi', 'yukata', 'photo', 'gao', 'fuwa', 'saya',
                                'calendrier', 'kimonoOr', 'armure']),
}

# Les poses. qui : 'duo' (les deux voyageurs et Kon, cadrés par le jeu lui-même), 'fille', 'garcon', un compagnon, 'bunbuku'.
# tenue : {place: id} portée par la voyageuse pour cette pose (remise par défaut après). vue : la caméra autour du personnage,
# [angle en degrés (0 : de face, 180 : de dos), distance, hauteur de l'œil, hauteur visée, champ en degrés].
POSES = {
    'duo': {'qui': 'duo'},
    'fille': {'qui': 'fille', 'vue': [20, 3.2, 0.95, 0.62, 30]},
    'garcon': {'qui': 'garcon', 'vue': [-20, 3.2, 0.95, 0.62, 30]},
    'kon': {'qui': 'kon', 'vue': [30, 2.6, 0.7, 0.32, 26]},
    'pon': {'qui': 'pon', 'vue': [30, 2.6, 0.7, 0.32, 26]},
    'chapu': {'qui': 'chapu', 'vue': [30, 2.6, 0.7, 0.32, 26]},
    'gao': {'qui': 'gao', 'vue': [30, 2.6, 0.7, 0.32, 26]},
    'fuwa': {'qui': 'fuwa', 'vue': [30, 2.8, 0.8, 0.4, 26]},
    'saya': {'qui': 'saya', 'vue': [30, 2.6, 0.7, 0.32, 26]},
    'bunbuku': {'qui': 'bunbuku', 'vue': [15, 4.0, 1.2, 0.75, 30]},
    'samourai': {'qui': 'fille', 'tenue': {'habit': 'armure', 'tete': 'kabuto'}, 'vue': [20, 3.3, 0.95, 0.66, 30]},
    'ailes': {'qui': 'fille', 'tenue': {'dos': 'ailes'}, 'vue': [168, 3.8, 1.5, 0.75, 32]},
    'tengu': {'qui': 'fille', 'tenue': {'yeux': 'tengu'}, 'vue': [20, 3.2, 0.95, 0.62, 30]},
    'renarde': {'qui': 'fille', 'tenue': {'tete': 'renard'}, 'vue': [35, 3.2, 0.95, 0.62, 30]},
    'oni': {'qui': 'fille', 'tenue': {'tete': 'cornes'}, 'vue': [20, 3.2, 0.95, 0.62, 30]},
    'kimono': {'qui': 'fille', 'tenue': {'habit': 'kimonoOr'}, 'vue': [20, 3.2, 0.95, 0.62, 30]},
    'loup': {'qui': 'fille', 'tenue': {'dos': 'loup', 'tete': 'nue'}, 'vue': [140, 3.4, 1.0, 0.66, 30]},
}

DETOURER = """async ({ qui, tenue, vue }) => {
  const B = window.balade, M = B.monde(), V = B.camera.position.constructor, C = B.scene.fog.color.constructor;
  const attendre = () => new Promise((r) => requestAnimationFrame(() => r()));
  // le personnage (son objet) et l'endroit où on le pose : là où le jeu a mis la voyageuse
  const base = M.voyageurs.fille.objet.position.clone();
  let objets, cible, cap = 0;
  if (qui === 'duo') objets = [M.voyageurs.garcon.objet, M.voyageurs.fille.objet, M.kon.objet];
  else if (qui === 'fille' || qui === 'garcon') { cible = M.voyageurs[qui].objet; objets = [cible]; }
  else if (qui === 'bunbuku') {
    const q = M.lieu.marchand;
    cible = M.groupe.children.find((o) => Math.hypot(o.position.x - q.x, o.position.z - q.z) < 0.01);
    objets = [cible];
  } else { cible = M.compagnons[qui].objet; objets = [cible]; }
  if (tenue) for (const [place, id] of Object.entries(tenue)) M.voyageurs.fille.porter(place, id);
  await attendre(); await attendre();
  // la caméra
  let de, vers, champ;
  if (vue) {
    const [angle, dist, oeil, vise, f] = vue;
    cap = cible.rotation.y;
    const a = cap + angle * Math.PI / 180, p = cible.position;
    de = new V(p.x + Math.sin(a) * dist, p.y + oeil, p.z + Math.cos(a) * dist);
    vers = new V(p.x, p.y + vise, p.z);
    champ = f;
  }
  // tout le reste caché (les lumières restent)
  const garder = new Set(objets), remis = [];
  const visibles = [];
  for (const o of [...B.scene.children, ...M.groupe.children]) {
    if (o === M.groupe || o.isLight) continue;
    const g = garder.has(o);
    visibles.push([o, o.visible]);
    o.visible = g;
  }
  for (const o of objets) o.visible = true;
  if (de) { B.camera.position.copy(de); B.camera.lookAt(vers); B.camera.fov = champ; }
  B.camera.updateProjectionMatrix();
  const fond = B.scene.background;
  const rendre = (c) => {
    B.scene.background = new C(c);
    B.rendu.setRenderTarget(null);
    B.rendu.render(B.scene, B.camera);
    return B.rendu.domElement.toDataURL('image/png');
  };
  const noir = rendre(0x000000), blanc = rendre(0xffffff);
  B.scene.background = fond;
  for (const [o, v] of visibles) o.visible = v;
  if (tenue) M.voyageurs.fille.porter && Object.keys(tenue).forEach((place) => {
    const defaut = { tete: 'defaut', yeux: 'aucune', habit: 'habit-defaut', dos: 'sac', main: 'main-rien', cou: 'cou-rien' }[place];
    M.voyageurs.fille.porter(place, defaut);
  });
  return [noir, blanc];
}"""


def image(data_url):
    return np.asarray(Image.open(io.BytesIO(base64.b64decode(data_url.split(',', 1)[1]))).convert('RGB')).astype(np.float32)


def matter(noir, blanc):
    """La transparence par différence : alpha = 1 − (blanc − noir) ; la couleur = noir / alpha."""
    a = 1 - (blanc - noir).mean(axis=2) / 255
    a = np.clip(a, 0, 1)
    a[a < 0.02] = 0
    c = np.where(a[..., None] > 0.004, noir / np.maximum(a[..., None], 1e-3), 0)
    rgba = np.dstack([np.clip(c, 0, 255), a * 255]).astype(np.uint8)
    ys, xs = np.nonzero(a > 0.02)
    m = 24
    y0, y1, x0, x1 = max(0, ys.min() - m), min(a.shape[0], ys.max() + m), max(0, xs.min() - m), min(a.shape[1], xs.max() + m)
    return Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA')


def main():
    voulues = [a for a in sys.argv[1:] if not a.startswith('-')] or list(POSES)
    SORTIE.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
        ctx = nav.new_context(viewport={'width': 900, 'height': 1200}, device_scale_factor=2)
        ctx.add_init_script('try { localStorage.clear(); ' + ''.join(
            f'localStorage.setItem({json.dumps(k)}, {json.dumps(v)}); ' for k, v in STOCKAGE.items()) + '} catch {}')
        p = ctx.new_page()
        p.on('pageerror', lambda e: print('erreur de la page :', e))
        p.goto(f'http://localhost:{PORT}/balade/?lieu=itsukushima&photo=perso&langue=en&flou=0')
        p.wait_for_function('window.__pret === true && window.balade', timeout=120000)
        p.wait_for_timeout(1500)
        for nom in voulues:
            noir, blanc = p.evaluate(DETOURER, {'qui': POSES[nom]['qui'], 'tenue': POSES[nom].get('tenue'), 'vue': POSES[nom].get('vue')})
            im = matter(image(noir), image(blanc))
            im.save(SORTIE / f'{nom}.png')
            print(nom, im.size)
        nav.close()


main()
