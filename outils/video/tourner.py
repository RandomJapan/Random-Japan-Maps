"""Tourne un film promo de la carte (9:16, 1080 × 1920, 30 s) dans la vraie carte, puis le monte avec la musique.

    python outils/video/tourner.py              # le premier film (promo) : 30 images/s, au ralenti ×10 (environ 7 minutes)
    python outils/video/tourner.py --film voyage   # ou zoom, pov : les trois films du 2026-10-10 (voir FILMS)
    python outils/video/tourner.py --brouillon  # pour vérifier la mise en page : 15 images/s, ralenti ×4

Il faut le site en local (python -m http.server 8123 --directory site), Microsoft Edge, Playwright, Pillow et
ffmpeg (celui du système, sinon `pip install imageio-ffmpeg`). Les vidéos vont dans videos/ (pas dans git) :
<nom>.mp4 avec la musique, <nom>-sans-musique.mp4 pour y mettre un son TikTok.

Comment : ralenti.js ralentit tout le temps de la page (la carte bouge 10 fois moins vite, les tuiles arrivent
à vitesse normale) ; realisation.js joue les scènes et dessine les titres ; ici on prend une capture chaque fois
que l'horloge du film passe 1/30 s, sauf pendant ses pauses (sous un volet, le temps que la vue charge).
La musique : « Michikusa » de PeriTune (CC BY 4.0, créditée sur la fin du film), à 128 battements par minute ;
son premier temps est à 0,31 s, d'où le décalage : chaque scène dure deux mesures.
"""
import argparse
import base64
import json
import os
import re
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
DECALAGE_MUSIQUE = 0.31  # secondes : le premier temps de « Michikusa »
ADRESSE = 'http://localhost:8123/'
LARGEUR, HAUTEUR = 432, 768  # un vrai téléphone (l'interface à sa taille), filmé en 1080 × 1920
ATTENDRE = "window.carte && document.getElementById('chargement').classList.contains('fini')"
# Les favoris du visiteur au début du film (le château de Himeji s'y ajoute pendant la scène 3)
FAVORIS = ['kinkaku-ji', 'sanjusangen-do', 'todai-ji-daibutsu-den', 'itsukushima-jinja']
# Les vidéos des lieux : celles du propriétaire, telles qu'il les a montées pour TikTok (pas dans le dépôt). Le
# lecteur TikTok ne marche pas dans un navigateur piloté (TikTok le bloque) : les films voyage et pov montrent donc
# un extrait du fichier de chaque lieu, préparé dans videos/extraits/ (720 × 1280, sans le son).
VIDEOS_LIEUX = Path(os.environ.get('VIDEOS_LIEUX', r'D:\Montage\Vidéo lieux random japon'))
DUREE_EXTRAIT = 4.0
# id de la vidéo TikTok du lieu (colonne « Lien TikTok » du tableau) : (fichier dans VIDEOS_LIEUX, début de l'extrait
# en s), choisis sur des planches-contact : un beau plan, sans le titre incrusté du début des vidéos
EXTRAITS = {
    '7650552780922424598': ('Hirosaki Castle.mp4', 31.0),  # le donjon derrière le pont rouge et les cerisiers
    '7659091697707633942': ('Fuji Shibazakura Festival.mp4', 31.3),  # le Fuji au-dessus des champs de mousse rose
    '7660227940243737878': ('Kinkaku-ji.mp4', 12.1),  # le pavillon d'or au-dessus de l'étang
    '7647214222648151318': ('Itsukushima Shrine.mp4', 42.6),  # le torii à contre-jour, puis à marée basse
    '7641695228323319043': ('SAKURAJIMA.mp4', 11.0),  # le panache de l'éruption
    '7643858576523480342': ('Shuri castle.mp4', 46.6),  # la grande salle rouge
    '7649489240199531778': ('Himeji Castle.mp4', 36.6),  # à travers les cerisiers, puis vu du ciel
    '7666570788287286550': ('Kumano Nachi-taisha.mp4', 9.6),  # la pagode et la cascade dans la brume
}
# Les films : leurs scripts (injectés dans la page, dans l'ordre), leur musique (site/musique/<id>.m4a), l'instant
# du morceau où le film commence, le nom des vidéos, les favoris du visiteur au début, les extraits de vidéos
# qu'ils montrent. commun.js : les outils des films du 2026-10-10 (le premier, realisation.js, a les siens).
FILMS = {
    'promo': {'scripts': ['realisation.js'], 'musique': 'peritune-michikusa', 'debut': DECALAGE_MUSIQUE, 'nom': 'promo-carte',
              'favoris': FAVORIS, 'de': True},
    # « Le grand voyage » : du nord au sud en une prise ; Ametsuchi (PeriTune), dès son premier temps
    'voyage': {'scripts': ['commun.js', 'voyage.js'], 'musique': 'peritune-ametsuchi', 'debut': 0.12, 'nom': 'film-voyage', 'favoris': [],
               'extraits': ['7650552780922424598', '7659091697707633942', '7660227940243737878', '7647214222648151318',
                            '7641695228323319043', '7643858576523480342']},
    # « Le zoom arrière » : d'un lieu à tout le Japon ; Awayuki (PeriTune) s'envole à 20,0 s, soit à 7 s du film
    'zoom': {'scripts': ['commun.js', 'zoom.js'], 'musique': 'peritune-awayuki', 'debut': 13.0, 'nom': 'film-zoom', 'favoris': []},
    # « POV voyageur » : le style d'une vidéo TikTok ; Avenue Cafe (魔王魂), 118 battements par minute, premier temps à 0,47 s
    'pov': {'scripts': ['commun.js', 'pov.js'], 'musique': 'maou-bgm-acoustic38', 'debut': 0.466, 'nom': 'film-pov', 'favoris': [],
            'extraits': ['7660227940243737878', '7649489240199531778', '7666570788287286550']},
}


