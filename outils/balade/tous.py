# -*- coding: utf-8 -*-
"""Tous les lieux de la balade se chargent-ils, et rien ne manque-t-il ? (la liste vient de LIEUX, dans site/balade/balade.js)
Pour chacun : le lieu chargé, le temps, les erreurs de la page et de la console, les fichiers qui manquent (réponse 400 ou plus, requête
échouée), le peintre Sumi et son tableau, ce que l'image dessine (appels, triangles), une photo du départ ; sur une planche, pour voir
d'un coup d'œil qu'un changement du moteur n'a rien abîmé ailleurs. À la fin : les tableaux de Sumi (TABLEAUX, inkami.js), un par un.
En simple visiteur par défaut (rien dans le navigateur) ; --dev : en mode développeur. Yakushima est ouverte (comme après la barque d'Udo).
    python -u outils/balade/tous.py dossier [--site] [--nuit] [--dev] [--seul a,b]"""
import re, sys, time, math
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
sys.stdout.reconfigure(encoding='utf-8')
ARGS = sys.argv[1:]
opt = lambda n, d=None: ARGS[ARGS.index(n) + 1] if n in ARGS else d
U = 'https://map.randomjapanplace.com' if '--site' in ARGS else 'http://localhost:8123'
NUIT, DEV = '--nuit' in ARGS, '--dev' in ARGS
libres = [a for i, a in enumerate(ARGS) if not a.startswith('--') and not (i and ARGS[i - 1] == '--seul')]
if not libres: sys.exit(__doc__)
D = Path(libres[0]); D.mkdir(parents=True, exist_ok=True)
SITE = Path(__file__).resolve().parents[2] / 'site' / 'balade'
LIEUX = re.findall(r'\w+', re.search(r'const LIEUX = Object\.fromEntries\(Object\.entries\(\{([^}]*)\}', (SITE / 'balade.js').read_text(encoding='utf-8')).group(1))
if opt('--seul'): LIEUX = [l for l in LIEUX if l in opt('--seul').split(',')]
bloc = re.search(r'export const TABLEAUX = \{(.*?)\n\};', (SITE / 'inkami.js').read_text(encoding='utf-8'), re.S).group(1)
TABLEAUX = re.findall(r"(\w+): '", re.sub(r'//[^\n]*', '', bloc))
print(len(LIEUX), 'lieux :', ', '.join(LIEUX), '|', 'mode développeur' if DEV else 'simple visiteur', '|', U, flush=True)
total, ims = [], []
with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    for id in LIEUX:
        ctx = nav.new_context(viewport={'width': 1280, 'height': 720}); p = ctx.new_page(); err, manque = [], []
        p.on('pageerror', lambda e: err.append(str(e)[:200]))
        p.on('console', lambda m: err.append('console : ' + m.text[:200]) if m.type == 'error' and 'supported source' not in m.text and 'Failed to load resource' not in m.text else None)
        p.on('response', lambda r: manque.append(f'{r.status} {r.url}') if r.status >= 400 else None)
        p.on('requestfailed', lambda r: manque.append(f'échec {r.url} ({r.failure})') if 'net::ERR_ABORTED' not in str(r.failure) else None)
        url = f'{U}/balade/?lieu={id}&langue=fr&perso=fille&compagnon=kon'
        p.goto(url); p.evaluate("localStorage.clear(); localStorage.setItem('baladeYakushima', 'oui')")
        if DEV: p.evaluate("localStorage.setItem('modeDev', 'oui')")
        manque.clear(); t0 = time.time(); p.goto(url)
        try:
            p.wait_for_function('window.__pret === true', timeout=150000)
            charge = p.evaluate("balade.monde().lieu.id")
        except Exception as e:
            charge = 'PAS CHARGÉ'; err.append(str(e)[:120])
        dt = time.time() - t0
        for _ in range(60):
            p.wait_for_timeout(150)
            if p.evaluate("balade.etat.mode !== 'dialogue' && document.querySelector('.dialogue').hidden"): break
            if p.evaluate("!document.querySelector('.dialogue-choix').hidden"): p.keyboard.press('Enter')
            else: p.keyboard.press('KeyE')
        if NUIT and charge == id:
            p.evaluate("balade.jeu.nuit(true)"); p.wait_for_timeout(3000)
        p.wait_for_timeout(1200)
        # (une image entière comptée d'un coup : sinon on ne lit que la dernière passe, 1 appel et 1 triangle)
        info = p.evaluate("(() => { const r = balade.rendu, M = balade.monde(); r.info.autoReset = false; r.info.reset(); M.finale.rendre(r, balade.scene, balade.camera); const i = r.info.render, v = [i.calls, i.triangles]; r.info.autoReset = true; return v; })()") if charge == id else [0, 0]
        sumi = p.evaluate("(() => { const q = balade.monde().lieu.peintre; return q ? [q.tableau, q.autre?.tableau].filter(Boolean).join('+') : 'AUCUN'; })()") if charge == id else '-'
        f = D / f'{id}.png'; p.screenshot(path=str(f)); ims.append((id, f))
        print(f'{id:12s} -> {charge:12s} {dt:5.1f} s  appels {info[0]:4d}  triangles {info[1]:8d}  Sumi {sumi:20s}  erreurs {err[:2]}  manque {manque[:3]}', flush=True)
        total += err + manque
        if charge != id: total.append(f'{id} : chargé {charge}')
        if sumi in ('AUCUN', '-'): total.append(f'{id} : pas de peintre')
        ctx.close()
    # les tableaux de Sumi, un par un (ceux qu'on ne voit qu'en s'approchant de son étal)
    p = nav.new_context().new_page()
    absents = [t for t in TABLEAUX if p.request.get(f'{U}/balade/tableaux/{t}.webp').status != 200]
    print(f'tableaux de Sumi : {len(TABLEAUX)} dans TABLEAUX, {len(TABLEAUX) - len(absents)} trouvés' + (f', ABSENTS : {absents}' if absents else ''))
    total += [f'tableau absent : {t}' for t in absents]
    nav.close()
print('problèmes en tout :', total if total else 'aucun')
police = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 18)
W, H, col = 480, 270, 4
P = Image.new('RGB', (col * W + (col - 1) * 4, math.ceil(len(ims) / col) * (H + 4)), '#1e1e1e')
d = ImageDraw.Draw(P)
for i, (nom, f) in enumerate(ims):
    x, y = (i % col) * (W + 4), (i // col) * (H + 4)
    P.paste(Image.open(f).convert('RGB').resize((W, H), Image.LANCZOS), (x, y))
    d.rectangle([x, y, x + 10 + d.textlength(nom, font=police), y + 24], fill='#000000'); d.text((x + 5, y + 3), nom, fill='#ffe066', font=police)
P.save(D / 'planche.jpg', quality=88)
print(D / 'planche.jpg')
