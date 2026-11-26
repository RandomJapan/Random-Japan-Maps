"""Fabrique les intros « captcha » des vidéos de lieux (2026-11-26) : le propriétaire perdait 2 spectateurs sur 3 avant 3 s (la
vieille carte et le plongeon : le lieu arrivait trop tard). Ses prochaines vidéos commencent par un captcha du lieu, qu'on reconstruit
et qui s'affiche ensuite en grand ; il les pose lui-même au début de ses montages dans DaVinci Resolve.

    python outils/video/captcha/fabriquer.py             # tous les lieux de videos/intros captcha/lieux.txt
    python outils/video/captcha/fabriquer.py --refaire   # même ceux qui sont déjà faits
    (ou un double-clic sur « Fabriquer les intros.bat », dans ce dossier)

Le dossier de travail (videos/intros captcha, hors de git) : lieux.txt (une ligne par lieu : plan ; nom ; préfecture ; accroche ;
style), plans/ (les images ou les courts plans du propriétaire), intros/ (ce que l'outil fabrique, un dossier par lieu), _atelier/
(ses fichiers de travail, le dossier public du montage). Il n'écrit jamais ailleurs, surtout pas dans le dossier des montages
(PROTEGES) : il y lit au plus un plan.

Pour chaque lieu : l'intro (1,8 s, 1080 × 1920, à la cadence du plan : 30 ou 60 images/s ; avec les sons et sans), le nom et la
préfecture sur fond transparent (ProRes 4444, et une image PNG), l'écran de fin en option (la carte, l'épingle, l'adresse) et un
aperçu (l'intro, le plan avec le nom, la fin). La dernière image de l'intro est exactement l'image 0 du plan : elle est tirée du plan
par ffmpeg (sa matrice de couleurs : BT.709 quand elle n'est pas dite, comme DaVinci pour la HD), et l'intro est encodée en BT.709.
Le nom, la préfecture et la catégorie viennent du Sheet de secours (site/data/secours-lieux.csv) quand le nom y est ; l'accroche
proposée dépend de la catégorie (ou des mots du nom), le style est tiré au hasard (le même à chaque fois pour un lieu).
Il faut Node (le montage Remotion de montage/, npm install), ffmpeg, Python avec numpy et Pillow ; pour l'écran de fin, Edge et
Playwright (le moteur des vidéos d'Halloween, halloween/rushes.py, qui filme la vraie carte servie ici même).
"""
import csv
import functools
import hashlib
import http.server
import json
import os
import random
import re
import shutil
import subprocess
import sys
import threading
import unicodedata
from fractions import Fraction
from pathlib import Path

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[2]
MONTAGE = ICI / 'montage'
TRAVAIL = RACINE / 'videos' / 'intros captcha'
ATELIER = TRAVAIL / '_atelier'
PUBLIC = ATELIER / 'public'  # le dossier public du montage : refait à chaque fois avec les fichiers des lieux du moment
SORTIE = TRAVAIL / 'intros'
PLANS = TRAVAIL / 'plans'
LISTE = TRAVAIL / 'lieux.txt'
LIEUX = RACINE / 'site' / 'data' / 'secours-lieux.csv'
# les dossiers du propriétaire où l'outil n'écrit jamais rien
PROTEGES = [Path(r'D:\Vidéos\Tik Tok\Vidéo lieux random japon'), Path(r'D:\Montage')]
VERSION = 1  # à changer quand l'allure des intros change : tout se refait
IMAGES = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff'}
VIDEOS = {'.mp4', '.mov', '.m4v', '.mkv', '.avi', '.mts'}
CADENCES = [Fraction(24000, 1001), Fraction(24), Fraction(25), Fraction(30000, 1001), Fraction(30), Fraction(50),
            Fraction(60000, 1001), Fraction(60)]

W, H = 1080, 1920
DUREE = 1.80  # s
VERIFIE = 1.16
GRANDIT = (1.38, 1.76)
DUREE_NOM = 3.0
DUREE_FIN = 2.0

sys.path.insert(0, str(ICI))
sys.path.insert(0, str(ICI.parent / 'daily'))
import sons  # noqa: E402
from preparer import PREFECTURES, prefecture  # noqa: E402  (la préfecture d'un point, par les contours de la carte)

