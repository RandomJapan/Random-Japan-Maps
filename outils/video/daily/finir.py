"""Fabrique les épisodes de « Japan Daily » finis (9:16, 60 images/s) depuis le montage Remotion (montage/) : chacun avec la musique
et sans (les bruitages restent : pour y mettre un son TikTok), sa miniature (l'image 0, déjà posée) et sa légende à copier, dans
videos/carte/daily/.
    python outils/video/daily/finir.py          # tous les épisodes
    python outils/video/daily/finir.py 3        # un seul
Il faut d'abord preparer.py, musique.py et rushes.py, et le node_modules de montage/ (npm install).
Le son à −20 LUFS (la musique 6 dB sous le niveau habituel de TikTok, comme les vidéos du calendrier : le propriétaire l'a demandé
deux fois le 2026-11-23), le même gain pour la version sans musique ; l'image en BT.709 plage TV.
"""
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
MONTAGE = ICI / 'montage'
SORTIE = ICI.parents[2] / 'videos' / 'carte' / 'daily'
EPISODES = json.loads((MONTAGE / 'src' / 'episodes.json').read_text(encoding='utf-8'))
CIBLE = -20  # LUFS
OPTIONS = ['--concurrency=4', '--timeout=120000', '--offthreadvideo-cache-size-in-bytes=2000000000', '--log=error']
# Le nombre de lieux de la carte, pour la légende : à tenir à jour (python outils/youtube_shorts.py --liste le compte)
NB_LIEUX = 173


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def npx(*args):
    env = {**os.environ, 'TMP': str(SORTIE / 'tmp'), 'TEMP': str(SORTIE / 'tmp')}
    commande = [shutil.which('npx') or 'npx', 'remotion', *args]
    try:
        subprocess.run(commande, cwd=MONTAGE, check=True, shell=sys.platform == 'win32', env=env)
    except subprocess.CalledProcessError:
        # un rendu peut s'arrêter sur « waitForFunction » : une seconde fois, moins d'onglets à la fois et plus de patience
        print('… nouvel essai : --concurrency=2 --timeout=300000', flush=True)
        commande = [a.replace('--concurrency=4', '--concurrency=2').replace('--timeout=120000', '--timeout=300000') for a in commande]
        subprocess.run(commande, cwd=MONTAGE, check=True, shell=sys.platform == 'win32', env=env)


def props(jour, bgm):
    f = MONTAGE / 'out' / f'props-{jour}-{"bgm" if bgm else "sans"}.json'
    f.write_text(json.dumps({'jour': int(jour), 'bgm': bgm}), encoding='utf-8')
    return f


def volume(f):
    sortie = subprocess.run([ffmpeg(), '-hide_banner', '-i', str(f), '-af', 'loudnorm=print_format=json', '-f', 'null', '-'],
                            capture_output=True, text=True, encoding='utf-8', errors='ignore').stderr
    return float(json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', sortie).group(0))['input_i'])


def finir(brut, f, gain):
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(brut),
                    '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-r', '60',
                    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
                    '-af', f'volume={gain:.2f}dB,alimiter=limit=0.8:level=false', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-movflags', '+faststart', str(f)], check=True)


def legende(e):
    """La légende à copier. La 1re ligne nomme le lieu et sa préfecture (le marketing : la recherche TikTok et YouTube) ; la
    seconde version ne dit rien du lieu, pour ne pas donner la réponse sous la vidéo."""
    n, lieu, pref = e['jour'], e['lieu'], e['prefecture']
    tags = "#japan #japantravel #guesstheplace #japandaily #geography"
    tags_lieu = f"{tags} #{re.sub(r'[^a-z]', '', pref.lower())} #{re.sub(r'[^a-z]', '', e['region'].lower())}"
    corps = (f"I gathered {NB_LIEUX} places in Japan on my free 3D map, and there's a new mystery place to find every day: 6 tries. "
             "Link in bio 🗾")
    return (f"Avec le nom du lieu en 1re ligne (demandé par le marketing) :\n\n"
            f"{lieu}, {pref} 🇯🇵 Japan Daily · Day {n}: where in Japan is this? Comment your guess before the answer 👇\n{corps}\n{tags_lieu}\n\n"
            f"---\nSans la réponse (la 1re ligne d'une légende se lit sous la vidéo pendant qu'on devine ; ni le lieu ni sa préfecture,\n"
            f"même en mot-dièse) :\n\n"
            f"Japan Daily · Day {n} 🇯🇵 Where in Japan is this? Comment your guess before the answer 👇\n{corps}\n{tags}\n")


def main():
    jours = [a for a in sys.argv[1:] if a.isdigit()] or list(EPISODES)
    SORTIE.mkdir(parents=True, exist_ok=True)
    (SORTIE / 'tmp').mkdir(exist_ok=True)
    (MONTAGE / 'out').mkdir(exist_ok=True)
    for j in jours:
        e = EPISODES[j]
        comp, nom = f'Day{j}', f'japan-daily-{j}'
        avec, sans = MONTAGE / 'out' / f'{nom}-brut.mp4', MONTAGE / 'out' / f'{nom}-sans-brut.mp4'
        npx('render', comp, str(avec), '--codec=h264', '--crf=12', f'--props={props(j, True)}', *OPTIONS)
        npx('render', comp, str(sans), '--codec=h264', '--crf=12', f'--props={props(j, False)}', *OPTIONS)
        gain = CIBLE - volume(avec)  # la version avec musique fixe le gain ; la version sans prend le même
        finir(avec, SORTIE / f'{nom}.mp4', gain)
        finir(sans, SORTIE / f'{nom}-sans-musique.mp4', gain)
        npx('still', comp, str(SORTIE / f'{nom}-miniature.jpg'), '--frame=0', f'--props={props(j, True)}', '--image-format=jpeg', '--jpeg-quality=92', '--log=error')
        (SORTIE / f'partage-{j}.txt').write_text(legende(e), encoding='utf-8')
        print('→', SORTIE / f'{nom}.mp4', f'(gain {gain:+.1f} dB)', flush=True)


if __name__ == '__main__':
    main()
