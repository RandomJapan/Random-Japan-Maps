"""Photographie les images des carrousels (carrousels.html) en JPEG 1080 × 1440, et une planche de chacun.

    python outils/video/carrousels/rendre.py              # les trois
    python outils/video/carrousels/rendre.py balade       # un seul
    python outils/video/carrousels/rendre.py balade 3     # une seule image (la 4e : les numéros partent de 0)

Sortie : videos/carte/carrousels/<carrousel>/<carrousel>-1.jpg … (dans l'ordre de publication), planche-<carrousel>.jpg.
Les polices viennent de Google Fonts (il faut Internet).
"""
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[2]
SORTIE = RACINE / 'videos' / 'carte' / 'carrousels'
NOMS = {'carte': 'carte-japon', 'balade': 'balade-3d', 'jeu': 'devine-le-lieu'}


def main():
    args = [a for a in sys.argv[1:]]
    voulus = [args[0]] if args else list(NOMS)
    seule = int(args[1]) if len(args) > 1 else None
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True)
        p = nav.new_page(viewport={'width': 1080, 'height': 1440}, device_scale_factor=1)
        p.on('console', lambda m: m.type == 'error' and print('console :', m.text))
        for c in voulus:
            dossier = SORTIE / NOMS[c]
            dossier.mkdir(parents=True, exist_ok=True)
            p.goto((ICI / 'carrousels.html').as_uri() + f'?c={c}&n=0')
            total = p.evaluate('window.__nombre')[c]
            faites = []
            for n in range(total):
                if seule is not None and n != seule:
                    continue
                p.goto((ICI / 'carrousels.html').as_uri() + f'?c={c}&n={n}')
                p.wait_for_function('window.__pret === true', timeout=60000)
                p.wait_for_timeout(150)
                f = dossier / f'{NOMS[c]}-{n + 1}.jpg'
                p.screenshot(path=str(f), type='jpeg', quality=95, clip={'x': 0, 'y': 0, 'width': 1080, 'height': 1440})
                faites.append(f)
                print(f.relative_to(RACINE))
            if seule is None:
                ims = [Image.open(f) for f in faites]
                l, h = 360, 480
                planche = Image.new('RGB', (4 * (l + 12) + 12, 2 * (h + 12) + 12), (30, 30, 30))
                for i, im in enumerate(ims):
                    planche.paste(im.resize((l, h), Image.LANCZOS), (12 + (i % 4) * (l + 12), 12 + (i // 4) * (h + 12)))
                planche.save(SORTIE / f'planche-{NOMS[c]}.jpg', quality=88)
        nav.close()


main()
