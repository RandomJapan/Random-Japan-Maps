"""Filme les « rushes » des vidéos d'Halloween dans la vraie carte (plans.js), en 16:9 ou en vertical 9:16 (pour
TikTok), pour le montage (montage/, Remotion).

    python outils/video/halloween/rushes.py                 # tous les plans, en 16:9
    python outils/video/halloween/rushes.py v1-himeji v3-coin   # seulement ceux-là
    python outils/video/halloween/rushes.py --vertical      # tous les plans, en 9:16 (rushes-v/)

Il faut le site en local (python -m http.server 8123 --directory site), Microsoft Edge, Playwright et ffmpeg (celui du
système, sinon imageio-ffmpeg). Chaque plan devient videos/carte/halloween/public/rushes/<plan>.mp4 (30 images/s), le dossier
« public » du montage (pas dans git).
Comme tourner.py : ralenti.js ralentit tout le temps de la page (×0,1), et une capture est prise chaque fois que
l'horloge du plan passe 1/30 s ; Math.random est remplacé par un tirage à graine fixe, pour que chaque plan soit
le même à chaque tournage (le chemin du défilé, les chauves-souris, les hitodama).
"""
import base64
import json
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
VIDEO = ICI.parent
RACINE = VIDEO.parent.parent
SORTIE = RACINE / 'videos' / 'carte' / 'halloween' / 'public' / 'rushes'
SORTIE_V = SORTIE.parent / 'rushes-v'
ATTENDRE = "window.carte && document.getElementById('chargement').classList.contains('fini')"
NUIT, JOUR = '21:30', '10:30'
# Les plans : taille de la page (px CSS) et facteur d'échelle (la vidéo fait largeur × échelle), heure au Japon,
# Halloween allumé ou non, yōkai déjà trouvés. 1280 × 720 × 1,5 = 1920 × 1080 ; les plans « de près » sont tournés
# sur une page plus petite (960 × 540 × 2) : les yōkai y sont plus grands. Pas plus que ×2 : qualite.js plafonne la
# finesse de la carte à 2 (essayé à ×6 : la carte floue, et des trous dans le relief au premier plan).
# v3-coin est à ×3 (3840 × 2160) : le montage n'y garde que la toile ou le cartouche, nets.
# En vertical (--vertical, dans rushes-v/) : les mêmes plans sur une page de téléphone, 720 × 1280 × 1,5 = 1080 × 1920
# (540 × 960 × 2 de près) : les yōkai et les épingles ont la même taille à l'image qu'en 16:9, le cadre est plus
# étroit. plans.js reçoit window.__VERTICAL et prend les réglages « v » de chaque plan (cadrage, chemin du défilé).
PLANS_V = {
    'v2-large': {'positions': True},
    'v2-proche': {'page': (540, 960), 'echelle': 2, 'positions': True},
    'v3-jour': {'heure': JOUR, 'halloween': False},
    'v3-chapeaux': {'page': (540, 960), 'echelle': 2},
    'v3-coin': {'echelle': 2.25},
    'v3-chasse': {'trouves': ['yurei', 'oiwa', 'okiku', 'hitotsume', 'konaki', 'ittan']},
}
PLANS = {
    'v1-nagoro': {}, 'v1-osorezan': {}, 'v1-noboribetsu': {}, 'v1-himeji': {}, 'v1-fin': {},
    'v2-large': {'positions': True},
    'v2-proche': {'page': (960, 540), 'echelle': 2, 'positions': True},
    'v3-jour': {'heure': JOUR, 'halloween': False},
    'v3-nuit': {},
    'v3-chapeaux': {'page': (960, 540), 'echelle': 2},
    'v3-coin': {'echelle': 3},
    'v3-chasse': {'trouves': ['yurei', 'oiwa', 'okiku', 'hitotsume', 'konaki', 'ittan']},
    'fin-japon': {},
}
GRAINE = """(() => { let s = 20261031; Math.random = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();"""


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def tourner(nav, nom, reglages, vertical=False, facteur=0.1, ips=30):
    l, h = reglages.get('page', (720, 1280) if vertical else (1280, 720))
    k = reglages.get('echelle', 1.5)
    ctx = nav.new_context(viewport={'width': l, 'height': h}, device_scale_factor=k)
    trouves = reglages.get('trouves', [])
    ctx.add_init_script(f"""try {{
        localStorage.clear();
        localStorage.setItem('aideVue', '1');
        localStorage.setItem('langue', 'en');
        localStorage.setItem('modeDev', 'non');
        localStorage.setItem('qualite', JSON.stringify({{ niveau: 'fine', impose: 'fine' }}));
        localStorage.setItem('yokaiTrouves', '{str(trouves).replace("'", '"')}');
    }} catch {{}}
    window.__FACTEUR_RALENTI = {facteur};
    window.__VERTICAL = {'true' if vertical else 'false'};""")
    ctx.add_init_script(GRAINE)
    ctx.add_init_script((VIDEO / 'ralenti.js').read_text(encoding='utf-8'))
    if not reglages.get('halloween', True):
        def config(route):
            r = route.fetch()
            route.fulfill(response=r, body=r.text().replace('public: true', 'public: false'))
        ctx.route('**/config.js', config)
    p = ctx.new_page()
    erreurs = []
    p.on('pageerror', lambda e: erreurs.append(str(e)))
    date = f"&date={reglages['date']}" if 'date' in reglages else ''
    p.goto(f"http://localhost:8123/?heure={reglages.get('heure', NUIT)}{date}&points=non")  # (lieux en repères HTML : site/points.js)
    p.wait_for_function(ATTENDRE, timeout=120000)
    if reglages.get('halloween', True):
        p.wait_for_function("document.body.classList.contains('halloween')", timeout=30000)
    p.wait_for_timeout(2500)
    p.evaluate(f"window.carte.setPixelRatio({k})")
    for script in ['commun.js', 'halloween/plans.js'] + reglages.get('scripts', []):
        p.add_script_tag(content=(VIDEO / script).read_text(encoding='utf-8'))
    p.evaluate(f"window.__lancerPlan({nom!r})")
    p.wait_for_function('window.__film', timeout=30000)
    p.evaluate('window.__film.preparer()')
    duree = p.evaluate('window.__film.duree')
    cdp = ctx.new_cdp_session(p)
    capture = {'format': 'jpeg', 'quality': 94, 'clip': {'x': 0, 'y': 0, 'width': l, 'height': h, 'scale': k}}
    dossier = Path(tempfile.mkdtemp(prefix=f'rush-{nom}-'))
    p.evaluate('window.__ralentir(); window.__film.demarrer()')
    debut, n, images = time.time(), 0, round(duree * ips)
    # pour le défilé : la boîte de chaque yōkai à chaque image (px de la vidéo), pour que le montage les recadre
    boites = [] if reglages.get('positions') else None
    lire = f"""[...document.querySelectorAll('.defile-yokai .membre')].map((m) => {{ if (m.hidden) return null;
        const r = m.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * {k})); }})"""
    while n < images:
        tf, pause = p.evaluate('[window.__film.t(), window.__film.enPause()]')
        if pause or tf < n / ips:
            time.sleep(0.004)
            continue
        donnees = base64.b64decode(cdp.send('Page.captureScreenshot', capture)['data'])
        b = p.evaluate(lire) if boites is not None else None
        while n < images and n / ips <= tf:
            (dossier / f'{n:05d}.jpg').write_bytes(donnees)
            if boites is not None:
                boites.append(b)
            n += 1
    ctx.close()
    dossier_sortie = reglages.get('sortie') or (SORTIE_V if vertical else SORTIE)
    dossier_sortie.mkdir(parents=True, exist_ok=True)
    sortie = dossier_sortie / f'{nom}.mp4'
    # JPEG plein écart (BT.601) → vidéo BT.709 plage TV, comme tourner.py ; une image clé par seconde
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-framerate', str(ips), '-i', str(dossier / '%05d.jpg'),
                    '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-g', '30', '-color_range', 'tv', '-colorspace', 'bt709',
                    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', str(sortie)], check=True)
    shutil.rmtree(dossier, ignore_errors=True)
    if boites is not None:
        (dossier_sortie / f'{nom}.json').write_text(json.dumps({'taille': [round(l * k), round(h * k)], 'images': boites}), encoding='utf-8')
    print(f'{nom} : {duree} s en {time.time() - debut:.0f} s → {sortie}', flush=True)
    if erreurs:
        print('  erreurs de la page :', *erreurs, sep='\n    ')


def main():
    vertical = '--vertical' in sys.argv
    noms = [a for a in sys.argv[1:] if not a.startswith('--')] or list(PLANS)
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True,
                                 args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        for nom in noms:
            tourner(nav, nom, PLANS_V.get(nom, {}) if vertical else PLANS[nom], vertical)
        nav.close()


if __name__ == '__main__':
    sys.exit(main())
