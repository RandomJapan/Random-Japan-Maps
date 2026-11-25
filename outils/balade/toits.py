# -*- coding: utf-8 -*-
"""Les toits qui flottent (les toits faits par a.toitJapon, reliés ou non à leurs murs) : le calcul est dans toits.js, lancé dans une page
du site (il y prend three.js et les modules de la balade). Un côté dont le vide dépasse 12 cm : le toit flotte de ce côté.
    python outils/balade/toits.py <lieu>[,<lieu>…] [--tout] [--site]      (--tout : tous les toits, pas seulement ceux qui flottent)"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8')
ARGS = sys.argv[1:]
libres = [a for a in ARGS if not a.startswith('--')]
if not libres: sys.exit(__doc__)
U = 'https://map.randomjapanplace.com' if '--site' in ARGS else 'http://localhost:8123'
JS = (Path(__file__).resolve().parent / 'toits.js').read_text(encoding='utf-8')
flottent = 0
with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='msedge', headless=True)
    for lieu in libres[0].split(','):
        p = nav.new_page()
        p.goto(f'{U}/balade/balade.css')  # (une page du site, pour que ses modules se chargent comme dans la balade)
        r = p.evaluate(JS, {'LIEU': lieu, 'TOUT': '--tout' in ARGS})
        print('\n'.join(r['lignes']), flush=True)
        flottent += r['flotte']
        p.close()
    nav.close()
sys.exit(1 if flottent else 0)
