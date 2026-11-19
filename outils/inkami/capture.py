# -*- coding: utf-8 -*-
"""Les modèles des tableaux d'Inkami de la balade (2026-11-19 ; voir instructions/balade.md, « Sumi ») : un personnage du jeu, seul, sur fond
blanc, cadré en buste, pris dans la vraie balade (il passe sur un calque que la caméra regarde seul). Le site servi sur le port 8123.
    python outils/inkami/capture.py outils/inkami/sujets.json <dossier des images brutes> [--seul id,id] [--port 8123]
Un sujet : { id, lieu, perso?, compagnon?, objet (une expression JS qui rend l'Object3D ; M = balade.monde()), angle (radians, autour du
sujet, 0 = de face), haut (part du haut de la boîte gardée : 0.55 = la tête et les épaules), marge, nuit?, avant? (JS à lancer d'abord),
stockage? { clé: valeur }, corps? { h, l? } (cadrer le corps seul, de ses pieds à h mètres : qui tient une canne à pêche) }."""
import sys, json, io
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')
ARGS = sys.argv[1:]
opt = lambda n, d=None: ARGS[ARGS.index(n) + 1] if n in ARGS else d
PORT = opt('--port', '8123')
SUJETS = json.load(io.open(ARGS[0], encoding='utf-8'))
SORTIE = Path(ARGS[1]); SORTIE.mkdir(parents=True, exist_ok=True)
SEUL = opt('--seul')
if SEUL: SUJETS = [s for s in SUJETS if s['id'] in SEUL.split(',')]
L, H = 1200, 1500

ISOLER = """(s) => {
  const M = balade.monde(), THREE_V = balade.camera.position.constructor;
  const sujet = eval(s.objet);
  if (!sujet) return { erreur: 'sujet introuvable' };
  // le voyageur loin (les passants se tournent vers lui), puis tout caché sauf le sujet
  const garde = new Set();
  sujet.traverse((o) => garde.add(o));
  for (let p = sujet; p; p = p.parent) { garde.add(p); p.visible = true; }
  sujet.traverse((o) => { if (s.montrer !== false) o.visible = o.userData.cacheInkami ? false : o.visible; });
  // (le moteur remet le décor visible à chaque image, par morceaux : le sujet passe sur un calque à lui, que la caméra regarde seul ; les lumières aussi)
  sujet.traverse((o) => o.layers.set(5));
  balade.scene.traverse((o) => { if (o.isLight) o.layers.enable(5); });
  balade.camera.layers.set(5);
  sujet.visible = true;
  sujet.updateMatrixWorld(true);
  // la boîte du sujet (ses maillages visibles)
  const B = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, z0: 1e9, z1: -1e9 }, v = new THREE_V();
  sujet.traverse((o) => {
    if (!o.isMesh || !o.visible || !o.geometry?.attributes?.position) return;
    let vis = true; for (let p = o; p && p !== sujet.parent; p = p.parent) if (!p.visible) vis = false;
    if (!vis) return;
    const P = o.geometry.attributes.position;
    for (let i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); B.x0 = Math.min(B.x0, v.x); B.x1 = Math.max(B.x1, v.x); B.y0 = Math.min(B.y0, v.y); B.y1 = Math.max(B.y1, v.y); B.z0 = Math.min(B.z0, v.z); B.z1 = Math.max(B.z1, v.z); }
  });
  // (corps { h, l? } : la boîte n'est plus celle des maillages mais le corps seul, depuis ses pieds — pour qui tient une longue chose : la canne
  // et la ligne du pêcheur faisaient une boîte de plusieurs mètres, et lui tout petit dedans)
  if (s.corps) {
    const p = sujet.getWorldPosition(new THREE_V()), l = s.corps.l ?? 0.9;
    Object.assign(B, { x0: p.x - l / 2, x1: p.x + l / 2, z0: p.z - l / 2, z1: p.z + l / 2, y0: p.y, y1: p.y + s.corps.h });
  }
  const hTot = B.y1 - B.y0, part = s.haut ?? 0.6, h = hTot * part, cx = (B.x0 + B.x1) / 2 + (s.dx || 0), cz = (B.z0 + B.z1) / 2 + (s.dz || 0);
  const cy = B.y1 - h / 2 + (s.dy || 0) * hTot;
  // le cap du sujet (sa rotation dans le monde), la caméra devant lui, tournée de s.angle
  const q = sujet.getWorldQuaternion(new (sujet.quaternion.constructor)()), face = new THREE_V(0, 0, 1).applyQuaternion(q);
  const cap = Math.atan2(face.x, face.z) + (s.cap0 || 0) + (s.angle ?? 0.45);
  const cx2 = cx + face.x * (s.devant || 0), cz2 = cz + face.z * (s.devant || 0);
  const champ = 22, marge = s.marge ?? 1.18;
  const large = Math.max(B.x1 - B.x0, B.z1 - B.z0) * (s.kl ?? 1);
  // (le cadre de 1200 × 1500 : la hauteur h * marge, ou la largeur du sujet)
  const hVue = Math.max(h * marge, large * marge * (1500 / 1200));
  const d = (hVue / 2) / Math.tan((champ / 2) * Math.PI / 180);
  const de = [cx2 + Math.sin(cap) * d, cy + (s.plongee ?? 0.06) * d, cz2 + Math.cos(cap) * d];
  M.cadre = { de: new THREE_V(...de), vers: new THREE_V(cx2, cy, cz2), champ };
  balade.camera.userData.place = false;
  // la lumière : le soleil de trois quarts, devant le sujet, en haut à gauche de l'image
  const sol = M.soleil;
  if (sol && s.lumiere !== false) {
    const a = cap + 0.75;
    sol.position.set(cx + Math.sin(a) * 30, cy + 34, cz + Math.cos(a) * 30);
    sol.target.position.set(cx, cy, cz); sol.target.updateMatrixWorld();
    sol.color.set('#ffffff');
  }
  balade.rendu.setClearColor(0xffffff, 1);
  balade.scene.background = null;
  return { B, cap, d, de };
}"""

