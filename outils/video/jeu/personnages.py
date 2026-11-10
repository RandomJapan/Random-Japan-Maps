"""Les deux personnages de « noob vs pro » en pixel art (24 × 24), et leurs têtes : écrit montage/src/personnages.json (lu par
Versus.tsx) et un aperçu agrandi (python personnages.py apercu.png).

Le débutant (NOOB) : un bob rouge avec la marque des débutants japonais (初心者マーク, le chevron jaune et vert), un t-shirt blanc à cœur.
Le pro (PRO) : une casquette bleue, des lunettes noires, une veste bleue et une médaille. Chaque tête change les lignes du visage."""
import json
import sys
from pathlib import Path

PALETTE = {
    'k': '#1b1420', 'r': '#e0563f', 'R': '#a8321f', 'y': '#ffd23f', 'g': '#3cb44b', 'w': '#ffffff', 's': '#f7c9a1', 'S': '#e2a57c',
    'h': '#4a3020', 'p': '#f39a9a', 'm': '#8a2a2a', 't': '#7fd0ff', 'b': '#4a8fd6', 'B': '#2c5f99',
}


def visage(interieur):
    """Une ligne du visage : le contour à x 5 et 18, 12 pixels dedans."""
    assert len(interieur) == 12, interieur
    return '.....k' + interieur + 'k.....'


def etroit(interieur):
    """La ligne du menton : le contour à x 6 et 17, 10 pixels dedans."""
    assert len(interieur) == 10, interieur
    return '......k' + interieur + 'k......'


NOOB = [
    '........................',
    '........kkkkkkkk........',
    '......kkrrrrrrrrkk......',
    visage('rrrrrygrrrrr'),
    visage('rrrrrygrrrrr'),
    visage('RRRRRRRRRRRR'),
    '..k' + 'r' * 18 + 'k..',
    '..' + 'k' * 20 + '..',
    visage('hhsssssssshh'),
    visage('hssssssssssh'),
    visage('ssssssssssss'),
    visage('sswksssswkss'),   # 11 : les yeux (un reflet blanc)
    visage('sskksssskkss'),   # 12
    visage('spssssssssps'),   # 13 : les joues
    visage('ssskkkkkksss'),   # 14 : le grand sourire
    visage('ssskwwwwksss'),   # 15
    visage('sssskkkksss' + 's'),  # 16
    etroit('ssssssssss'),     # 17
    '.......' + 'k' * 10 + '.......',
    '........kssssssk........',
    '....kkwwwwkkkkwwwwkk....',
    '...k' + 'wwwwrrwrrwwwwwww' + 'k...',   # le cœur
    '..k' + 'wwwwwrrrrrwwwwwwww' + 'k..',
    '..k' + 'wwwwwwrrrwwwwwwwww' + 'k..',
]

PRO = [
    '........................',
    '........kkkkkkkk........',
    '......kkbbbbbbbbkk......',
    visage('bbbbbwwbbbbb'),
    visage('bbbbbbbbbbbb'),
    visage('BBBBBBBBBBBB'),
    '...k' + 'B' * 16 + 'k...',
    '...' + 'k' * 18 + '...',
    visage('hhsssssssshh'),
    visage('ssssssssssss'),
    visage('kkkkkkkkkkkk'),   # 10 : les lunettes noires
    visage('skwkksskwkks'),   # 11
    visage('skkkksskkkks'),   # 12
    visage('ssssssssskss'),   # 13 : le coin du sourire en coin
    visage('sssskkkkksss'),   # 14
    visage('ssssssssssss'),   # 15
    etroit('ssssssssss'),     # 16
    '.......' + 'k' * 10 + '.......',
    '........kssssssk........',
    '....kkbbbbkwwkbbbbkk....',
    '...kbbbbbbkwwkbbbbbbk...',
    '..kbbbbbbbkwwkbbbbbbbk..',
    '..kbbbbbbbkwwkbbybbbbk..',
    '..kbbbbbbbkwwkbbbbbbbk..',
]

# les têtes : {ligne: nouvelle ligne}
TETES = {
    'noob': {
        'content': {},
        'pleure': {11: visage('sskksssskkss'), 12: visage('ssttssssttss'), 13: visage('ssttssssttss'),
                   14: visage('sstskkkkstss'), 15: visage('ssskmmmmksss'), 16: visage('sssskkkkssss')},
        'choque': {9: visage('hskksssskksh'), 14: visage('sssskkkkssss'), 15: visage('sssskmmkssss'),
                   16: visage('sssskkkkssss')},
        'fier': {11: visage('sskksssskkss'), 12: visage('skssksskssks')},
        # la bouche qui parle (en alternance pendant que le texte s'écrit)
        'parle': {14: visage('sssskkkkssss'), 15: visage('sssskmmkssss'), 16: visage('ssssskksssss')},
    },
    'pro': {
        'cool': {},
        # (les lunettes remontées sur le front, les yeux ronds, la bouche ouverte, une goutte)
        'choque': {8: visage('kkkkkkkkkkkk'), 9: visage('skwkksskwkks'), 10: visage('ssssssssssss'), 11: visage('sswksssskwss'),
                   12: visage('sskksssskkts'), 13: visage('sssskkkkssts'), 14: visage('sssskmmkssss'), 15: visage('sssskkkkssss')},
        'parle': {14: visage('ssssskkkssss'), 15: visage('ssssskmksss' + 's')},
    },
}

SPRITES = {'noob': NOOB, 'pro': PRO}


def verifier():
    for nom, l in SPRITES.items():
        assert len(l) == 24, (nom, len(l))
        for i, ligne in enumerate(l):
            assert len(ligne) == 24, (nom, i, ligne, len(ligne))
            assert all(c == '.' or c in PALETTE for c in ligne), (nom, i, ligne)
    for nom, tetes in TETES.items():
        for t, lignes in tetes.items():
            for i, ligne in lignes.items():
                assert len(ligne) == 24, (nom, t, i, ligne)


def grille(nom, tete):
    l = list(SPRITES[nom])
    for i, ligne in TETES[nom].get(tete, {}).items():
        l[i] = ligne
    return l


if __name__ == '__main__':
    verifier()
    sortie = Path(__file__).parent / 'montage' / 'src' / 'personnages.json'
    sortie.write_text(json.dumps({'palette': PALETTE, 'sprites': SPRITES, 'tetes': {n: {t: {str(i): l for i, l in v.items()} for t, v in d.items()} for n, d in TETES.items()}}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('→', sortie)
    if len(sys.argv) > 1:
        from PIL import Image, ImageDraw
        P = 12
        tetes = [(n, t) for n in TETES for t in TETES[n]]
        im = Image.new('RGB', (len(tetes) * (24 * P + 20) + 20, 24 * P + 40), '#2a2d40')
        d = ImageDraw.Draw(im)
        for j, (n, t) in enumerate(tetes):
            x0 = 20 + j * (24 * P + 20)
            for y, ligne in enumerate(grille(n, t)):
                for x, c in enumerate(ligne):
                    if c != '.':
                        d.rectangle([x0 + x * P, 20 + y * P, x0 + x * P + P - 1, 20 + y * P + P - 1], fill=PALETTE[c])
            d.text((x0, 4), f'{n} {t}', fill='white')
        im.save(sys.argv[1])
        print('→', sys.argv[1])
