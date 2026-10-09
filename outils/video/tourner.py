"""Tourne le film promo de la carte (9:16, 1080 × 1920, 30 s) dans la vraie carte, puis le monte avec la musique.

    python outils/video/tourner.py              # le film : 30 images/s, au ralenti ×10 (environ 7 minutes)
    python outils/video/tourner.py --brouillon  # pour vérifier la mise en page : 15 images/s, ralenti ×4

Il faut le site en local (python -m http.server 8123 --directory site), Microsoft Edge, Playwright, Pillow et
ffmpeg (celui du système, sinon `pip install imageio-ffmpeg`). Les vidéos vont dans videos/ (pas dans git) :
promo-carte.mp4 avec la musique, promo-carte-sans-musique.mp4 pour y mettre un son TikTok.

Comment : ralenti.js ralentit tout le temps de la page (la carte bouge 10 fois moins vite, les tuiles arrivent
à vitesse normale) ; realisation.js joue les scènes et dessine les titres ; ici on prend une capture chaque fois
que l'horloge du film passe 1/30 s, sauf pendant ses pauses (sous un volet, le temps que la vue charge).
La musique : « Michikusa » de PeriTune (CC BY 4.0, créditée sur la fin du film), à 128 battements par minute ;
son premier temps est à 0,31 s, d'où le décalage : chaque scène dure deux mesures.
"""
import argparse
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
RACINE = ICI.parent.parent
SORTIE = RACINE / 'videos'
MUSIQUE = RACINE / 'site' / 'musique' / 'peritune-michikusa.m4a'
DECALAGE_MUSIQUE = 0.31  # secondes : le premier temps de « Michikusa »
ADRESSE = 'http://localhost:8123/'
LARGEUR, HAUTEUR = 432, 768  # un vrai téléphone (l'interface à sa taille), filmé en 1080 × 1920
ATTENDRE = "window.carte && document.getElementById('chargement').classList.contains('fini')"
# Les favoris du visiteur au début du film (le château de Himeji s'y ajoute pendant la scène 3)
FAVORIS = ['kinkaku-ji', 'sanjusangen-do', 'todai-ji-daibutsu-den', 'itsukushima-jinja']


def ffmpeg():
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def tourner(images, facteur, ips, dossier):
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True,
                                 args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = nav.new_context(viewport={'width': LARGEUR, 'height': HAUTEUR}, device_scale_factor=1080 / LARGEUR, is_mobile=True, has_touch=True)
        ctx.add_init_script(f"""try {{
            localStorage.clear();
            localStorage.setItem('aideVue', '1');
            localStorage.setItem('langue', 'en');
            localStorage.setItem('favoris', {json.dumps(json.dumps(FAVORIS))});
        }} catch {{}}
        window.__FACTEUR_RALENTI = {facteur};""")
        ctx.add_init_script((ICI / 'ralenti.js').read_text(encoding='utf-8'))
        p = ctx.new_page()
        erreurs = []
        p.on('pageerror', lambda e: erreurs.append(str(e)))
        p.goto(ADRESSE)
        p.wait_for_function(ATTENDRE, timeout=120000)
        p.wait_for_timeout(3500)
        # la carte se dessine en pleine résolution (le site se limite à ×2 pour les téléphones)
        p.evaluate(f"window.carte.setPixelRatio({1080 / LARGEUR})")
        # la carte arrête de tourner toute seule, comme au premier geste d'un visiteur
        p.evaluate("window.carte.getCanvasContainer().dispatchEvent(new MouseEvent('mousedown'))")
        # le dé : préfecture de Kyoto, temples
        p.evaluate("document.getElementById('btn-hasard').click()")
        p.wait_for_function("document.getElementById('choix-region').options.length > 1", timeout=30000)
        p.evaluate("""(() => {
            const choisir = (id, debut) => { const s = document.getElementById(id);
              const o = [...s.options].find((o) => o.text.startsWith(debut)); s.value = o.value; s.dispatchEvent(new Event('change')); };
            choisir('choix-region', 'Kyoto'); choisir('choix-type', 'Temples');
            document.body.click();
        })()""")
        p.add_script_tag(content=(ICI / 'realisation.js').read_text(encoding='utf-8'))
        p.wait_for_function('window.__film', timeout=30000)
        p.evaluate('window.__film.preparer()')
        p.wait_for_timeout(1500)
        cdp = ctx.new_cdp_session(p)
        capture = {'format': 'jpeg', 'quality': 93, 'clip': {'x': 0, 'y': 0, 'width': LARGEUR, 'height': HAUTEUR, 'scale': 1080 / LARGEUR}}
        p.evaluate('window.__ralentir(); window.__film.demarrer()')
        debut = time.time()
        k = 0
        while k < images:
            tf, pause = p.evaluate('[window.__film.t(), window.__film.enPause()]')
            if pause or tf < k / ips:
                time.sleep(0.004)
                continue
            donnees = base64.b64decode(cdp.send('Page.captureScreenshot', capture)['data'])
            # si l'horloge a sauté plusieurs images (rare), la même capture les remplit
            while k < images and k / ips <= tf:
                (dossier / f'{k:05d}.jpg').write_bytes(donnees)
                k += 1
            if k % (ips * 2) == 0:
                print(f'  {k / ips:4.1f} s du film ({time.time() - debut:.0f} s)', flush=True)
        nav.close()
        if erreurs:
            print('Erreurs de la page :', *erreurs, sep='\n  ')


