"""Les dessins des étapes de la grue pour la vidéo tutoriel : les mêmes que la page 3 (étapes 1 à 12) et la page 4 (9a à 9f)
de origami-{l}.pdf (case 9 du calendrier de l'Avent). origami/origami.html est la page qui a fabriqué ce PDF (copiée de l'atelier
du calendrier, 2026-11-23) : ses dessins sont calculés en SVG. Edge sans fenêtre l'ouvre et photographie chaque dessin, sans son
texte, à ×4, en PNG dans videos/carte/calendrier/public/grue/ (etape-01.png … etape-12.png, detail-9a.png … detail-9f.png).
    python outils/video/calendrier/diagrammes.py
"""
import mimetypes
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
ORIGAMI = ICI / 'origami'
SORTIE = ICI.parents[2] / 'videos' / 'carte' / 'calendrier' / 'public' / 'grue'


def servir(route):
    """La page attend /atelier/commun.css et ses voisins : on les sert depuis origami/ (le logo du pied manque : sans importance)."""
    nom = route.request.url.split('?')[0].rsplit('/', 1)[-1]
    f = ORIGAMI / nom
    if f.exists():
        route.fulfill(path=str(f), content_type=mimetypes.guess_type(nom)[0] or 'text/html')
    else:
        route.fulfill(status=404, body='')


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True)
        p = nav.new_page(viewport={'width': 900, 'height': 1200}, device_scale_factor=4)
        p.route('http://atelier.local/**', servir)
        p.goto('http://atelier.local/atelier/origami.html?lang=en')
        p.wait_for_function("document.querySelectorAll('#d-etapes .etape svg').length === 6")
        p.evaluate('document.fonts.ready')
        p.wait_for_timeout(800)
        # le fond du dessin : le papier clair, sans son cadre (la vidéo met le sien)
        p.add_style_tag(content='.etape svg { border: 0 !important; }')
        for i, el in enumerate(p.query_selector_all('#etapes .etape svg')):
            el.screenshot(path=str(SORTIE / f'etape-{i + 1:02d}.png'))
        for i, el in enumerate(p.query_selector_all('#d-etapes .etape svg')):
            el.screenshot(path=str(SORTIE / f'detail-9{"abcdef"[i]}.png'))
        # la légende des plis (vallée, montagne, retourner)
        p.query_selector('#legende').screenshot(path=str(SORTIE / 'legende.png'))
        nav.close()
    print('→', SORTIE)


if __name__ == '__main__':
    main()
