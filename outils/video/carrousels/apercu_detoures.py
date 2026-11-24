"""Planche des personnages détourés sur un fond gris (pour vérifier les bords)."""
import sys
from pathlib import Path
from PIL import Image
D = Path(__file__).resolve().parents[3] / 'videos/carte/carrousels/images/detoures'
noms = sys.argv[1:] or sorted(p.stem for p in D.glob('*.png'))
H = 400
ims = []
for n in noms:
    im = Image.open(D / f'{n}.png')
    ims.append(im.resize((max(1, round(im.width * H / im.height)), H), Image.LANCZOS))
W = sum(i.width for i in ims) + 20 * (len(ims) + 1)
fond = Image.new('RGB', (W, H + 40), (120, 130, 120))
x = 20
for i in ims:
    fond.paste(i, (x, 20), i); x += i.width + 20
fond.save(D.parent / 'apercu-detoures.jpg', quality=90)
print(D.parent / 'apercu-detoures.jpg')
