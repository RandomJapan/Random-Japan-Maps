# -*- coding: utf-8 -*-
"""Joue une action du lieu dans le vrai jeu et la photographie au fil du temps.
    python outils/balade/jouer.py sortie.jpg "js" --lieu iiyama [--nuit] [--tel] [--photos 1,3,5,8] [--duree 12] [--avant "js"] [--choix 0] [--langue fr] [--col 3] [--touches "ArrowLeft@3-4,ArrowRight@5-6"]
js : lancé sans l'attendre (L = le lieu, J = balade.jeu, I(id) = l'interaction id : I('chef').action(J)). Les dialogues avancent tout seuls (E) ; aux
questions, le choix --choix (0 : le premier). --photos : les instants (en secondes) des images ; les textes dits sont affichés à la fin.
--touches : des touches tenues entre deux instants (pour la descente en bouée)."""
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
LIEU, PORT, COL, LANGUE = (opt('--lieu') or sys.exit(__doc__)), opt('--port', '8123'), int(opt('--col', '3')), opt('--langue', 'fr')
PHOTOS = [float(t) for t in opt('--photos', '1,3,5').split(',')]
DUREE, AVANT, CHOIX = float(opt('--duree', str(max(PHOTOS) + 1))), opt('--avant'), int(opt('--choix', '0'))
TOUCHES = []
for t in (opt('--touches') or '').split(','):
    if t:
        k, r = t.split('@'); a, b = r.split('-'); TOUCHES.append([k, float(a), float(b), False])
NUIT, TEL = drapeau('--nuit'), drapeau('--tel')
PERSO = opt('--perso', 'garcon')
SORTIE, JS = Path(ARGS[0]), ARGS[1]

with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    ctx = nav.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True) if TEL else nav.new_context(viewport={'width': 1280, 'height': 720})
    p = ctx.new_page()
    p.on('pageerror', lambda e: print('ERREUR page :', e))
    p.on('console', lambda m: print('console :', m.text[:300]) if m.type == 'error' and 'supported source' not in m.text else None)
    url = f'http://localhost:{PORT}/balade/?lieu={LIEU}&perso={PERSO}&langue={LANGUE}&compagnon=kon'
    p.goto(url)
    p.evaluate("localStorage.clear(); localStorage.setItem('modeDev', 'oui'); localStorage.setItem('baladeYakushima', 'oui')")
    p.goto(url)
    p.wait_for_function('window.__pret === true', timeout=180000)
    for _ in range(60):
        p.wait_for_timeout(150)
        if p.evaluate("balade.etat.mode !== 'dialogue' && document.querySelector('.dialogue').hidden"): break
        if p.evaluate("!document.querySelector('.dialogue-choix').hidden"): p.keyboard.press('Enter')
        else: p.keyboard.press('KeyE')
    if NUIT:
        p.evaluate("balade.jeu.nuit(true)"); p.wait_for_timeout(2800)
    p.add_style_tag(content='.aide, .rappel-compagnon { display: none !important; }')
    PRE = "const L = balade.monde().lieu, J = balade.jeu, I = (id) => L.interactions.find((i) => i.id === id);"
    if AVANT: p.evaluate("async () => { " + PRE + AVANT + " }"); p.wait_for_timeout(600)
    p.evaluate("() => { " + PRE + " window.__fini = false; window.__dits = []; Promise.resolve((async () => { " + JS + " })()).then(() => { window.__fini = true; }, (e) => { window.__fini = true; window.__erreur = String(e && e.stack || e); }); }")
    ims, t, pas, dits, dernier = [], 0.0, 0.25, [], ''
    restantes = sorted(PHOTOS)
    while t < DUREE:
        p.wait_for_timeout(int(pas * 1000)); t += pas
        for T in TOUCHES:
            if not T[3] and t >= T[1]: p.keyboard.down(T[0]); T[3] = True
            if T[3] and t >= T[2]: p.keyboard.up(T[0]); T[3] = None
        texte = p.evaluate("(() => { const d = document.querySelector('.dialogue'); return d && !d.hidden ? d.innerText : ''; })()")
        if restantes and t >= restantes[0]:
            f = SORTIE.with_name(f'{SORTIE.stem}_{len(ims)}.png'); p.screenshot(path=str(f)); ims.append((f'{restantes.pop(0):g} s', Image.open(f).convert('RGB')))
        if texte:
            if texte != dernier: dits.append(texte.replace('\n', ' / ')); dernier = texte
            if p.evaluate("!document.querySelector('.dialogue-choix').hidden"):
                for _ in range(CHOIX): p.keyboard.press('ArrowDown')
                p.keyboard.press('Enter')
            else: p.keyboard.press('KeyE')
        else: dernier = ''
    print('fini :', p.evaluate("window.__fini"), '| erreur :', p.evaluate("window.__erreur || ''"))
    print('tampons :', p.evaluate("localStorage.getItem('baladeTampons')"), '| secrets :', p.evaluate("localStorage.getItem('baladeSecrets')"), '| records :', p.evaluate("localStorage.getItem('baladeRecords')"))
    e = p.evaluate("(() => { const e = balade.etat; return [e.x, e.y, e.z, e.cap, e.mode].map((v) => typeof v === 'number' ? +v.toFixed(2) : v); })()")
    print('voyageur :', e)
    for d in dits: print('  «', d[:230], '»')
    nav.close()

if ims:
    w0, h0 = ims[0][1].size
    W = 640 if not TEL else 300; H = round(h0 * W / w0)
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