def ffmpeg():
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def preparer_extraits(ids):
    """Coupe l'extrait de chaque vidéo (seulement ceux qui manquent) ; rend {id: fichier}."""
    dossier = SORTIE / 'extraits'
    dossier.mkdir(parents=True, exist_ok=True)
    fichiers = {}
    for id_ in ids:
        source, debut = EXTRAITS[id_]
        f = dossier / f'{id_}-{debut:g}.mp4'
        if not f.exists():
            print('Extrait :', source, flush=True)
            # 9:16 comme les vidéos TikTok, une image clé toutes les 0,5 s (le lecteur cale vite son départ)
            subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(debut), '-i', str(VIDEOS_LIEUX / source),
                            '-t', str(DUREE_EXTRAIT), '-an',
                            '-vf', 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,format=yuv420p',
                            '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-g', '15', '-movflags', '+faststart', str(f)], check=True)
        fichiers[id_] = f
    return fichiers


def faux_lecteur(id_, facteur):
    """Une page qui imite le lecteur TikTok (player/v1 et ses messages) et joue l'extrait, au ralenti du tournage.
    visite.js lui demande d'aller au début de l'extrait (seekTo) : l'extrait repart de 0, le temps annoncé en tient compte."""
    return f"""<!doctype html><meta charset="utf-8"><style>html, body {{ margin: 0; height: 100%; background: #000; overflow: hidden; }}
video {{ display: block; width: 100%; height: 100%; object-fit: cover; }}</style><video muted playsinline preload="auto"></video><script>
const v = document.querySelector('video'), RALENTI = {facteur};
let base = 0;
const dire = (type, value) => parent.postMessage({{ type, value, 'x-tiktok-player': true }}, '*');
const jouer = () => {{ v.playbackRate = RALENTI; v.play().catch(() => {{}}); }};
fetch('/__extrait/{id_}.mp4').then((r) => (r.ok ? r.blob() : Promise.reject(r.status))).then((b) => {{
  v.src = URL.createObjectURL(b);
  v.addEventListener('loadeddata', () => {{ dire('onPlayerReady'); jouer(); }}, {{ once: true }});
}}).catch(() => dire('onPlayerError', {{ errorCode: 1 }}));
v.addEventListener('playing', () => dire('onStateChange', 1));
v.addEventListener('pause', () => dire('onStateChange', 2));
setInterval(() => {{ if (v.readyState) dire('onCurrentTime', {{ currentTime: base + v.currentTime, duration: 60 }}); }}, 100);
addEventListener('message', (e) => {{
  const d = e.data;
  if (!d || !d['x-tiktok-player']) return;
  if (d.type === 'play') jouer();
  else if (d.type === 'pause') v.pause();
  else if (d.type === 'seekTo') {{ base = Number(d.value) || 0; v.currentTime = 0; }}
}});
</script>"""


def brancher_extraits(ctx, fichiers, facteur):
    """Le lecteur TikTok (player/v1/<id>) devient le faux lecteur ; /__extrait/<id>.mp4 sert l'extrait (aux deux origines)."""
    def tiktok(route):
        m = re.search(r'/player/v1/(\d+)', route.request.url)
        if m:
            route.fulfill(status=200, content_type='text/html; charset=utf-8', body=faux_lecteur(m.group(1), facteur))
        else:
            route.fallback()

    def extrait(route):
        m = re.search(r'/__extrait/(\d+)\.mp4', route.request.url)
        f = fichiers.get(m.group(1)) if m else None
        if f:
            route.fulfill(status=200, content_type='video/mp4', body=f.read_bytes())
        else:
            route.fulfill(status=404, body='')
    ctx.route('https://www.tiktok.com/player/**', tiktok)
    ctx.route('**/__extrait/*', extrait)


