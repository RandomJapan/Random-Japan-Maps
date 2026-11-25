# -*- coding: utf-8 -*-
"""Ce qu'un simple visiteur (rien dans le navigateur, pas de mode développeur) voit d'un lieu, à côté de ce que voit le mode développeur :
dans la balade (?lieu=<lieu> : quel lieu se charge ; le carnet, la garde-robe, le menu des lieux) et sur la carte (le bouton « Visiter en 3D »
de sa fiche, sa carte dans le panneau des balades, et leur classe dev). Des photos de chaque écran dans le dossier.
- Un lieu en mode développeur (dans EN_ESSAI et BALADES_ESSAI) : le visiteur n'en voit aucune trace ; le mode développeur voit tout.
- Après sa sortie : le visiteur voit la même chose que le mode développeur.
    python outils/balade/visiteur.py dossier --lieu iiyama --fiche iiyama-snow-festival [--mots "Iiyama,飯山,いいやま,tengu,天狗"] [--adresse https://map.randomjapanplace.com]
(--fiche : l'identifiant du lieu sur la carte, l'ancre de son adresse ; --mots : ce qui trahirait le lieu dans un texte, par défaut son nom)"""
import sys, json
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8')
ARGS = sys.argv[1:]
def opt(n, d=None):
    if n in ARGS:
        i = ARGS.index(n); v = ARGS[i + 1]; del ARGS[i:i + 2]; return v
    return d
LIEU, FICHE = opt('--lieu'), opt('--fiche')
if not (LIEU and FICHE and ARGS): sys.exit(__doc__)
ADRESSE = opt('--adresse', 'http://localhost:8123').rstrip('/')
MOTS = (opt('--mots') or f'{LIEU},{LIEU.capitalize()}').split(',')
D = Path(ARGS[0]); D.mkdir(parents=True, exist_ok=True)
VISIBLE = "(el) => { if (!el) return false; const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; }"

def balade(nav, dev):
    r = {}
    p = nav.new_context(viewport={'width': 1280, 'height': 720}).new_page()
    err = []
    p.on('pageerror', lambda e: err.append(str(e)))
    url = f'{ADRESSE}/balade/?lieu={LIEU}&perso=garcon&langue=fr&compagnon=kon'
    p.goto(url)
    p.evaluate("localStorage.clear()")
    if dev: p.evaluate("localStorage.setItem('modeDev', 'oui')")
    p.goto(url)
    p.wait_for_function('window.__pret === true', timeout=180000)
    for _ in range(60):
        p.wait_for_timeout(150)
        if p.evaluate("balade.etat.mode !== 'dialogue' && document.querySelector('.dialogue').hidden"): break
        p.keyboard.press('KeyE')
    r['lieu chargé'] = p.evaluate("balade.monde().lieu.id")
    r['peintre'] = p.evaluate("(balade.monde().lieu.peintre || {}).tableau || null")
    # le carnet (toutes ses pages : on les lit dans la page elle-même)
    p.keyboard.press('KeyC'); p.wait_for_timeout(900)
    r['carnet'] = [m for m in MOTS if m in p.evaluate("(document.querySelector('.carnet') || document.body).innerHTML")]
    p.screenshot(path=str(D / f"{'dev' if dev else 'visiteur'}_carnet.png"))
    p.keyboard.press('Escape'); p.wait_for_timeout(500)
    # la garde-robe
    p.click('.btn-tenue'); p.wait_for_timeout(900)
    r['garde-robe'] = [m for m in MOTS if m in p.evaluate("(document.querySelector('.garderobe, .tenue') || document.body).innerHTML")]
    p.screenshot(path=str(D / f"{'dev' if dev else 'visiteur'}_garderobe.png"))
    p.keyboard.press('Escape'); p.wait_for_timeout(500)
    # le menu (les lieux)
    p.click('.btn-menu'); p.wait_for_timeout(900)
    r['menu'] = [m for m in MOTS if m in p.evaluate("document.body.innerText")]
    p.screenshot(path=str(D / f"{'dev' if dev else 'visiteur'}_menu.png"))
    r['erreurs'] = err
    p.context.close()
    return r

def carte(nav, dev):
    r = {}
    p = nav.new_context(viewport={'width': 1280, 'height': 800}).new_page()
    err = []
    p.on('pageerror', lambda e: err.append(str(e)))
    p.goto(ADRESSE + '/')
    p.evaluate("localStorage.clear()")
    if dev: p.evaluate("localStorage.setItem('modeDev', 'oui')")
    p.goto(f'{ADRESSE}/#{FICHE}'); p.reload()
    p.wait_for_function("window.carte && document.getElementById('chargement').classList.contains('fini')", timeout=180000)
    p.wait_for_timeout(4000)
    r['bouton de la fiche'] = p.evaluate("(([vis, lieu]) => [...document.querySelectorAll('a[href*=\"balade\"]')].filter((a) => a.href.includes('lieu=' + lieu)).map((a) => ({ visible: vis(a), classe: a.className, texte: a.innerText.trim().slice(0, 40) })))([" + VISIBLE + ", " + json.dumps(LIEU) + "])")
    p.screenshot(path=str(D / f"{'dev' if dev else 'visiteur'}_carte.png"))
    # le panneau « Se balader en 3D » (?balades l'ouvre ; ses cartes n'existent qu'une fois ouvert)
    p.goto(f'{ADRESSE}/?balades&v={id(p)}')
    p.wait_for_function("window.carte && document.getElementById('chargement').classList.contains('fini')", timeout=180000)
    p.wait_for_timeout(3500)
    r['panneau des balades'] = p.evaluate("(([vis, lieu]) => [...document.querySelectorAll('li.balade')].filter((li) => li.innerHTML.includes('lieu=' + lieu)).map((li) => ({ visible: vis(li), classe: li.className, texte: li.innerText.trim().slice(0, 60) })))([" + VISIBLE + ", " + json.dumps(LIEU) + "])")
    p.screenshot(path=str(D / f"{'dev' if dev else 'visiteur'}_panneau.png"))
    r['erreurs'] = err
    p.context.close()
    return r

with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    for dev in (False, True):
        qui = 'mode développeur' if dev else 'simple visiteur'
        print(qui, '| balade :', json.dumps(balade(nav, dev), ensure_ascii=False), flush=True)
        print(qui, '| carte :', json.dumps(carte(nav, dev), ensure_ascii=False), flush=True)
    nav.close()