def monter(dossier, ips, duree):
    SORTIE.mkdir(exist_ok=True)
    exe = ffmpeg()
    video = ['-framerate', str(ips), '-i', str(dossier / '%05d.jpg')]
    # les captures sont des JPEG en couleurs « pleine plage » (BT.601) : la vidéo, elle, en BT.709 plage TV, comme
    # l'attendent les téléphones (sinon les couleurs sont un peu délavées ou trop contrastées selon le lecteur)
    couleurs = 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p'
    codage = ['-vf', couleurs, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high',
              '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
              '-r', '30', '-movflags', '+faststart']
    sans = SORTIE / 'promo-carte-sans-musique.mp4'
    subprocess.run([exe, '-hide_banner', '-loglevel', 'error', '-y', *video, *codage, '-an', str(sans)], check=True)
    avec = SORTIE / 'promo-carte.mp4'
    son = (f'loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=in:d=0.05,afade=t=out:st={duree - 1.3}:d=1.3')
    subprocess.run([exe, '-hide_banner', '-loglevel', 'error', '-y', *video,
                    '-ss', str(DECALAGE_MUSIQUE), '-t', str(duree), '-i', str(MUSIQUE),
                    '-map', '0:v', '-map', '1:a', *codage, '-af', son, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-t', str(duree), str(avec)], check=True)
    return avec, sans


def main():
    arg = argparse.ArgumentParser()
    arg.add_argument('--brouillon', action='store_true')
    arg.add_argument('--garder', help='dossier où garder les images')
    arg.add_argument('--monter', help="seulement refaire le montage, avec les images gardées dans ce dossier")
    a = arg.parse_args()
    facteur, ips = (0.25, 15) if a.brouillon else (0.1, 30)
    duree = 30
    if a.monter:
        print('Fini :', *monter(Path(a.monter), ips, duree))
        return
    dossier = Path(a.garder) if a.garder else Path(tempfile.mkdtemp(prefix='promo-carte-'))
    dossier.mkdir(parents=True, exist_ok=True)
    for f in dossier.glob('*.jpg'):
        f.unlink()
    print('Tournage…', dossier)
    tourner(duree * ips, facteur, ips, dossier)
    print('Montage…')
    avec, sans = monter(dossier, ips, duree)
    print('Fini :', avec, sans)


if __name__ == '__main__':
    sys.exit(main())
