# -*- coding: utf-8 -*-
"""Des vues d'un lieu, sur une planche.
    python outils/balade/vues.py sortie.jpg --lieu iiyama [--nuit] [--tel] [--port 8123] [--col 3] [--l 640] VUE...
VUE :  nom=x,y,z>x,y,z[@champ]   la caméra posée (de > vers) ; un y écrit +1.6 est compté depuis le sol à cet endroit
       nom=jeu:x,z,cap            le voyageur posé là, tourné vers cap, la caméra du jeu derrière lui
Les erreurs de la page sont affichées."""
import sys, math, json
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')
ARGS = sys.argv[1:]
def opt(n, d=None):
    if n in ARGS:
        i = ARGS.index(n); v = ARGS[i + 1]; del ARGS[i:i + 2]; return v
    return d
def drapeau(n):
    if n in ARGS: ARGS.remove(n); return True
    return False
LIEU, PORT, COL, LARG = (opt('--lieu') or sys.exit(__doc__)), opt('--port', '8123'), int(opt('--col', '3')), int(opt('--l', '640'))
NUIT, TEL = drapeau('--nuit'), drapeau('--tel')
ATTENTE = int(opt('--attente', '700'))
SORTIE = Path(ARGS[0]); VUES = ARGS[1:]

def point(p, s):
    x, y, z = s.split(',')
    x, z = float(x), float(z)
    if y.startswith('+'):
        y = p.evaluate(f"balade.monde().lieu.terrain({x}, {z})") + float(y[1:])
    else: y = float(y)
    return [x, y, z]

with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    ctx = nav.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True) if TEL else nav.new_context(viewport={'width': 1280, 'height': 720})
    p = ctx.new_page()
    p.on('pageerror', lambda e: print('ERREUR page :', e))
    p.on('console', lambda m: print('console :', m.text[:300]) if m.type == 'error' and 'supported source' not in m.text else None)
    url = f'http://localhost:{PORT}/balade/?lieu={LIEU}&perso=garcon&langue=fr&compagnon=kon'
    p.goto(url)
    p.evaluate("localStorage.clear(); localStorage.setItem('modeDev', 'oui'); localStorage.setItem('baladeYakushima', 'oui')")
    p.goto(url)
    p.wait_for_function('window.__pret === true', timeout=180000)
    for _ in range(60):
        p.wait_for_timeout(150)
        if p.evaluate("balade.etat.mode !== 'dialogue' && document.querySelector('.dialogue').hidden"): break
        if p.evaluate("!document.querySelector('.dialogue-choix').hidden"): p.keyboard.press('Enter')
        else: p.keyboard.press('KeyE')
    print('lieu chargé :', p.evaluate("balade.monde().lieu.id"))
    if NUIT:
        p.evaluate("balade.jeu.nuit(true)"); p.wait_for_timeout(2800)
    p.add_style_tag(content='.aide, .rappel-compagnon, .bulle-action { display: none !important; }')
    ims = []
    for v in VUES:
        nom, spec = v.split('=', 1)
        if spec.startswith('jeu:'):
            x, z, cap = [float(t) for t in spec[4:].split(',')]
            p.evaluate("balade.jeu.cadrer(null)")
            p.evaluate(f"balade.jeu.placer({x}, {z}, {cap})")
            p.evaluate("balade.jeu.cameraDerriere(0)")
            p.wait_for_timeout(1600)
        else:
            champ = 50
            if '@' in spec: spec, champ = spec.split('@'); champ = float(champ)
            de, vers = spec.split('>')
            de, vers = point(p, de), point(p, vers)
            p.evaluate(f"balade.jeu.cadrer({{ de: {json.dumps(de)}, vers: {json.dumps(vers)}, champ: {champ} }})")
            p.wait_for_timeout(ATTENTE)
        f = SORTIE.with_name(f'{SORTIE.stem}_{nom}.png')
        p.screenshot(path=str(f))
        ims.append((nom, Image.open(f).convert('RGB')))
    nav.close()

if ims:
    w0, h0 = ims[0][1].size
    k = LARG / w0
    W, H = LARG, round(h0 * k)
    col = min(COL, len(ims)); lig = math.ceil(len(ims) / col)
    P = Image.new('RGB', (col * W + (col - 1) * 6, lig * H + (lig - 1) * 6), '#1e1e1e')
    d = ImageDraw.Draw(P)
    police = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 20)
    for i, (nom, im) in enumerate(ims):
        x, y = (i % col) * (W + 6), (i // col) * (H + 6)
        P.paste(im.resize((W, H), Image.LANCZOS), (x, y))
        d.rectangle([x, y, x + 12 + d.textlength(nom, font=police), y + 28], fill='#000000')
        d.text((x + 6, y + 3), nom, fill='#ffe066', font=police)
    P.save(SORTIE, quality=88)
    print(SORTIE, P.size)
