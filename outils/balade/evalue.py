# -*- coding: utf-8 -*-
"""Évalue une expression JavaScript dans le jeu chargé (le lieu en mode développeur) et affiche le résultat (JSON).
    python outils/balade/evalue.py "expression" --lieu iiyama [--port 8123] [--nuit]
L = balade.monde().lieu est disponible dans l'expression (une expression, ou le corps d'une fonction avec return)."""
import sys, json
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')
ARGS = sys.argv[1:]
def opt(n, d=None):
    if n in ARGS:
        i = ARGS.index(n); v = ARGS[i + 1]; del ARGS[i:i + 2]; return v
    return d
LIEU, PORT = (opt('--lieu') or sys.exit(__doc__)), opt('--port', '8123')
NUIT = '--nuit' in ARGS
if NUIT: ARGS.remove('--nuit')
EXPR = ARGS[0]

with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    p = nav.new_context(viewport={'width': 1280, 'height': 720}).new_page()
    p.on('pageerror', lambda e: print('ERREUR page :', e))
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
    if NUIT:
        p.evaluate("balade.jeu.nuit(true)"); p.wait_for_timeout(2800)
    corps = EXPR if 'return' in EXPR else f'return ({EXPR})'
    r = p.evaluate("async () => { const L = balade.monde().lieu, M = balade.monde(); " + corps + " }")
    print(json.dumps(r, ensure_ascii=False, indent=1) if not isinstance(r, str) else r)
    nav.close()
