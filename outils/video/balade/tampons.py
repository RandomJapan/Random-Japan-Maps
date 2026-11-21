"""Les cinq vrais tampons d'un lieu (carnet.js : dessinTampon), en images transparentes pour les vidéos de la balade, dans
videos/balade/public/ui/tampon-<id>.png : Udo (la vidéo d'Udo et Yakushima), Iiyama (celle de la fête de la neige, 2026-11-21).

    python outils/video/balade/tampons.py [--port 8123] [--lieu udo|iiyama]

Il faut le site en local (python -m http.server 8123 --directory site), Microsoft Edge et Playwright.
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

RACINE = Path(__file__).resolve().parents[3]
SORTIE = RACINE / 'videos' / 'balade' / 'public' / 'ui'
PORT = sys.argv[sys.argv.index('--port') + 1] if '--port' in sys.argv else '8123'
LIEU = sys.argv[sys.argv.index('--lieu') + 1] if '--lieu' in sys.argv else 'udo'
# (udo.js, iiyama.js : les tampons du lieu, et son nom japonais, autour du tampon)
UDO = [
    {'id': 'ema', 'motif': 'emaLapin', 'ja': '兎の絵馬', 'encre': '#c0392b', 'forme': 'carre'},
    {'id': 'inari', 'motif': 'toriiEscalier', 'ja': '鵜戸稲荷', 'encre': '#b8422b'},
    {'id': 'usagi', 'motif': 'usagi', 'ja': '撫でうさぎ', 'encre': '#6a5a8a'},
    {'id': 'ochichi', 'motif': 'ochichi', 'ja': 'お乳岩', 'encre': '#3a6a7a', 'forme': 'carre'},
    {'id': 'undama', 'motif': 'kameishi', 'ja': '運玉', 'encre': '#8a5a2a'},
]
IIYAMA = [
    {'id': 'yukizo', 'motif': 'yukizo', 'ja': '雪像', 'encre': '#3a6ea8'},
    {'id': 'slider', 'motif': 'bouee', 'ja': 'スノースライダー', 'encre': '#c0392b', 'forme': 'carre'},
    {'id': 'toro', 'motif': 'toro', 'ja': '雪灯ろう', 'encre': '#d98a1f'},
    {'id': 'nabe', 'motif': 'nabe', 'ja': 'のろし鍋', 'encre': '#8a4a2a', 'forme': 'carre'},
    {'id': 'jinja', 'motif': 'kamakura', 'ja': 'かまくら神社', 'encre': '#b8322a'},
]
TAMPONS, NOM_JA = (IIYAMA, 'いいやま雪まつり') if LIEU == 'iiyama' else (UDO, '鵜戸神宮')


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True)
        p = nav.new_page(viewport={'width': 400, 'height': 400}, device_scale_factor=2)
        p.on('pageerror', lambda e: print('erreur page :', e))
        p.goto(f'http://localhost:{PORT}/balade/textes.js')
        for t in TAMPONS:
            html = p.evaluate("""async ([t, ja]) => { const { dessinTampon } = await import('/balade/carnet.js'); return dessinTampon(t, ja, 360); }""", [t, NOM_JA])
            p.evaluate("""(html) => { document.documentElement.innerHTML = `<body style="margin:0;background:transparent;font-family:'Yu Gothic','Meiryo',sans-serif">${html}</body>`; }""", html)
            p.locator('svg').screenshot(path=str(SORTIE / f'tampon-{t["id"]}.png'), omit_background=True)
            print('tampon-' + t['id'], flush=True)
        nav.close()


if __name__ == '__main__':
    main()
