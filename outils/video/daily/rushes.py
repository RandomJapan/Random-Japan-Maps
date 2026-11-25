"""Filme la prise de carte de chaque épisode de « Japan Daily » (plans.js : l'indice, puis la plongée sur le lieu) dans la vraie
carte, sur le moteur des vidéos d'Halloween (halloween/rushes.py : Edge sans fenêtre sur le vrai GPU, le temps de la page ralenti,
une capture chaque fois que l'horloge du plan passe une image), à 60 images/s, sur une page de téléphone 432 × 768 à ×2,5
(1080 × 1920). De jour, sans événement (ni Halloween ni Noël : la vidéo doit vivre toute l'année).
    python outils/video/daily/rushes.py               # tous les épisodes de montage/src/episodes.json
    python outils/video/daily/rushes.py 3             # un seul
    python outils/video/daily/rushes.py 3 --brouillon # vite (×0,4, 15 images/s) dans rushes-brouillon/, avec une planche
Il faut le site en local (python -m http.server 8123 --directory site) et preparer.py. Une prise à la fois, rien d'autre sur la
carte graphique pendant ce temps (les vidéos du jeu : deux tournages à la fois s'arrêtaient au chargement de la carte).
"""
import json
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent / 'halloween'))
from rushes import ffmpeg, tourner  # noqa: E402

PUBLIC = ICI.parents[2] / 'videos' / 'carte' / 'daily' / 'public'
EPISODES = json.loads((ICI / 'montage' / 'src' / 'episodes.json').read_text(encoding='utf-8'))
COMMUN = {'scripts': ['daily/plans.js'], 'halloween': False, 'heure': '11:00', 'date': '2026-11-25', 'page': (432, 768), 'echelle': 2.5}


class Navigateur:
    """Le navigateur, dont chaque contexte reçoit l'épisode à tourner (window.__JD) avant le chargement de la page."""

    def __init__(self, nav, jd):
        self.nav, self.jd = nav, jd

    def new_context(self, **options):
        ctx = self.nav.new_context(**options)
        ctx.add_init_script(f'window.__JD = {json.dumps(self.jd, ensure_ascii=False)};')
        return ctx


def main():
    brouillon = '--brouillon' in sys.argv
    sortie = PUBLIC / ('rushes-brouillon' if brouillon else 'rushes')
    jours = [a for a in sys.argv[1:] if a.isdigit()] or list(EPISODES)
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True,
                                 args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        for j in jours:
            e = EPISODES[j]
            nom = f'day-{j}'
            jd = {'plan': nom, 'lng': e['lng'], 'lat': e['lat'], 'codes': e['codes']}
            reglages = {**COMMUN, 'sortie': sortie}
            for essai in (1, 2):  # une prise peut s'arrêter au chargement de la carte : une seconde fois
                try:
                    if brouillon:
                        tourner(Navigateur(nav, jd), nom, reglages, vertical=True, facteur=0.4, ips=15)
                        subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(sortie / f'{nom}.mp4'),
                                        '-vf', 'fps=4,scale=216:384,tile=13x2', '-frames:v', '1', str(sortie / f'{nom}-planche.jpg')], check=True)
                    else:
                        tourner(Navigateur(nav, jd), nom, reglages, vertical=True, ips=60)
                    break
                except Exception as ex:  # noqa: BLE001
                    print(f'{nom} : essai {essai} raté ({ex})', flush=True)
                    if essai == 2:
                        raise
        nav.close()


if __name__ == '__main__':
    sys.exit(main())
