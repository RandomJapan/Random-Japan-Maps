"""Outils communs des contrôles de la balade (outils/balade/ ; nés le 2026-10-29 avec les Trente Bouddhas, rangés dans le dépôt le 2026-11-25) :
ouvrir un lieu dans Edge sans fenêtre (avec la vraie carte graphique), finir les dialogues, placer le joueur, prendre des photos.
Le site doit être servi sur le port 8123 (le serveur « carte-japon »). Options communes : --port, --tel (un téléphone), --visiteur (sans le
mode développeur), --fermee (Yakushima pas encore ouverte), --ancien fichier.js (le fichier du lieu remplacé par celui-là, pour comparer),
--ancien-moteur fichier.js (balade.js), --ancien-monde fichier.js (monde.js)."""
import sys, io
from pathlib import Path
from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
ARGS = sys.argv[1:]
opt = lambda n, d=None: ARGS[ARGS.index(n) + 1] if n in ARGS else d
PORT = opt('--port', '8123')
TEL = '--tel' in ARGS


class Balade:
    def __init__(self, pw, perso='fille', compagnon='kon', tel=TEL, port=PORT, taille=(1280, 720), stockage=None, lieu='itsukushima'):
        self.nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
        ctx = self.nav.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True) if tel else self.nav.new_context(viewport={'width': taille[0], 'height': taille[1]})
        self.p = p = ctx.new_page()
        # (--ancien fichier.js : la balade avec cette version-là du fichier du lieu, pour comparer)
        if opt('--ancien'): ctx.route(f'**/balade/{lieu}.js*', lambda r: r.fulfill(path=opt('--ancien'), content_type='application/javascript'))
        if opt('--ancien-moteur'): ctx.route('**/balade/balade.js*', lambda r: r.fulfill(path=opt('--ancien-moteur'), content_type='application/javascript'))
        if opt('--ancien-monde'): ctx.route('**/balade/monde.js*', lambda r: r.fulfill(path=opt('--ancien-monde'), content_type='application/javascript'))
        self.tel = tel
        self.erreurs = []
        p.on('pageerror', lambda e: (self.erreurs.append(str(e)), print('erreur page :', e)))
        p.on('console', lambda m: m.type == 'error' and 'supported source' not in m.text and print('console :', m.text))
        url = f'http://localhost:{port}/balade/?lieu={lieu}&perso={perso}&langue=fr&compagnon={compagnon}'
        p.goto(url)
        p.evaluate("localStorage.clear()")
        if '--visiteur' not in ARGS: p.evaluate("localStorage.setItem('modeDev', 'oui')")  # (--visiteur : sans le mode développeur)
        if '--fermee' not in ARGS: p.evaluate("localStorage.setItem('baladeYakushima', 'oui')")  # (--fermee : l'île pas encore ouverte)
        if stockage:
            for k, v in stockage.items(): p.evaluate(f"localStorage.setItem({k!r}, {v!r})")
        p.goto(url)
        p.wait_for_function('window.__pret === true', timeout=90000)
        self.finir()
        p.evaluate("document.querySelector('.aide')?.classList.add('vue')")

    def a(self):
        if self.tel: self.p.locator('.bouton-a').dispatch_event('pointerdown')
        else: self.p.keyboard.press('KeyE')

    def texte(self):
        return self.p.evaluate("document.querySelector('.dialogue').hidden ? '' : document.querySelector('.dialogue-texte').textContent")

    def finir(self, choix=None, max_tours=400, attente=200, quiet=False):
        p, vus = self.p, []
        for _ in range(max_tours):
            p.wait_for_timeout(attente)
            if p.evaluate("balade.etat.mode !== 'dialogue' && document.querySelector('.dialogue').hidden && document.querySelector('.tampon-obtenu').hidden"): break
            t = self.texte()
            if t and (not vus or vus[-1] != t):
                vus.append(t)
                if not quiet: print('   «', t[:140], '»')
            if p.evaluate("!document.querySelector('.dialogue-choix').hidden"):
                if choix is None: break
                if self.tel: p.locator('.dialogue-choix button').nth(choix).dispatch_event('pointerdown')
                else:
                    for _ in range(choix): p.keyboard.press('ArrowDown')
                    p.keyboard.press('Enter')
                choix = None
                continue
            if not p.evaluate("document.querySelector('.dialogue').hidden"): self.a()
        return vus

    def aller(self, x, z, vers=None, h='Infinity', cap=None):
        capjs = f'e.cap = {cap};' if cap is not None else ('' if vers is None else f'e.cap = Math.atan2({vers[0]} - e.x, {vers[1]} - e.z);')
        self.p.evaluate(f"""(() => {{ const M = balade.monde(), e = balade.etat; e.x = {x}; e.z = {z}; e.y = M.lieu.monde.hauteur(e.x, e.z, {h}); e.vx = e.vz = 0;
          {capjs} balade.cam.lacet = e.cap + Math.PI; balade.camera.userData.place = false;
          const r = balade.renard; r.x = e.x - Math.sin(e.cap) * 1.2; r.z = e.z - Math.cos(e.cap) * 1.2; r.y = M.lieu.monde.hauteur(r.x, r.z, e.y + 0.6); }})()""")
        self.p.wait_for_timeout(700)

    def pos(self):
        return self.p.evaluate("(() => { const e = balade.etat; return [+e.x.toFixed(2), +e.z.toFixed(2), +e.y.toFixed(2)]; })()")

    def bulle(self):
        return self.p.evaluate("document.querySelector('.bulle-action').hidden ? '' : document.querySelector('.bulle-action span').textContent")

    def approcher(self, id, d=0.9):
        q = self.p.evaluate(f"""(() => {{ const M = balade.monde(), L = M.lieu, i = L.interactions.find((q) => q.id === '{id}');
          let cx = i.x, cz = i.z, cy = i.y;
          if (i.passant) {{ const pp = M.passants.find((q) => q.id === i.passant); cx = pp.etat.x; cz = pp.etat.z; cy = pp.etat.y; }}
          for (const dd of [{d}, {d} + 0.4, {d} - 0.3, {d} + 0.8, {d} + 1.3]) for (let k = 0; k < 16; k++) {{
            const t = k * Math.PI / 8, x = cx + Math.sin(t) * dd, z = cz + Math.cos(t) * dd, y = L.monde.hauteur(x, z, (cy ?? 0) + 0.7);
            if (L.monde.libre(x, z, y) && Math.abs(y - (cy ?? y)) < 0.8) return {{ x, z, ix: cx, iz: cz, y }};
          }} return {{ x: cx + {d}, z: cz, ix: cx, iz: cz, y: cy ?? null }}; }})()""")
        self.aller(q['x'], q['z'], (q['ix'], q['iz']), h='Infinity' if q.get('y') is None else str(q['y'] + 0.3))
        return self.bulle()

    def photo(self, chemin, attente=400):
        self.p.wait_for_timeout(attente)
        self.p.screenshot(path=str(chemin))

    def cadrer(self, de, vers, champ=55):
        self.p.evaluate(f"balade.jeu.cadrer({{ de: {list(de)}, vers: {list(vers)}, champ: {champ} }})")

    def fermer(self):
        self.nav.close()