def tourner(images, facteur, ips, dossier, reglages):
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True,
                                 args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = nav.new_context(viewport={'width': LARGEUR, 'height': HAUTEUR}, device_scale_factor=1080 / LARGEUR, is_mobile=True, has_touch=True)
        ctx.add_init_script(f"""try {{
            localStorage.clear();
            localStorage.setItem('aideVue', '1');
            localStorage.setItem('langue', 'en');
            localStorage.setItem('favoris', {json.dumps(json.dumps(reglages['favoris']))});
        }} catch {{}}
        window.__FACTEUR_RALENTI = {facteur};""")
        ctx.add_init_script((ICI / 'ralenti.js').read_text(encoding='utf-8'))
        if reglages.get('extraits'):
            brancher_extraits(ctx, preparer_extraits(reglages['extraits']), facteur)
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
        if reglages.get('de'):
            # le dé : préfecture de Kyoto, temples
            p.evaluate("document.getElementById('btn-hasard').click()")
            p.wait_for_function("document.getElementById('choix-region').options.length > 1", timeout=30000)
            p.evaluate("""(() => {
                const choisir = (id, debut) => { const s = document.getElementById(id);
                  const o = [...s.options].find((o) => o.text.startsWith(debut)); s.value = o.value; s.dispatchEvent(new Event('change')); };
                choisir('choix-region', 'Kyoto'); choisir('choix-type', 'Temples');
                document.body.click();
            })()""")
        for script in reglages['scripts']:
            p.add_script_tag(content=(ICI / script).read_text(encoding='utf-8'))
        p.wait_for_function('window.__film', timeout=30000)
        print('Préparation…', flush=True)
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


def monter(dossier, ips, duree, reglages):
    SORTIE.mkdir(exist_ok=True)
    exe = ffmpeg()
    video = ['-framerate', str(ips), '-i', str(dossier / '%05d.jpg')]
    # les captures sont des JPEG en couleurs « pleine plage » (BT.601) : la vidéo, elle, en BT.709 plage TV, comme
    # l'attendent les téléphones (sinon les couleurs sont un peu délavées ou trop contrastées selon le lecteur)
    couleurs = 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p'
    codage = ['-vf', couleurs, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high',
              '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
              '-r', '30', '-movflags', '+faststart']
    sans = SORTIE / f"{reglages['nom']}-sans-musique.mp4"
    subprocess.run([exe, '-hide_banner', '-loglevel', 'error', '-y', *video, *codage, '-an', str(sans)], check=True)
    avec = SORTIE / f"{reglages['nom']}.mp4"
    son = (f'loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=in:d=0.05,afade=t=out:st={duree - 1.3}:d=1.3')
    subprocess.run([exe, '-hide_banner', '-loglevel', 'error', '-y', *video,
                    '-ss', str(reglages['debut']), '-t', str(duree), '-i', str(RACINE / 'site' / 'musique' / f"{reglages['musique']}.m4a"),
                    '-map', '0:v', '-map', '1:a', *codage, '-af', son, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-t', str(duree), str(avec)], check=True)
    return avec, sans


def main():
    arg = argparse.ArgumentParser()
    arg.add_argument('--film', choices=list(FILMS), default='promo')
    arg.add_argument('--brouillon', action='store_true')
    arg.add_argument('--garder', help='dossier où garder les images')
    arg.add_argument('--monter', help="seulement refaire le montage, avec les images gardées dans ce dossier")
    a = arg.parse_args()
    facteur, ips = (0.25, 15) if a.brouillon else (0.1, 30)
    duree = 30
    reglages = FILMS[a.film]
    if a.monter:
        print('Fini :', *monter(Path(a.monter), ips, duree, reglages))
        return
    dossier = Path(a.garder) if a.garder else Path(tempfile.mkdtemp(prefix=f"{reglages['nom']}-"))
    dossier.mkdir(parents=True, exist_ok=True)
    for f in dossier.glob('*.jpg'):
        f.unlink()
    print('Tournage…', dossier)
    tourner(duree * ips, facteur, ips, dossier, reglages)
    print('Montage…')
    avec, sans = monter(dossier, ips, duree, reglages)
    print('Fini :', avec, sans)


if __name__ == '__main__':
    sys.exit(main())
