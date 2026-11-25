# -*- coding: utf-8 -*-
"""S'asseoir sur chaque banc du lieu, avec la vraie touche : la bulle « S'asseoir », ce qu'on voit assis (une photo), se relever, repartir.
    python outils/balade/bancs.py sortie.jpg --lieu iiyama [--nuit] [--tel]"""
import sys, math, json
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
sys.stdout.reconfigure(encoding='utf-8')
ARGS = sys.argv[1:]
NUIT, TEL = '--nuit' in ARGS, '--tel' in ARGS
LIEU = ARGS[ARGS.index('--lieu') + 1] if '--lieu' in ARGS else sys.exit(__doc__)
SORTIE = Path([a for a in ARGS if not a.startswith('--') and a != LIEU][0])
ims = []
with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    ctx = nav.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True) if TEL else nav.new_context(viewport={'width': 1280, 'height': 720})
    p = ctx.new_page()
    p.on('pageerror', lambda e: print('ERREUR page :', e))
    url = f'http://localhost:8123/balade/?lieu={LIEU}&perso=garcon&langue=fr&compagnon=kon'
    p.goto(url); p.evaluate("localStorage.clear(); localStorage.setItem('modeDev', 'oui'); localStorage.setItem('baladeYakushima', 'oui')"); p.goto(url)
    p.wait_for_function('window.__pret === true', timeout=180000)
    for _ in range(60):
        p.wait_for_timeout(150)
        if p.evaluate("balade.etat.mode !== 'dialogue' && document.querySelector('.dialogue').hidden"): break
        p.keyboard.press('KeyE')
    if NUIT:
        p.evaluate("balade.jeu.nuit(true)"); p.wait_for_timeout(3000)
    p.add_style_tag(content='.aide, .rappel-compagnon { display: none !important; }')
    n = p.evaluate("balade.monde().lieu.bancs.length")
    print('bancs :', n)
    for i in range(n):
        r = p.evaluate("""(i) => {
          const L = balade.monde().lieu, b = L.bancs[i], mo = L.monde, e = balade.etat;
          const mx = (b.de[0] + b.a[0]) / 2, mz = (b.de[1] + b.a[1]) / 2;
          for (const d of [0.9, 1.1, 0.7, 1.3]) for (const s of [1, -1]) {
            const x = mx + Math.sin(b.cap) * d * s, z = mz + Math.cos(b.cap) * d * s, h = mo.hauteur(x, z, b.y + 0.6);
            if (!mo.libre(x, z, h) || Math.abs(h - b.y) > 1.2) continue;
            e.x = x; e.z = z; e.y = h; e.cap = Math.atan2(mx - x, mz - z); e.vx = e.vz = 0; balade.jeu.cameraDerriere(0);
            return { x: +x.toFixed(2), z: +z.toFixed(2), banc: [+mx.toFixed(2), +mz.toFixed(2), +b.y.toFixed(2), +b.cap.toFixed(2)], cote: s };
          }
          return { erreur: 'aucune place libre devant le banc', banc: [mx, mz] };
        }""", i)
        if r.get('erreur'): print(' !!', i, r); continue
        p.wait_for_timeout(700)
        bulle = p.evaluate("(() => { const b = document.querySelector('.bulle-action'); return b && !b.hidden ? b.innerText.replace(/\\n/g, ' ') : ''; })()")
        p.keyboard.press('KeyE'); p.wait_for_timeout(2600)
        assis = p.evaluate("(() => { const e = balade.etat; return { mode: e.mode, x: +e.x.toFixed(2), y: +e.y.toFixed(2), z: +e.z.toFixed(2), cap: +e.cap.toFixed(2) }; })()")
        f = SORTIE.with_name(f'{SORTIE.stem}_{i}.png'); p.screenshot(path=str(f)); ims.append((f'banc {i}', f))
        bulle2 = p.evaluate("(() => { const b = document.querySelector('.bulle-action'); return b && !b.hidden ? b.innerText.replace(/\\n/g, ' ') : ''; })()")
        p.keyboard.press('KeyE'); p.wait_for_timeout(1400)
        debout = p.evaluate("(() => { const e = balade.etat, mo = balade.monde().lieu.monde; return { mode: e.mode, x: +e.x.toFixed(2), y: +e.y.toFixed(2), z: +e.z.toFixed(2), libre: mo.libre(e.x, e.z, e.y) }; })()")
        # on repart : deux pas en avant avec la vraie touche
        p.keyboard.down('ArrowUp'); p.wait_for_timeout(700); p.keyboard.up('ArrowUp'); p.wait_for_timeout(200)
        apres = p.evaluate("(() => { const e = balade.etat; return [+e.x.toFixed(2), +e.z.toFixed(2)]; })()")
        bouge = math.hypot(apres[0] - debout['x'], apres[1] - debout['z'])
        print(f" banc {i} {r['banc']} | bulle « {bulle} » | assis {assis} | bulle assis « {bulle2} » | debout {debout} | puis marche {bouge:.2f} m")
    nav.close()
if ims:
    w0, h0 = Image.open(ims[0][1]).size
    W = 300 if TEL else 560; H = round(h0 * W / w0); col = min(4, len(ims)); lig = math.ceil(len(ims) / col)
    P = Image.new('RGB', (col * W + (col - 1) * 4, lig * H + (lig - 1) * 4), '#1e1e1e')
    d = ImageDraw.Draw(P); police = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 18)
    for i, (nom, f) in enumerate(ims):
        x, y = (i % col) * (W + 4), (i // col) * (H + 4)
        P.paste(Image.open(f).convert('RGB').resize((W, H), Image.LANCZOS), (x, y))
        d.rectangle([x, y, x + 10 + d.textlength(nom, font=police), y + 24], fill='#000000'); d.text((x + 5, y + 3), nom, fill='#ffe066', font=police)
    P.save(SORTIE, quality=88); print(SORTIE, P.size)