# ---------------------------------------------------------------- les accroches proposées
# la catégorie du Sheet → (grille : « Select all squares with … », puzzle : « Rebuild this … in Japan ») ; None : l'accroche générale
OBJETS = {
    'Shrines': ('a torii', 'shrine'), 'Temples': ('a temple', 'temple'), 'Waterfalls': ('a waterfall', 'waterfall'),
    'Castles': ('a castle', 'castle'), 'Lakes & Ponds': ('a lake', 'lake'), 'Mountains': ('a mountain', 'mountain'),
    'Bridges': ('a bridge', 'bridge'), 'Statues': ('a giant statue', 'statue'), 'Villages': ('a village', 'village'),
    'Flowers': ('flowers', None), 'Gardens': ('a garden', 'garden'), 'Onsen': ('a hot spring', 'hot spring'),
    'Coast & Beaches': ('the sea', 'coast'), 'Islands': ('an island', 'island'), 'Viewpoints': (None, 'view'),
    'Trains & Railways': ('a train', 'station'), 'Capes & Lighthouses': ('a lighthouse', 'cape'), 'Churches': ('a church', 'church'),
    'Festivals': (None, 'festival'),
}
# les mots du nom, plus précis que la catégorie (Aogashima est « Mountains » dans le Sheet, mais c'est une île)
MOTS = [(r'shrine|jinja|jing[uū]|taisha|inari|\bg[uū]\b', 'Shrines'), (r'temple|dera\b|-ji\b|\bji\b', 'Temples'),
        (r'falls|waterfall|\btaki\b', 'Waterfalls'), (r'castle', 'Castles'), (r'lake|pond', 'Lakes & Ponds'),
        (r'bridge|hashi\b', 'Bridges'), (r'onsen', 'Onsen'), (r'island|shima\b|jima\b', 'Islands'), (r'church', 'Churches'),
        (r'village|juku\b', 'Villages'), (r'coast|beach', 'Coast & Beaches'), (r'garden', 'Gardens'),
        (r'station|railway', 'Trains & Railways'), (r'\bmount|yama\b|dake\b', 'Mountains')]
GENERALE = 'Rebuild this place in Japan'


def accroche_proposee(style, categorie, nom):
    cat = next((c for motif, c in MOTS if re.search(motif, nom, re.I)), None) or categorie
    grille, puzzle = OBJETS.get(cat, (None, None))
    if cat == 'Lakes & Ponds' and re.search(r'pond', nom, re.I):
        grille, puzzle = 'a pond', 'pond'
    if style == 'grille':
        return f'Select all squares with {grille}' if grille else GENERALE
    return f'Rebuild this {puzzle} in Japan' if puzzle else GENERALE


# ---------------------------------------------------------------- petits outils
def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def ffprobe():
    return shutil.which('ffprobe') or str(Path(ffmpeg()).with_name('ffprobe.exe'))


def lancer(commande, **options):
    return subprocess.run([str(c) for c in commande], check=True, **options)


def normal(texte):
    t = unicodedata.normalize('NFKD', texte).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]', '', t)


def propre(nom):
    """Un nom de dossier ou de fichier Windows."""
    return re.sub(r'[\\/:*?"<>|]', '', nom).strip().rstrip('.') or 'lieu'


def verifier_sortie(chemin):
    chemin = Path(chemin).resolve()
    for p in PROTEGES:
        if chemin.is_relative_to(p):
            raise SystemExit(f"L'outil allait écrire dans {p} : arrêté (il n'écrit jamais dans le dossier des montages).")
    return chemin


def secondes(texte):
    """« 12.5 », « 12,5 », « 0:12.5 » ou « 1:02:03 » → secondes."""
    t = 0.0
    for part in texte.strip().replace(',', '.').split(':'):
        t = t * 60 + float(part or 0)
    return t


# ---------------------------------------------------------------- la liste du propriétaire
def lire_liste():
    brut = LISTE.read_bytes()
    try:
        texte = brut.decode('utf-8-sig')
    except UnicodeDecodeError:
        texte = brut.decode('cp1252')  # le Bloc-notes en « ANSI »
    reglages, lieux = {'cadence': Fraction(30), 'fin': True}, []
    for n, brute in enumerate(texte.splitlines(), 1):
        ligne = brute.strip()
        if not ligne or ligne.startswith('#'):
            continue
        m = re.match(r'(?i)^(cadence[^:;]*|[ée]cran de fin)\s*:\s*(.+)$', ligne)
        if m:
            cle, val = m.group(1).lower(), m.group(2).strip().lower()
            if cle.startswith('cadence'):
                reglages['cadence'] = Fraction(val.replace(',', '.')).limit_denominator(1001)
            else:
                reglages['fin'] = val.startswith(('oui', 'yes', 'o', '1'))
            continue
        champs = [c.strip() for c in ligne.split(';')] + [''] * 6
        lieux.append({'ligne': n, 'texte': ligne, 'plan': champs[0], 'nom': champs[1], 'prefecture': champs[2],
                      'accroche': champs[3], 'style': champs[4].lower(), 'cadrage': champs[5].lower()})
    return reglages, lieux


def trouver_plan(texte):
    debut = 0.0
    if '@' in texte:
        texte, t = texte.rsplit('@', 1)
        debut = secondes(t)
    texte = texte.strip().strip('"')
    for c in (Path(texte), PLANS / texte, TRAVAIL / texte):
        if c.is_file():
            return c, debut
    for d in (PLANS, TRAVAIL):  # sans l'extension
        for c in sorted(d.glob('*')):
            if c.stem.lower() == texte.lower() and c.suffix.lower() in IMAGES | VIDEOS:
                return c, debut
    return None, debut


