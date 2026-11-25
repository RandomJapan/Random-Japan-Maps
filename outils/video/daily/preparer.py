"""Prépare les épisodes de « Japan Daily » (episodes.py) pour le montage (montage/, Remotion) : les fiches des lieux
(le Sheet de secours, site/data/secours-lieux.csv : nom, coordonnées, catégorie ; la préfecture et la région par les contours
de site/data/prefectures.geojson, comme regions.js), les plans du propriétaire coupés (l'énigme : 3 s ; le plus beau plan), les
bruitages repris des vidéos du jeu et le logo. Tout va dans videos/carte/daily/public (hors de git), et la liste des épisodes
dans montage/src/episodes.json (lu par le montage, rushes.py et finir.py).
    python outils/video/daily/preparer.py          # tous les épisodes
    python outils/video/daily/preparer.py 6        # un seul
La musique et les bruitages composés : musique.py.
"""
import csv
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[2]
sys.path.insert(0, str(ICI))
from episodes import EPISODES  # noqa: E402

PUBLIC = RACINE / 'videos' / 'carte' / 'daily' / 'public'
LIEUX = RACINE / 'site' / 'data' / 'secours-lieux.csv'
CONTOURS = RACINE / 'site' / 'data' / 'prefectures.geojson'
VIDEOS_LIEUX = Path(os.environ.get('VIDEOS_LIEUX', r'D:\Vidéos\Tik Tok\Vidéo lieux random japon'))
JEU = RACINE / 'videos' / 'carte' / 'jeu' / 'public'
SFX = ['air-whoosh-powerful.mp3', 'impact-deep-whoosh.mp3', 'swoosh-quick.mp3', 'transition-snap.mp3', 'click-camera.mp3',
       'hit-fast-exciting.mp3', 'ui-success-soft.mp3', 'ui-message-pop.mp3', 'sparkle-touch.mp3', 'shimmer-sparkle-sweep.mp3',
       'pop.mp3', 'tap.mp3']
ENIGME = 3.0  # s : l'énigme dure 6 temps à 120
BEAU = 2.5  # s : le plus beau plan, 5 temps

# regions.js : les préfectures (numéros JIS) de chaque région, et son nom à l'écran (Okinawa à part : l'indice « Kyushu » ne
# colore que les sept préfectures de Kyūshū)
PREFECTURES = {1: 'Hokkaido', 2: 'Aomori', 3: 'Iwate', 4: 'Miyagi', 5: 'Akita', 6: 'Yamagata', 7: 'Fukushima', 8: 'Ibaraki',
               9: 'Tochigi', 10: 'Gunma', 11: 'Saitama', 12: 'Chiba', 13: 'Tokyo', 14: 'Kanagawa', 15: 'Niigata', 16: 'Toyama',
               17: 'Ishikawa', 18: 'Fukui', 19: 'Yamanashi', 20: 'Nagano', 21: 'Gifu', 22: 'Shizuoka', 23: 'Aichi', 24: 'Mie',
               25: 'Shiga', 26: 'Kyoto', 27: 'Osaka', 28: 'Hyogo', 29: 'Nara', 30: 'Wakayama', 31: 'Tottori', 32: 'Shimane',
               33: 'Okayama', 34: 'Hiroshima', 35: 'Yamaguchi', 36: 'Tokushima', 37: 'Kagawa', 38: 'Ehime', 39: 'Kochi',
               40: 'Fukuoka', 41: 'Saga', 42: 'Nagasaki', 43: 'Kumamoto', 44: 'Oita', 45: 'Miyazaki', 46: 'Kagoshima', 47: 'Okinawa'}
