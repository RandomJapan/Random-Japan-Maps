"""Filme les prises des vidéos de la balade 3D (plans.js) dans la vraie balade, en 9:16 pour TikTok, 60 images/s.

    python outils/video/balade/rushes.py                    # toutes les prises
    python outils/video/balade/rushes.py it-plage tk-rame   # seulement celles-là
    python outils/video/balade/rushes.py it-plage --brouillon   # vite (×0,5, 15 images/s, 540 × 960) + une planche

Il faut le site en local (python -m http.server 8123 --directory site ; --port pour un autre), Microsoft Edge,
Playwright et ffmpeg (celui du système, sinon imageio-ffmpeg). Chaque prise devient
videos/balade/public/rushes/<prise>.mp4, le dossier « public » du montage (pas dans git).
La page fait 540 × 960 px CSS à ×2 (1080 × 1920) : la balade telle qu'on la voit sur un téléphone en hauteur, mais
sans le joystick ni les boutons du haut, et la boîte de dialogue remontée au-dessus de la légende de TikTok.
Comme les autres tournages (outils/video/) : ralenti.js ralentit tout le temps de la page (×0,08), une capture est prise
chaque fois que l'horloge de la prise passe 1/60 s ; Math.random est remplacé par un tirage à graine fixe, pour que
chaque prise soit la même à chaque tournage.
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
RACINE = ICI.parents[2]
SORTIE = RACINE / 'videos' / 'balade' / 'public' / 'rushes'
BROUILLONS = RACINE / 'videos' / 'balade' / 'brouillons'
PORT = sys.argv[sys.argv.index('--port') + 1] if '--port' in sys.argv else '8123'
BROUILLON = '--brouillon' in sys.argv

# Les prises : le lieu, le voyageur, le compagnon (None : on le choisit au départ, la scène du trio), ce qui est
# déjà dans la mémoire du jeu (tampons, secrets, achats…), et l'interface montrée (dialogue : la boîte de dialogue,
# les tampons, les cartes ; tout : aussi le titre et les boutons du haut).
# les cinq secrets trouvés (cinq koban) ; tout ce que vend le marchand, déjà acheté
SECRETS = {'trouves': ['corbeaux', 'tresor', 'heike', 'okiku', 'miroir'], 'indices': []}
TOUT_ACHETE = {'baladeAchats': ['danse', 'traces', 'accessoires', 'feux', 'masque', 'happi', 'yukata', 'photo', 'gao', 'fuwa', 'saya', 'calendrier', 'kimonoOr', 'armure'],
               'baladeSecrets': SECRETS, 'baladeMarchandVu': 'oui'}
PRISES = {
    # Vidéo 1 : la balade, les cinq lieux
    'it-plage': {'lieu': 'itsukushima'},
    'ao-belv': {'lieu': 'aogashima', 'ui': 'rien'},
    'gk-village': {'lieu': 'gokayama', 'ui': 'rien'},
    'hm-pont': {'lieu': 'himeji', 'ui': 'rien'},
    'tk-barque': {'lieu': 'takachiho', 'ui': 'rien'},
    'trio': {'lieu': 'itsukushima', 'compagnon': None, 'garder': [[1.5, 8.5]]},
    'it-herbes': {'lieu': 'itsukushima', 'garder': [[1.5, 6]]},
    'it-torii': {'lieu': 'itsukushima', 'garder': [[2.5, 6.8]]},
    'hm-koi': {'lieu': 'himeji', 'garder': [[1.5, 6.5]]},
    'gk-nuit': {'lieu': 'gokayama', 'ui': 'rien'},
    'it-feux': {'lieu': 'itsukushima', 'stockage': {'baladeAchats': ['feux']}, 'garder': [[2.5, 10.5]]},
    # Vidéo 2 : Takachiho en détail
    'tk-eau': {'lieu': 'takachiho', 'ui': 'rien'},
    'tk-rame': {'lieu': 'takachiho', 'garder': [[0, 10.5]]},
    'tk-somen': {'lieu': 'takachiho', 'garder': [[5, 17.5]]},
    'tk-kagura': {'lieu': 'takachiho', 'garder': [[1.5, 13.5]]},
    'tk-miroir': {'lieu': 'takachiho', 'garder': [[2, 9.5]]},
    'tk-eclipse': {'lieu': 'takachiho', 'garder': [[0.8, 3.8], [5.8, 9.2], [10.8, 15.2], [23.5, 29]]},
    'tk-grotte': {'lieu': 'takachiho', 'ui': 'rien', 'garder': [[17, 26]]},
    'tk-collier': {'lieu': 'takachiho', 'stockage': {'baladeTampons': {'takachiho': ['barque', 'somen', 'kagura', 'meoto']}}, 'garder': [[9.5, 18.5]]},
    # Vidéo 3 : les secrets, les koban, Bunbuku
    'it-corbeaux': {'lieu': 'itsukushima', 'garder': [[6.5, 14.5], [36, 50]]},
    'ao-carte': {'lieu': 'aogashima', 'garder': [[8, 13.5]]},
    'ao-tresor': {'lieu': 'aogashima', 'garder': [[2.5, 16.5]]},
    'gk-luciole': {'lieu': 'gokayama', 'garder': [[1, 9.5], [44, 58.5]]},
    'hm-okiku': {'lieu': 'himeji', 'garder': [[1, 15]]},
    'bunbuku': {'lieu': 'itsukushima', 'stockage': {'baladeSecrets': SECRETS}, 'garder': [[0.3, 4.5], [10, 18]]},
    'garde-robe': {'lieu': 'itsukushima', 'ui': 'rien', 'css': '.garde-robe { display: none !important; }', 'stockage': {**TOUT_ACHETE, 'baladeTampons': {'itsukushima': ['torii', 'sanctuaire', 'pagode', 'daim', 'momiji']}}},
    'trio6': {'lieu': 'itsukushima', 'compagnon': None, 'stockage': TOUT_ACHETE, 'garder': [[1.5, 9.8]]},
    'saisons': {'lieu': 'himeji', 'ui': 'rien'},
    'danse': {'lieu': 'itsukushima', 'ui': 'rien', 'stockage': TOUT_ACHETE},
}
DEFAUT = {'perso': 'fille', 'compagnon': 'kon', 'stockage': {}, 'ui': 'dialogue'}

GRAINE = """(() => { let s = 20261026; Math.random = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();"""
# l'interface pour la vidéo : rien en haut (les onglets de TikTok), pas de joystick ; la boîte de dialogue au-dessus
# de la légende (le bas de l'écran) et à gauche des boutons de TikTok (le côté droit)
CSS = {
    'dialogue': """
.titre, .boutons-haut, .joystick, .bouton-a { display: none !important; }
body:not(.aide-film) .aide { display: none !important; }
:root { --bas: 240px !important; }
.dialogue { width: 446px !important; left: 14px !important; transform: none !important; }
.dialogue-choix { right: auto !important; left: 250px !important; }
""",
    'tout': """
.aide, .joystick, .bouton-a { display: none !important; }
:root { --bas: 240px !important; }
.dialogue { width: 446px !important; left: 14px !important; transform: none !important; }
""",
    'rien': """
.titre, .boutons-haut, .aide, .joystick, .bouton-a, .bulle-action, .dialogue, .dialogue-choix { display: none !important; }
""",
}


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def tourner(nav, nom, r, facteur, ips, echelle):
    ctx = nav.new_context(viewport={'width': 540, 'height': 960}, device_scale_factor=2)
    stockage = {'langue': 'en', 'baladePerso': r['perso'], 'baladeMusique': 'non', 'baladeSon': 'non', **r['stockage']}
    ctx.add_init_script('try { localStorage.clear(); ' + ''.join(
        f'localStorage.setItem({json.dumps(k)}, {json.dumps(v if isinstance(v, str) else json.dumps(v))}); ' for k, v in stockage.items()) + '} catch {}')
    ctx.add_init_script(f'window.__FACTEUR_RALENTI = {facteur};')
    ctx.add_init_script((RACINE / 'outils' / 'video' / 'ralenti.js').read_text(encoding='utf-8'))
    ctx.add_init_script(GRAINE)
    p = ctx.new_page()
    erreurs = []
    p.on('pageerror', lambda ex: erreurs.append(str(ex)))
    compagnon = f'&compagnon={r["compagnon"]}' if r['compagnon'] else ''
    p.goto(f'http://localhost:{PORT}/balade/?lieu={r["lieu"]}&perso={r["perso"]}&langue=en{compagnon}')
    p.wait_for_function('window.__pret === true', timeout=120000)
    p.add_style_tag(content=CSS[r['ui']] + r.get('css', ''))
    if r['compagnon']:
        # l'accueil (« Te revoilà… », le mot du compagnon) : passé avant de tourner
        for _ in range(40):
            p.wait_for_timeout(200)
            if p.evaluate("balade.etat.mode === 'jeu' && document.querySelector('.dialogue').hidden"):
                break
            p.keyboard.press('KeyE')
    p.evaluate(f'window.__PRISE = {json.dumps(nom)}')
    p.add_script_tag(content=(ICI / 'plans.js').read_text(encoding='utf-8'))
    p.evaluate('window.__film.preparer()')
    p.wait_for_timeout(1500)
    cdp = ctx.new_cdp_session(p)
    capture = {'format': 'jpeg', 'quality': 93, 'clip': {'x': 0, 'y': 0, 'width': 540, 'height': 960, 'scale': echelle}}
    duree = p.evaluate('window.__film.duree')
    # les passages filmés ([début, fin] en secondes de la prise) ; entre eux, la page va à vitesse normale
    fenetres = r.get('garder') or [[0, duree]]
    p.evaluate('window.__ralentir(); window.__film.demarrer()')
    if fenetres[0][0] > 0.6:
        p.evaluate('window.__changerFacteur(1)')
    debut, sorties, mesures = time.time(), [], []
    for j, (a, b) in enumerate(fenetres):
        if a > 0.6:
            while p.evaluate('window.__film.t()') < a - 0.5:
                time.sleep(0.004)
            p.evaluate(f'window.__changerFacteur({facteur})')
        images = Path(tempfile.mkdtemp(prefix=f'rush-{nom}-{j}-'))
        k0, n = int(round(a * ips)), int(round((b - a) * ips))
        k = 0
        while k < n:
            tf = p.evaluate('window.__film.t()')
            if tf < (k0 + k) / ips:
                time.sleep(0.003)
                continue
            t1 = time.time()
            donnees = base64.b64decode(cdp.send('Page.captureScreenshot', capture)['data'])
            mesures.append(time.time() - t1)
            while k < n and (k0 + k) / ips <= tf:
                (images / f'{k:05d}.jpg').write_bytes(donnees)
                k += 1
            if k % (ips * 2) == 0:
                print(f'  {nom} {(k0 + k) / ips:4.1f} s / {b:.1f} ({time.time() - debut:.0f} s)', flush=True)
        sorties.append((images, n, a))
        if j < len(fenetres) - 1:
            p.evaluate('window.__changerFacteur(1)')
    ctx.close()
    if mesures:
        print(f'  capture : {1000 * sum(mesures) / len(mesures):.0f} ms en moyenne', flush=True)
    if erreurs:
        print('  erreurs de la page :', *erreurs[:5], sep='\n    ')
    return sorties


def encoder(images, f, ips):
    couleurs = ['-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-framerate', str(ips), '-i', str(images / '%05d.jpg'),
                    '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-g', '15', *couleurs, '-r', str(ips),
                    '-movflags', '+faststart', '-an', str(f)], check=True)


def planche(images, n, f):
    """Une planche de 12 images de la prise (le brouillon)."""
    from PIL import Image
    pas = max(1, n // 12)
    vignettes = [Image.open(images / f'{i:05d}.jpg').resize((270, 480)) for i in range(0, n, pas)][:12]
    p = Image.new('RGB', (270 * 6, 480 * 2), 'white')
    for i, v in enumerate(vignettes):
        p.paste(v, ((i % 6) * 270, (i // 6) * 480))
    p.save(f, quality=86)


def main():
    noms = [a for a in sys.argv[1:] if a in PRISES] or list(PRISES)
    facteur, ips, echelle = (0.5, 15, 1) if BROUILLON else (0.08, 60, 2)
    dossier = BROUILLONS if BROUILLON else SORTIE
    dossier.mkdir(parents=True, exist_ok=True)
    index = json.loads((dossier / 'index.json').read_text(encoding='utf-8')) if (dossier / 'index.json').exists() else {}
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
        for nom in noms:
            r = {**DEFAUT, **PRISES[nom]}
            t0 = time.time()
            sorties = tourner(nav, nom, r, facteur, ips, echelle)
            for j, (images, n, a) in enumerate(sorties):
                # (plusieurs passages : <prise>-1.mp4, <prise>-2.mp4… ; leurs débuts dans la prise sont notés dans index.json)
                f = dossier / (f'{nom}.mp4' if len(sorties) == 1 else f'{nom}-{j + 1}.mp4')
                encoder(images, f, ips)
                if BROUILLON:
                    planche(images, n, f.with_suffix('.jpg'))
                shutil.rmtree(images, ignore_errors=True)
                index[f.stem] = a
                print(f'{f.stem} : {n} images ({time.time() - t0:.0f} s) → {f}', flush=True)
            (dossier / 'index.json').write_text(json.dumps(index, indent=1), encoding='utf-8')
        nav.close()


if __name__ == '__main__':
    main()