def fiches():
    sheet = {}
    for l in csv.DictReader(open(LIEUX, encoding='utf-8')):
        nom = l['Nom (EN)'].strip()
        if nom and l['Coordonnées GPS'].strip():
            sheet[normal(nom)] = l
    return sheet


def fiche(sheet, nom):
    """La ligne du Sheet de ce lieu : le même nom (sans accents ni espaces), sinon un nom qui contient l'autre."""
    n = normal(nom)
    if n in sheet:
        return sheet[n]
    proches = [l for k, l in sheet.items() if len(n) >= 5 and (n in k or k in n)]
    return proches[0] if len(proches) == 1 else None


def sonder(f):
    sortie = subprocess.run([ffprobe(), '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                             'stream=width,height,r_frame_rate,avg_frame_rate,color_space,color_transfer,color_range',
                             '-of', 'json', str(f)], capture_output=True, text=True, encoding='utf-8')
    s = (json.loads(sortie.stdout or '{}').get('streams') or [{}])[0]
    return s


def cadence(s, defaut):
    """La cadence du plan, ramenée à la cadence standard la plus proche (les téléphones donnent parfois 59,94 ou 29,98)."""
    try:
        r = Fraction(s.get('r_frame_rate', '0/1'))
        if not 10 <= r <= 121:
            r = Fraction(s.get('avg_frame_rate', '0/1'))
    except (ValueError, ZeroDivisionError):
        return defaut
    if not r:
        return defaut
    proche = min(CADENCES, key=lambda c: abs(float(c) - float(r)))
    return proche if abs(float(proche) - float(r)) / float(r) < 0.01 else r.limit_denominator(1001)


def texte_cadence(c):
    return str(c.numerator) if c.denominator == 1 else f'{c.numerator}/{c.denominator}'