REGIONS = [('HOKKAIDO', [1]), ('TOHOKU', [2, 3, 4, 5, 6, 7]), ('KANTO', [8, 9, 10, 11, 12, 13, 14]),
           ('CHUBU', [15, 16, 17, 18, 19, 20, 21, 22, 23]), ('KANSAI', [24, 25, 26, 27, 28, 29, 30]), ('CHUGOKU', [31, 32, 33, 34, 35]),
           ('SHIKOKU', [36, 37, 38, 39]), ('KYUSHU', [40, 41, 42, 43, 44, 45, 46]), ('OKINAWA', [47])]


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def dans(x, y, anneau):
    dedans = False
    j = len(anneau) - 1
    for i in range(len(anneau)):
        (xi, yi), (xj, yj) = anneau[i], anneau[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            dedans = not dedans
        j = i
    return dedans


def prefecture(lng, lat):
    """Le numéro de la préfecture du point (le plus proche sommet de contour s'il tombe en mer, comme regions.js)."""
    geo = json.loads(CONTOURS.read_text(encoding='utf-8'))
    proche, dmin = None, 1e9
    for f in geo['features']:
        for poly in f['geometry']['coordinates']:
            if dans(lng, lat, poly[0]) and not any(dans(lng, lat, t) for t in poly[1:]):
                return f['properties']['code']
            for x, y in poly[0]:
                d = (x - lng) ** 2 + (y - lat) ** 2
                if d < dmin:
                    proche, dmin = f['properties']['code'], d
    return proche


def fiche(nom):
    for l in csv.DictReader(open(LIEUX, encoding='utf-8')):
        if l['Nom (EN)'].strip() == nom:
            lat, lng = (float(v) for v in l['Coordonnées GPS'].split(','))
            code = prefecture(lng, lat)
            region, codes = next((r, c) for r, c in REGIONS if code in c)
            return {'lieu': nom, 'japonais': l['Nom (日本語)'], 'categorie': l['Catégorie'], 'lng': lng, 'lat': lat,
                    'code': code, 'prefecture': PREFECTURES[code], 'region': region, 'codes': codes,
                    'video': (re.search(r'/video/(\d+)', l['Lien TikTok']) or [None, ''])[1]}
    raise SystemExit(f'{nom} : pas dans {LIEUX.name}')


def couper(source, debut, duree, sortie, cadre=None):
    """Un plan de la vidéo du lieu : 1080 × 1920, 60 images/s, sans le son, une image clé toutes les 15 (le montage s'y place vite)."""
    z, x, y = cadre or (1, 0.5, 0.5)
    vf = 'scale=1080:1920:flags=lanczos'
    if z != 1:
        l, h = round(1080 / z / 2) * 2, round(1920 / z / 2) * 2
        vf += f',crop={l}:{h}:{round((1080 - l) * x)}:{round((1920 - h) * y)},scale=1080:1920:flags=lanczos'
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', f'{debut:.3f}', '-i', str(source), '-t', f'{duree + 0.1:.3f}',
                    '-vf', vf + ',fps=60,format=yuv420p', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-g', '15',
                    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', str(sortie)], check=True)


def main():
    choix = [int(a) for a in sys.argv[1:] if a.isdigit()] or list(EPISODES)
    liste = ICI / 'montage' / 'src' / 'episodes.json'
    tous = json.loads(liste.read_text(encoding='utf-8')) if liste.exists() else {}
    for n in choix:
        e = EPISODES[n]
        f = fiche(e['lieu'])
        dossier = PUBLIC / 'ep' / str(n)
        dossier.mkdir(parents=True, exist_ok=True)
        source = VIDEOS_LIEUX / e['fichier']
        couper(source, e['enigme'], ENIGME, dossier / 'enigme.mp4', e.get('cadre'))
        b0, bd = e['beau']
        couper(source, b0, bd, dossier / 'beau.mp4', e.get('cadre_beau', e.get('cadre')))
        tous[str(n)] = {**f, 'jour': n, 'affiche': e['affiche'], 'vitesseBeau': round(bd / BEAU, 4)}
        print(f"jour {n} : {f['lieu']} · {f['prefecture']} ({f['region']})", flush=True)
    liste.write_text(json.dumps(dict(sorted(tous.items(), key=lambda kv: int(kv[0]))), ensure_ascii=False, indent=1), encoding='utf-8')
    (PUBLIC / 'sfx').mkdir(parents=True, exist_ok=True)
    (PUBLIC / 'ui').mkdir(parents=True, exist_ok=True)
    for s in SFX:
        shutil.copy2(JEU / 'sfx' / s, PUBLIC / 'sfx' / s)
    shutil.copy2(JEU / 'ui' / 'logo.jpg', PUBLIC / 'ui' / 'logo.jpg')
    print('→', liste)


if __name__ == '__main__':
    main()
