"""Planches de repérage : quelques images de chaque prise déjà tournée, pour choisir les images des carrousels.

    python outils/video/carrousels/planches.py balade it-torii kk-reflet …   # → videos/carte/carrousels/reperage/balade-1.jpg …
"""
import json, subprocess, sys
from pathlib import Path

RACINE = Path(__file__).resolve().parents[3]
DOSSIERS = {
    'balade': RACINE / 'videos/balade/public/rushes',
    'promo': RACINE / 'videos/carte/promo30/public/rushes-v',
    'tunnel': RACINE / 'videos/carte/tunnel/public/rushes',
    'jeu': RACINE / 'videos/carte/jeu/public/rushes',
    'reels': RACINE / 'videos/carte/jeu/public/reels',
    'noel': RACINE / 'videos/carte/calendrier/public/rushes',
}
SORTIE = RACINE / 'videos/carte/carrousels/reperage'
N = 6  # images par prise


def duree(f):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', str(f)],
                                capture_output=True, text=True).stdout and json.loads(subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', str(f)], capture_output=True, text=True).stdout)['format']['duration'])


def main():
    source, prises = sys.argv[1], sys.argv[2:]
    SORTIE.mkdir(parents=True, exist_ok=True)
    tmp = SORTIE / 'tmp'
    tmp.mkdir(exist_ok=True)
    lignes = []
    for p in prises:
        f = DOSSIERS[source] / f'{p}.mp4'
        if not f.exists():
            cands = sorted(DOSSIERS[source].glob(f'{p}-*.mp4'))
            if not cands:
                print('absent', p); continue
            f = cands[0]
        d = duree(f)
        imgs = []
        for i in range(N):
            t = d * (i + 0.5) / N
            o = tmp / f'{f.stem}-{i}.jpg'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', str(f), '-frames:v', '1', '-vf',
                            'scale=180:-2', str(o)])
            imgs.append(o)
        lignes.append(imgs)
        print(len(lignes), f.stem, ' '.join(f'{d*(i+0.5)/N:.1f}' for i in range(N)))
    # par paquets de 8 prises
    for k in range(0, len(lignes), 8):
        paquet = lignes[k:k + 8]
        entrees, filtres = [], []
        for r, imgs in enumerate(paquet):
            for i, im in enumerate(imgs):
                entrees += ['-i', str(im)]
        n = sum(len(x) for x in paquet)
        disp = '|'.join(f'{i*180}_{r*320}' for r, imgs in enumerate(paquet) for i in range(len(imgs)))
        sortie = SORTIE / f'{source}-{k // 8 + 1}.jpg'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', *entrees, '-filter_complex', f'xstack=inputs={n}:layout={disp}:fill=black', '-q:v', '3', str(sortie)])
        print(sortie)


main()