def image0(plan, debut, s, sortie):
    """L'image du plan où l'intro doit finir, en 1080 × 1920 (remplie : rognée sur les côtés si besoin, comme « Remplir »)."""
    if plan.suffix.lower() in IMAGES:
        from PIL import Image, ImageOps
        im = ImageOps.exif_transpose(Image.open(plan)).convert('RGB')
        k = max(W / im.width, H / im.height)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        x, y = (im.width - W) // 2, (im.height - H) // 2
        im.crop((x, y, x + W, y + H)).save(sortie)
        return
    matrice = {'bt709': 'bt709', 'smpte170m': 'bt601', 'bt470bg': 'bt601', 'smpte240m': 'smpte240m',
               'bt2020nc': 'bt2020', 'bt2020c': 'bt2020'}.get(s.get('color_space'), 'bt709')
    plage = 'pc' if s.get('color_range') == 'pc' else 'tv'
    vf = (f'scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos+accurate_rnd+full_chroma_int'
          f':in_color_matrix={matrice}:in_range={plage},crop={W}:{H},format=rgb24'
          # sans dire « BT.709 » dans le PNG (cICP, gAMA) : Chrome convertirait ses couleurs, et l'intro finirait plus sombre
          ',setparams=color_primaries=unknown:color_trc=unknown:colorspace=unknown:range=pc')
    lancer([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', f'{debut:.3f}', '-i', plan, '-frames:v', '1', '-vf', vf, sortie])


# ---------------------------------------------------------------- la mise en place
def calendrier(n=3, debut=0.08, fin=1.10, approche=0.11, appui=0.05, lache=0.04):
    """Les gestes du doigt : pour chacun, (appuie, part, pose, lâche), en secondes."""
    glisse = (fin - debut - (n - 1) * approche - n * (appui + lache)) / n
    t, gestes = debut, []
    for i in range(n):
        if i:
            t += approche
        tp = t
        t0 = tp + appui
        t1 = t0 + glisse
        tr = t1 + lache
        gestes.append((tp, t0, t1, tr))
        t = tr
    return gestes


def geste(points, gestes):
    """Le chemin du doigt : points[i] = (de, à) à l'écran pour le geste i."""
    cles, appuis = [], []
    for (a, b), (tp, t0, t1, tr) in zip(points, gestes):
        cles += [{'t': tp, 'x': a[0], 'y': a[1]}, {'t': t0, 'x': a[0], 'y': a[1]},
                 {'t': t1, 'x': b[0], 'y': b[1]}, {'t': tr, 'x': b[0], 'y': b[1]}]
        appuis.append([tp, tr])
    return {'cles': cles, 'appuis': appuis, 'apparait': gestes[0][0] - 0.03, 'disparait': gestes[-1][3] + 0.05}


# la 6e colonne de lieux.txt : quelle partie de l'image va dans la fenêtre du captcha (toute la largeur, une bande de la hauteur)
DECALAGES = {'haut': -1.0, 'milieu': 0.0, 'bas': 1.0, 'top': -1.0, 'bottom': 1.0}


def recadrage(zone, decalage=0.0):
    """La partie de l'image 0 qui va dans la zone (toute sa largeur ; au milieu, ou décalée vers le haut ou le bas)."""
    h = zone['h'] * W / zone['w']
    y = (H - h) / 2 + decalage * (H - h) / 2
    return {'x': 0, 'y': round(y, 2), 'w': W, 'h': round(h, 2)}


def disposition_grille(rng, gestes):
    fen = {'x': 48, 'y': 216, 'w': 924, 'h': 1202}
    zone = {'x': 80, 'y': 438, 'w': 860, 'h': 860}
    n = 4
    c = zone['w'] / n
    # trois échanges de deux cases, assez loin l'une de l'autre pour que le geste se voie
    for _ in range(500):
        cases = list(range(n * n))
        rng.shuffle(cases)
        paires = []
        while len(paires) < 3 and len(cases) >= 2:
            a = cases.pop()
            loin = [b for b in cases if max(abs(a % n - b % n), abs(a // n - b // n)) >= 2]
            if not loin:
                continue
            b = rng.choice(loin)
            cases.remove(b)
            paires.append((a, b))
        if len(paires) == 3:
            break
    centre = lambda m: (zone['x'] + (m % n + 0.5) * c, zone['y'] + (m // n + 0.5) * c)
    echanges = [{'a': a, 'b': b, 't0': g[1], 't1': g[2]} for (a, b), g in zip(paires, gestes)]
    points = [(centre(a), centre(b)) for a, b in paires]
    return {'fenetre': fen, 'zone': zone, 'n': n, 'echanges': echanges}, points


def disposition_puzzle(rng, gestes):
    """Trois trous et trois pièces, dans une grille de 3 × 3 places (une pièce et sa boîte de tenons tiennent dans une place) :
    la dernière pièce part de la place de gauche d'une ligne et glisse avec le curseur jusqu'à son trou, à droite sur la même
    ligne ; les deux autres trous et les deux autres pièces prennent des places libres des autres lignes, chaque pièce loin du sien."""
    fen = {'x': 48, 'y': 210, 'w': 924, 'h': 1198}
    zone = {'x': 84, 'y': 422, 'w': 852, 'h': 760}
    curseur = {'x': zone['x'], 'y': zone['y'] + zone['h'] + 26, 'w': zone['w'], 'h': 96}
    s = 150
    m = round(s * 0.3)
    pl, ph = zone['w'] / 3, zone['h'] / 3
    jeu_x, jeu_y = (pl - s - 2 * m) / 2, (ph - s - 2 * m) / 2

    def place(col, rang):
        return (col * pl + pl / 2 - s / 2 + rng.uniform(-jeu_x, jeu_x) * 0.8,
                rang * ph + ph / 2 - s / 2 + rng.uniform(-jeu_y, jeu_y) * 0.8)

    ligne = rng.randrange(3)
    libres = [(c, r) for r in range(3) for c in range(3) if r != ligne]
    rng.shuffle(libres)
    for _ in range(200):
        rng.shuffle(libres)
        trous, departs = libres[:2], libres[2:4]
        # chaque pièce à au moins deux places de son trou (le geste se voit)
        if all(abs(a[0] - b[0]) + abs(a[1] - b[1]) >= 2 for a, b in zip(trous, departs)):
            break
    tenons = lambda: [rng.choice([-1, 1]) for _ in range(4)]
    pieces = []
    for h, p, g in zip(trous, departs, gestes[:2]):
        (hx, hy), (px, py) = place(*h), place(*p)
        pieces.append({'hx': hx, 'hy': hy, 'px': px, 'py': py, 'bords': tenons(), 't0': g[1], 't1': g[2], 'curseur': False})
    hx, hy = place(2, ligne)
    px = m + 6
    pieces.append({'hx': hx, 'hy': hy, 'px': px, 'py': hy, 'bords': tenons(), 't0': gestes[2][1], 't1': gestes[2][2], 'curseur': True})
    a_l_ecran = lambda x, y: (zone['x'] + x + s / 2, zone['y'] + y + s / 2)
    points = [(a_l_ecran(pc['px'], pc['py']), a_l_ecran(pc['hx'], pc['hy'])) for pc in pieces[:2]]
    poignee = (curseur['x'] + 75, curseur['y'] + curseur['h'] / 2)
    points.append((poignee, (poignee[0] + hx - px, poignee[1])))
    code = ''.join(rng.choice('0123456789ABCDEF') for _ in range(32))
    return {'fenetre': fen, 'zone': zone, 'curseur': curseur, 'cote': s, 'pieces': pieces, 'code': code}, points


def disposition_rond(rng, gestes):
    """Le rond (comme « Drag the slider to fit the puzzle ») : l'image dans un rond de 720 px au milieu de la place de l'image, son
    milieu (62 % du diamètre) tourné de 110 à 230° dans le sens inverse des aiguilles d'une montre ; le curseur le remet droit
    (tout le curseur = un tour). Le doigt le tire en trois fois : à 52 %, trop loin (112 %), puis il corrige (100 %)."""
    fen = {'x': 48, 'y': 210, 'w': 924, 'h': 1198}
    bloc = {'x': 84, 'y': 422, 'w': 852, 'h': 760}
    d = 720
    zone = {'x': bloc['x'] + (bloc['w'] - d) / 2, 'y': bloc['y'] + (bloc['h'] - d) / 2, 'w': d, 'h': d}
    curseur = {'x': bloc['x'], 'y': bloc['y'] + bloc['h'] + 26, 'w': bloc['w'], 'h': 96}
    angle0 = -rng.uniform(110, 230)
    course = abs(angle0) / 360 * (curseur['w'] - 150)
    reperes = [0, 0.52, 1.12, 1.0]
    etapes = [{'t0': g[1], 't1': g[2], 'de': reperes[i], 'a': reperes[i + 1]} for i, g in enumerate(gestes)]
    x = lambda q: curseur['x'] + 75 + course * q
    y = curseur['y'] + curseur['h'] / 2
    points = [((x(e['de']), y), (x(e['a']), y)) for e in etapes]
    code = ''.join(rng.choice('0123456789ABCDEF') for _ in range(32))
    return {'fenetre': fen, 'bloc': bloc, 'zone': zone, 'curseur': curseur, 'code': code,
            'rond': {'angle0': angle0, 'interieur': 0.62, 'course': course, 'etapes': etapes}}, points


def props_intro(lieu, fps, image):
    rng = random.Random(lieu['graine'])
    gestes = calendrier()
    if lieu['style'] == 'grille':
        d, points = disposition_grille(rng, gestes)
    elif lieu['style'] == 'rond':
        d, points = disposition_rond(rng, gestes)
    else:
        d, points = disposition_puzzle(rng, gestes)
    images = round(DUREE * float(fps))
    g1 = min(GRANDIT[1], (images - 1) / float(fps))  # la dernière image est toujours l'image du plan, seule
    props = {'fps': float(fps), 'duree': images / float(fps), 'image': image, 'style': lieu['style'], 'accroche': lieu['accroche'],
             'recadrage': recadrage(d['zone'], DECALAGES.get(lieu.get('cadrage', ''), 0.0)), 'geste': geste(points, gestes),
             'temps': {'verifie': VERIFIE, 'grandit': [GRANDIT[0], g1]}, **d}
    evenements = []
    for tp, t0, t1, tr in gestes:
        evenements += [('appui', tp, None), ('clic', t1, None)]
    evenements += [('verifie', VERIFIE, None), ('souffle', GRANDIT[0], g1)]
    return props, evenements


# ---------------------------------------------------------------- l'écran de fin : la vraie carte, filmée dans Edge
class Serveur:
    """Le site, servi ici le temps de filmer (un port libre)."""

    def __enter__(self):
        class Silencieux(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *a):
                pass
        self.httpd = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Silencieux, directory=str(RACINE / 'site')))
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        return f'http://localhost:{self.httpd.server_address[1]}'

    def __exit__(self, *a):
        self.httpd.shutdown()


def filmer_fins(lieux):
    """La prise de carte de chaque écran de fin (fin.js), à la cadence de son intro."""
    with Serveur() as site:
        os.environ['SITE_LOCAL'] = site
        sys.path.insert(0, str(ICI.parent / 'halloween'))
        from playwright.sync_api import sync_playwright
        from rushes import tourner  # le moteur des vidéos d'Halloween (il lit SITE_LOCAL)

        class Navigateur:
            def __init__(self, nav, cap):
                self.nav, self.cap = nav, cap

            def new_context(self, **options):
                ctx = self.nav.new_context(**options)
                ctx.add_init_script(f'window.__CAP = {json.dumps(self.cap)};')
                return ctx

        with sync_playwright() as pw:
            nav = pw.chromium.launch(channel='msedge', headless=True,
                                     args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
            for l in lieux:
                cap = {'plan': 'fin-carte', 'lng': l['lng'], 'lat': l['lat'], 'duree': DUREE_FIN}
                ips = max(30, round(float(l['fps'])))
                # la même prise sert tant que le lieu, la cadence et fin.js ne changent pas (refaire une intro ne la refilme pas)
                marque = json.dumps([cap, ips, hashlib.sha1((ICI / 'fin.js').read_bytes()).hexdigest()])
                deja = l['atelier'] / 'fin-carte.txt'
                if (l['atelier'] / 'fin-carte.mp4').exists() and deja.exists() and deja.read_text() == marque:
                    continue
                reglages = {'scripts': ['captcha/fin.js'], 'halloween': False, 'heure': '11:00', 'date': '2026-11-25',
                            'page': (432, 768), 'echelle': 2.5, 'sortie': verifier_sortie(l['atelier'])}
                for essai in (1, 2):  # une prise peut s'arrêter au chargement de la carte
                    try:
                        tourner(Navigateur(nav, cap), 'fin-carte', reglages, vertical=True, ips=ips)
                        deja.write_text(marque)
                        break
                    except Exception as ex:  # noqa: BLE001
                        print(f"  {l['nom']} : la prise de carte a raté ({ex})", flush=True)
                        if essai == 2:
                            l['fin'] = False
            nav.close()


# ---------------------------------------------------------------- les encodages
COULEURS = ['-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']


def numeroter(dossier):
    """Les images de Remotion (element-00.png…) → 00000.png… dans l'ordre."""
    fichiers = sorted(dossier.glob('*.png'), key=lambda f: int(re.findall(r'\d+', f.stem)[-1]))
    for k, f in enumerate(fichiers):
        f.rename(dossier / f'_{k:05d}.png')
    for f in dossier.glob('_*.png'):
        f.rename(dossier / f.name[1:])
    return len(fichiers)


def encoder(dossier, fps, sortie, son=None):
    entree = ['-framerate', texte_cadence(fps), '-i', dossier / '%05d.png']
    audio = ['-i', son, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000'] if son else ['-an']
    lancer([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', *entree, *audio[:2],
            '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p',
            '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-profile:v', 'high', *COULEURS, '-r', texte_cadence(fps),
            *audio[2:], '-movflags', '+faststart', verifier_sortie(sortie)])


def encoder_transparent(dossier, fps, sortie):
    lancer([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-framerate', texte_cadence(fps), '-i', dossier / '%05d.png',
            '-c:v', 'prores_ks', '-profile:v', '4', '-pix_fmt', 'yuva444p10le', '-alpha_bits', '16', '-vendor', 'apl0',
            *COULEURS, '-r', texte_cadence(fps), verifier_sortie(sortie)])


def apercu(l, fichiers):
    """L'intro, puis 2,5 s du plan avec le nom par-dessus, puis l'écran de fin : pour juger la jointure sans DaVinci."""
    fps = texte_cadence(l['fps'])
    plan = ['-loop', '1', '-t', '2.5', '-i', l['atelier'] / 'image0.png'] if l['photo'] else \
        ['-ss', f"{l['debut']:.3f}", '-t', '2.5', '-i', l['plan']]
    entrees = ['-i', fichiers['intro'], *plan, '-i', fichiers['nom'], '-f', 'lavfi', '-t', '2.5', '-i', 'anullsrc=r=48000:cl=stereo']
    graphe = (f'[1:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={fps},format=yuv420p,setsar=1[p];'
              f'[2:v]fps={fps}[n];[p][n]overlay=0:0:eof_action=pass,format=yuv420p[pn];'
              f'[0:v]setsar=1[i];[0:a]aresample=48000[ia];')
    if l['fin']:
        entrees += ['-i', fichiers['fin'], '-f', 'lavfi', '-t', f'{DUREE_FIN}', '-i', 'anullsrc=r=48000:cl=stereo']
        graphe += f'[4:v]setsar=1[f];[i][ia][pn][3:a][f][5:a]concat=n=3:v=1:a=1[v][a]'
    else:
        graphe += '[i][ia][pn][3:a]concat=n=2:v=1:a=1[v][a]'
    lancer([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', *entrees, '-filter_complex', graphe, '-map', '[v]', '-map', '[a]',
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', *COULEURS, '-r', fps, '-c:a', 'aac', '-b:a', '160k',
            '-movflags', '+faststart', verifier_sortie(fichiers['apercu'])])


# ---------------------------------------------------------------- tout
def completer(lieu, reglages, sheet):
    """Complète un lieu de la liste : son plan, sa cadence, son nom, sa préfecture, son accroche, son style. None : on le saute."""
    plan, debut = trouver_plan(lieu['plan'])
    if not plan:
        print(f"  ligne {lieu['ligne']} : je ne trouve pas « {lieu['plan']} » (ni dans plans\\, ni ailleurs) : sauté.")
        return None
    lieu['plan'], lieu['debut'] = plan, debut
    lieu['photo'] = plan.suffix.lower() in IMAGES
    s = {} if lieu['photo'] else sonder(plan)
    if not lieu['photo'] and s.get('color_transfer') in ('arib-std-b67', 'smpte2084'):
        print(f"  {plan.name} est en HDR : DaVinci peut l'afficher avec d'autres couleurs que l'intro. Le plus sûr : une image fixe "
              "exportée depuis DaVinci.")
    lieu['sonde'] = s
    lieu['fps'] = reglages['cadence'] if lieu['photo'] else cadence(s, reglages['cadence'])
    lieu['nom'] = lieu['nom'] or re.sub(r'\s*\(\d+\)$', '', plan.stem).strip()
    f = fiche(sheet, lieu['nom'])
    lieu['categorie'] = f['Catégorie'].strip() if f else ''
    if f:
        lat, lng = (float(v) for v in f['Coordonnées GPS'].split(','))
        lieu['lat'], lieu['lng'] = lat, lng
        if not lieu['prefecture']:
            lieu['prefecture'] = PREFECTURES[prefecture(lng, lat)]
    lieu['graine'] = int(hashlib.sha1(normal(lieu['nom']).encode()).hexdigest()[:8], 16)
    style = lieu['style']
    if style.startswith(('gri', 'grid', 'cas', 'squ')):
        style = 'grille'
    elif style.startswith(('puz', 'pi')):
        style = 'puzzle'
    elif style.startswith(('ron', 'rou', 'cer', 'cir', 'rot', 'tou')):
        style = 'rond'
    elif lieu['accroche'].lower().startswith('select all'):
        style = 'grille'
    elif lieu['accroche'].lower().startswith(('drag the slider', 'rotate', 'turn')):
        style = 'rond'
    elif lieu['accroche'].lower().startswith('drag'):
        style = 'puzzle'
    else:
        style = random.Random(lieu['graine'] + 7).choice(['grille', 'puzzle', 'rond'])
    lieu['style'] = style
    lieu['proposee'] = not lieu['accroche']
    lieu['accroche'] = lieu['accroche'] or accroche_proposee(style, lieu['categorie'], lieu['nom'])
    lieu['fin'] = reglages['fin'] and 'lng' in lieu
    ident = re.sub(r'[^a-z0-9]+', '-', normal(lieu['nom']) or 'lieu')
    lieu['ident'] = ident
    lieu['atelier'] = verifier_sortie(ATELIER / 'lieux' / ident)
    lieu['dossier'] = verifier_sortie(SORTIE / propre(lieu['nom']))
    st = plan.stat()
    lieu['empreinte'] = hashlib.sha1(json.dumps([VERSION, lieu['texte'], str(plan), st.st_size, st.st_mtime_ns, str(lieu['fps']),
                                                 lieu['fin']]).encode()).hexdigest()
    return lieu


def installer():
    """Le dossier de travail du propriétaire : ses dossiers, sa liste (le modèle, la première fois), le mode d'emploi et le
    fichier à double-cliquer (remis à jour à chaque fois)."""
    for d in (TRAVAIL, ATELIER, SORTIE, PLANS):
        verifier_sortie(d).mkdir(parents=True, exist_ok=True)
    if not LISTE.exists():
        shutil.copy2(ICI / 'lieux-modele.txt', LISTE)
    (TRAVAIL / "Mode d'emploi.txt").write_text((ICI / 'mode-d-emploi.txt').read_text(encoding='utf-8'), encoding='utf-8-sig')
    bat = ('@echo off\r\nchcp 65001 >nul\r\ntitle Intros captcha\r\nset PYTHONIOENCODING=utf-8\r\n'
           f'python "{Path(__file__).resolve()}" %*\r\necho.\r\nstart "" "{SORTIE}"\r\npause\r\n')
    (TRAVAIL / 'Fabriquer les intros.bat').write_bytes(bat.encode('utf-8'))


def main():
    refaire = '--refaire' in sys.argv
    installer()
    reglages, liste = lire_liste()
    if not liste:
        print(f"Aucun lieu dans {LISTE} : écris une ligne par lieu (voir « Mode d'emploi.txt »).")
        return
    sheet = fiches()
    lieux = []
    print(f'{len(liste)} lieu(x) dans lieux.txt', flush=True)
    for brut in liste:
        l = completer(brut, reglages, sheet)
        if not l:
            continue
        deja = l['dossier'] / '.empreinte'
        if not refaire and deja.exists() and deja.read_text() == l['empreinte']:
            print(f"  {l['nom']} : déjà fait (supprime son dossier dans intros\\ pour le refaire)")
            continue
        lieux.append(l)
    if not lieux:
        print('Rien de nouveau à faire.')
        return

    travaux = []
    for l in lieux:
        l['atelier'].mkdir(parents=True, exist_ok=True)
        image0(l['plan'], l['debut'], l['sonde'], l['atelier'] / 'image0.png')
        props, evenements = props_intro(l, l['fps'], f"{l['ident']}/image0.png")
        l['props'] = props
        (l['atelier'] / 'props-intro.json').write_text(json.dumps(props, indent=1), encoding='utf-8')
        sons.mixer(evenements, props['duree'], l['atelier'] / 'sons.wav')
        fps = float(l['fps'])
        travaux.append({'composition': 'Intro', 'props': props, 'dossier': str(l['atelier'] / 'images-intro')})
        nom = {'fps': fps, 'duree': round(DUREE_NOM * fps) / fps, 'nom': l['nom'], 'prefecture': l['prefecture'], 'anime': True}
        travaux.append({'composition': 'Nom', 'props': nom, 'dossier': str(l['atelier'] / 'images-nom')})
        print(f"  {l['nom']} ({l['prefecture'] or 'préfecture inconnue'}) : {l['style']}, « {l['accroche']} »"
              f"{' (proposée)' if l['proposee'] else ''}, {texte_cadence(l['fps'])} images/s", flush=True)

    fins = [l for l in lieux if l['fin']]
    if fins:
        print(f"La carte de l'écran de fin ({len(fins)} lieu(x)) : Edge la filme…", flush=True)
        try:
            filmer_fins(fins)
        except Exception as ex:  # noqa: BLE001
            print(f"  pas d'écran de fin cette fois ({ex})")
            for l in fins:
                l['fin'] = False
        for l in fins:
            if l['fin']:
                fps = float(l['fps'])
                fin = {'fps': fps, 'duree': round(DUREE_FIN * fps) / fps, 'video': f"{l['ident']}/fin-carte.mp4", 'nom': l['nom']}
                travaux.append({'composition': 'Fin', 'props': fin, 'dossier': str(l['atelier'] / 'images-fin')})

    # le dossier public du montage ne garde que les fichiers des lieux de cette fois : Remotion le recopie en entier à chaque
    # préparation (et rien d'autre dedans : un dossier temporaire à l'intérieur, il se recopiait lui-même sans fin)
    print('Le montage dessine les images…', flush=True)
    shutil.rmtree(verifier_sortie(PUBLIC), ignore_errors=True)
    for l in lieux:
        (PUBLIC / l['ident']).mkdir(parents=True, exist_ok=True)
        for f in ('image0.png', 'fin-carte.mp4'):
            if (l['atelier'] / f).exists():
                shutil.copy2(l['atelier'] / f, PUBLIC / l['ident'] / f)
    fichier = ATELIER / 'travaux.json'
    fichier.write_text(json.dumps({'public': str(PUBLIC), 'travaux': travaux}, ensure_ascii=False), encoding='utf-8')
    env = {**os.environ, 'TMP': str(ATELIER / 'tmp'), 'TEMP': str(ATELIER / 'tmp')}
    shutil.rmtree(ATELIER / 'tmp', ignore_errors=True)
    (ATELIER / 'tmp').mkdir(exist_ok=True)
    lancer([shutil.which('node') or 'node', 'rendre.mjs', fichier], cwd=MONTAGE, env=env)

    for l in lieux:
        a, d, n = l['atelier'], l['dossier'], propre(l['nom'])
        d.mkdir(parents=True, exist_ok=True)
        fichiers = {'intro': d / f'{n} - intro.mp4', 'sans': d / f'{n} - intro sans son.mp4', 'nom': d / f'{n} - nom (transparent).mov',
                    'nom_png': d / f'{n} - nom (transparent).png', 'fin': d / f'{n} - fin.mp4', 'apercu': d / f'{n} - aperçu.mp4'}
        numeroter(a / 'images-intro')
        encoder(a / 'images-intro', l['fps'], fichiers['intro'], son=a / 'sons.wav')
        lancer([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-i', fichiers['intro'], '-c:v', 'copy', '-an', '-movflags', '+faststart',
                verifier_sortie(fichiers['sans'])])
        k = numeroter(a / 'images-nom')
        encoder_transparent(a / 'images-nom', l['fps'], fichiers['nom'])
        shutil.copy2(a / 'images-nom' / f'{k - 1:05d}.png', verifier_sortie(fichiers['nom_png']))
        if l['fin']:
            numeroter(a / 'images-fin')
            encoder(a / 'images-fin', l['fps'], fichiers['fin'])
        elif fichiers['fin'].exists():
            fichiers['fin'].unlink()
        apercu(l, fichiers)
        infos = [f"Lieu : {l['nom']}", f"Préfecture : {l['prefecture'] or '(inconnue : écris-la dans lieux.txt)'}",
                 f"Plan : {l['plan']}" + (f" (à partir de {l['debut']:g} s)" if l['debut'] else ''),
                 f"Style : {l['style']}", f"Accroche : {l['accroche']}" + (' (proposée par l\'outil)' if l['proposee'] else ''),
                 f"Cadence : {texte_cadence(l['fps'])} images/s", f"Écran de fin : {'oui' if l['fin'] else 'non'}"]
        (d / 'infos.txt').write_text('\n'.join(infos) + '\n', encoding='utf-8')
        (d / '.empreinte').write_text(l['empreinte'])
        for sous in ('images-intro', 'images-nom', 'images-fin'):
            shutil.rmtree(a / sous, ignore_errors=True)
        print(f"→ {d}", flush=True)
    print('Fini.')


if __name__ == '__main__':
    main()