with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    for s in SUJETS:
        ctx = nav.new_context(viewport={'width': L, 'height': H}, device_scale_factor=1)
        p = ctx.new_page()
        p.on('pageerror', lambda e: print('erreur page :', e))
        url = f"http://localhost:{PORT}/balade/?lieu={s['lieu']}&perso={s.get('perso', 'garcon')}&langue=fr&compagnon={s.get('compagnon', 'kon')}&flou=0"
        p.goto(url)
        p.evaluate("localStorage.clear(); localStorage.setItem('modeDev', 'oui'); localStorage.setItem('baladeYakushima', 'oui')")
        for k, v in (s.get('stockage') or {}).items(): p.evaluate(f"localStorage.setItem({k!r}, {json.dumps(v) if not isinstance(v, str) else repr(v)})")
        p.goto(url)
        p.wait_for_function('window.__pret === true', timeout=120000)
        # finir les dialogues du départ
        for _ in range(60):
            p.wait_for_timeout(150)
            if p.evaluate("balade.etat.mode !== 'dialogue' && document.querySelector('.dialogue').hidden"): break
            if p.evaluate("!document.querySelector('.dialogue-choix').hidden"): p.keyboard.press('Enter')
            else: p.keyboard.press('KeyE')
        if s.get('nuit'):
            p.evaluate("balade.jeu.nuit?.(true)"); p.wait_for_timeout(2500)
        if s.get('avant'): p.evaluate(s['avant']); p.wait_for_timeout(s.get('attente', 600))
        p.add_style_tag(content='body > :not(canvas) { display: none !important; }')
        r = p.evaluate(ISOLER, s)
        if r.get('erreur'): print(s['id'], ':', r['erreur']); ctx.close(); continue
        p.wait_for_timeout(s.get('pause', 900))
        if s.get('rafale'):
            for k in range(s['rafale']):
                p.screenshot(path=str(SORTIE / f"{s['id']}_{k}.png"))
                p.wait_for_timeout(1300)
        else: p.screenshot(path=str(SORTIE / f"{s['id']}.png"))
        print(s['id'], 'boîte', {k: round(v, 2) for k, v in r['B'].items()}, 'distance', round(r['d'], 2))
        ctx.close()
    nav.close()
