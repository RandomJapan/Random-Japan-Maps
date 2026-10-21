"""Les captures de l'interface pour la vidéo promo de 30 s : la vraie carte (de jour, sans Halloween, en anglais),
sur une page 1280 × 720 à ×3 (des images 3840 × 2160 : deux fois la taille de la vidéo, nettes quand la caméra
avance). Pour chaque scène : l'image entière, la même sans l'élément qui va être animé (le « fond »), l'élément seul
(découpé) et ses coordonnées (layout.json, en px de la page 1280 × 720).
    python outils/video/promo30/captures.py              # toutes les scènes
    python outils/video/promo30/captures.py route        # une seule
    python outils/video/promo30/captures.py --vertical   # pour la version 9:16 : le site de téléphone, sur une page
                                                         # 540 × 960 à ×4 (2160 × 3840), dans ui-v/
Il faut le site en local (python -m http.server 8123 --directory site) ; le tracé de la route demande une fois le
serveur d'itinéraires gratuit d'OpenStreetMap (une seule requête, comme sur le site).
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
VERTICAL = '--vertical' in sys.argv
SORTIE = ICI.parents[2] / 'videos' / 'promo30' / 'public' / ('ui-v' if VERTICAL else 'ui')
L, H, K = (540, 960, 4) if VERTICAL else (1280, 720, 3)
ATTENDRE = "window.carte && document.getElementById('chargement').classList.contains('fini')"
CSS = """.aide, .visites, #btn-dev, .btn-qualite, .toast { display: none !important; }
  .saison { display: none !important; }"""
FAVORIS = ['himeji-castle', 'kinkaku-ji', 'shirahige-shrine', 'fujisan-hongu-sengen-taisha']
POSE = "async (c) => { const m = window.carte; m.jumpTo(c); await new Promise((ok) => { const v = () => (m.areTilesLoaded() ? setTimeout(ok, 900) : setTimeout(v, 120)); v(); }); }"


def boite(p, selecteur):
    return p.evaluate(f"""(() => {{ const e = document.querySelector({selecteur!r}); if (!e) return null;
        const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 10) / 10); }})()""")


def epingle(p, lng, lat):
    """La tête de l'épingle d'un lieu : celle la plus proche de son point projeté (elle flotte au-dessus)."""
    return p.evaluate(f"""(() => {{ const q = window.carte.project([{lng}, {lat}]); let mieux = null, d0 = 1e9;
        for (const e of document.querySelectorAll('.repere-tete')) {{ const r = e.getBoundingClientRect(); if (!r.width) continue;
          const d = Math.hypot(r.x + r.width / 2 - q.x, (r.y + r.height) - q.y + (q.y > r.y ? 0 : 1e4) * 0);
          if (d < d0 && r.y < q.y + 4) {{ d0 = d; mieux = [r.x, r.y, r.width, r.height]; }} }}
        return mieux; }})()""")


def repos(p, ms=1200):
    p.evaluate("""() => new Promise((ok) => { const m = window.carte; const v = () => (!m.isMoving() && m.areTilesLoaded() ? ok() : setTimeout(v, 120)); v(); })""")
    p.wait_for_timeout(ms)


def photo(p, nom):
    p.screenshot(path=str(SORTIE / f'{nom}.png'))


def contexte(nav, favoris=None):
    ctx = nav.new_context(viewport={'width': L, 'height': H}, device_scale_factor=K)
    ctx.add_init_script(f"""try {{ localStorage.clear(); localStorage.setItem('aideVue', '1'); localStorage.setItem('langue', 'en');
        localStorage.setItem('modeDev', 'non'); localStorage.setItem('qualite', JSON.stringify({{ niveau: 'fine', impose: 'fine' }}));
        {f"localStorage.setItem('favoris', {json.dumps(json.dumps(favoris))});" if favoris else ''} }} catch {{}}""")

    def config(route):
        r = route.fetch()
        route.fulfill(response=r, body=r.text().replace('public: true', 'public: false'))
    ctx.route('**/config.js', config)
    p = ctx.new_page()
    p.goto('http://localhost:8123/?heure=10:30&date=2026-10-21')
    p.wait_for_function(ATTENDRE, timeout=120000)
    p.add_style_tag(content=CSS)
    p.mouse.move(640, 400)
    p.mouse.wheel(0, -1)  # une entrée : la rotation de départ s'arrête
    p.wait_for_timeout(1500)
    return ctx, p


def carte(nav, plan):
    """La fiche du château de Himeji (et la page sans elle), plus la fiche de Kinkaku-ji pour le dé."""
    ctx, p = contexte(nav)
    p.evaluate(POSE, {'center': [134.6939, 34.8394], 'zoom': 12.6, 'pitch': 58, 'bearing': 24})
    repos(p)
    plan['pin-himeji'] = epingle(p, 134.693905, 34.839449)
    photo(p, 'himeji-sans-fiche')
    p.evaluate("location.hash = '#himeji-castle'")
    p.wait_for_selector('#fiche[aria-hidden="false"]', timeout=20000)
    repos(p, 1800)
    photo(p, 'himeji-fiche')
    plan['fiche'] = boite(p, '#fiche')
    plan['fiche-media'] = boite(p, '#fiche-media')
    plan['pin-himeji-fiche'] = epingle(p, 134.693905, 34.839449)
    p.locator('#fiche').screenshot(path=str(SORTIE / 'fiche-himeji.png'))
    p.add_style_tag(content='#fiche { visibility: hidden !important; }')
    p.wait_for_timeout(300)
    photo(p, 'himeji-fond')
    # Kinkaku-ji : la fiche seule
    p.add_style_tag(content='#fiche { visibility: visible !important; }')
    p.evaluate("location.hash = '#kinkaku-ji'")
    p.wait_for_function("document.getElementById('fiche-nom')?.textContent.includes('Kinkaku')", timeout=20000)
    repos(p, 1800)
    p.locator('#fiche').screenshot(path=str(SORTIE / 'fiche-kinkaku.png'))
    plan['fiche-kinkaku'] = boite(p, '#fiche')
    photo(p, 'kinkaku-fiche')
    # le dé : son panneau ouvert sur la vue de Kyoto
    p.keyboard.press('Escape')
    p.wait_for_timeout(600)
    p.click('#btn-hasard')
    p.wait_for_timeout(700)
    plan['panneau-hasard'] = boite(p, '#panneau-hasard')
    plan['btn-lancer'] = boite(p, '#btn-lancer')
    plan['btn-hasard'] = boite(p, '#btn-hasard')
    photo(p, 'hasard')
    p.locator('#panneau-hasard').screenshot(path=str(SORTIE / 'panneau-hasard.png'))
    ctx.close()


def route(nav, plan):
    """Les favoris et leur itinéraire : la page avec la route, la même sans (fond), le tracé en px de la page."""
    ctx, p = contexte(nav, FAVORIS)
    p.click('#btn-favoris')
    p.wait_for_timeout(800)
    if VERTICAL:
        plan['panneau-favoris'] = boite(p, '#panneau-favoris')
        p.locator('#panneau-favoris').screenshot(path=str(SORTIE / 'panneau-favoris.png'))
    p.click('[data-tracer]')
    p.wait_for_function("window.carte.getSource('itineraire') && document.querySelectorAll('.temps-trajet').length > 0", timeout=60000)
    repos(p, 2500)
    photo(p, 'route')
    if not VERTICAL:
        plan['panneau-favoris'] = boite(p, '#panneau-favoris')
        p.locator('#panneau-favoris').screenshot(path=str(SORTIE / 'panneau-favoris.png'))
    plan['resume-itineraire'] = boite(p, '#resume-itineraire')
    if plan['resume-itineraire'] and plan['resume-itineraire'][2] > 0:
        p.locator('#resume-itineraire').screenshot(path=str(SORTIE / 'resume-itineraire.png'))
    # le tracé : chaque ligne de la source, projetée en px de la page
    plan['route'] = p.evaluate("""() => {
        const m = window.carte, s = m.getSource('itineraire');
        const d = s.serialize().data;
        const lignes = [];
        for (const f of d.features || []) {
          const g = f.geometry; if (!g) continue;
          const parts = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
          for (const c of parts) lignes.push({ pointilles: !!(f.properties && (f.properties.pointilles || f.properties.bateau || f.properties.ferry)),
            points: c.map((ll) => { const q = m.project(ll); return [Math.round(q.x * 10) / 10, Math.round(q.y * 10) / 10]; }) });
        }
        return lignes;
      }""")
    plan['etapes'] = p.evaluate("""() => [...document.querySelectorAll('.repere.etape .repere-tete')].map((e) => {
        const r = e.getBoundingClientRect(); return { texte: e.textContent.trim(), boite: [r.x, r.y, r.width, r.height] }; })""")
    plan['temps'] = []
    for i, el in enumerate(p.query_selector_all('.temps-trajet')):
        r = el.bounding_box()
        if r and r['width'] > 0 and el.is_visible():
            el.screenshot(path=str(SORTIE / f'temps-{i}.png'))
            plan['temps'].append({'fichier': f'temps-{i}.png', 'boite': [r['x'], r['y'], r['width'], r['height']]})
    # le fond : la même vue sans la route, ses temps ni le panneau (les épingles restent)
    p.evaluate("""() => { const m = window.carte; for (const id of ['itineraire-fond', 'itineraire', 'itineraire-pointilles']) if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', 'none'); }""")
    p.add_style_tag(content='.temps-trajet, #panneau-favoris, .resume-itineraire, .maplibregl-ctrl-attrib { visibility: hidden !important; }')
    repos(p, 1500)
    photo(p, 'route-fond')
    ctx.close()


def legende(nav, plan):
    """La légende d'Orochi (le serpent à huit têtes) et sa bulle ouverte."""
    ctx, p = contexte(nav)
    p.evaluate(POSE, {'center': [133.0, 35.26], 'zoom': 9.4, 'pitch': 50, 'bearing': 0})
    repos(p)
    plan['legende-orochi'] = boite(p, '[data-legende="orochi"]')
    photo(p, 'orochi-fond')
    p.evaluate("(async () => { (await import('/legendes.js')).ouvrirLegende('orochi'); })()")
    p.wait_for_selector('.bulle-legende', timeout=10000)
    repos(p, 1500)
    plan['legende-orochi-bulle'] = boite(p, '[data-legende="orochi"]')
    plan['bulle-orochi'] = boite(p, '.bulle-legende')
    p.locator('.bulle-legende').screenshot(path=str(SORTIE / 'bulle-orochi.png'))
    photo(p, 'orochi-bulle')
    ctx.close()


SCENES = {'carte': carte, 'route': route, 'legende': legende}


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    f = SORTIE / 'layout.json'
    plan = json.loads(f.read_text(encoding='utf-8')) if f.exists() else {}
    plan['page'] = [L, H, K]
    noms = [a for a in sys.argv[1:] if not a.startswith('--')] or list(SCENES)
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
        for nom in noms:
            SCENES[nom](nav, plan)
            f.write_text(json.dumps(plan, ensure_ascii=False, indent=1), encoding='utf-8')
            print('capturé :', nom, flush=True)
        nav.close()


if __name__ == '__main__':
    main()
