# -*- coding: utf-8 -*-
"""Les rondes des passants d'un lieu, jouées (pas lues) : avancerPassant lui-même (monde.js), 15 minutes à 60 images par seconde, sans joueur,
les autres passants à leur place. Pour chaque marcheur : les points atteints, le temps passé bloqué, les demi-tours forcés, ce dont il passe
le plus près (les gens debout, ce qu'on fait, les bancs, l'étal du peintre).
    python outils/balade/rondes.py --lieu iiyama [--minutes 15]"""
import sys, json
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8')
ARGS = sys.argv[1:]
opt = lambda n, d=None: ARGS[ARGS.index(n) + 1] if n in ARGS else d
LIEU, MINUTES = (opt('--lieu') or sys.exit(__doc__)), float(opt('--minutes', '15'))

JS = """
async (MINUTES) => {
  const mod = await import('/balade/monde.js');
  const M = balade.monde(), L = M.lieu, monde = L.monde, dt = 1 / 60;
  const res = [];
  for (const P of M.passants) {
    const def = L.passants.find((q) => q.id === P.id) || P;
    if (!def.ronde || !def.ronde.length) continue;
    const p = mod.creerPassant({ x: def.x, z: def.z, cap: def.cap || 0, ronde: def.ronde, vitesse: def.vitesse, attente: def.attente, tenue: def.tenue });
    p.y = monde.hauteur(p.x, p.z, 50);
    p.pause = 0.5;
    const autres = M.passants.filter((q) => q !== P).map((q) => [q.etat.x, q.etat.z, 0.6, q.id]);
    const cibles = [
      ...M.passants.filter((q) => q !== P && !(L.passants.find((d) => d.id === q.id) || {}).ronde).map((q) => ['passant ' + q.id, q.etat.x, q.etat.z]),
      ...L.interactions.filter((i) => i.x != null && !i.passant).map((i) => ['action ' + i.id, i.x, i.z]),
      ...(L.bancs || []).map((b, i) => ['banc ' + i, (b.de[0] + b.a[0]) / 2, (b.de[1] + b.a[1]) / 2]),
    ];
    const pres = cibles.map((c) => [c[0], 1e9]);
    const vus = new Array(def.ronde.length).fill(0);
    let bloque = 0, demiTours = 0, sens = p.sens, marche = 0, dist = 0, x0 = p.x, z0 = p.z, etape = p.etape;
    const trace = [];
    for (let n = 0; n < MINUTES * 60 * 60; n++) {
      const enPause = p.pause > 0, ax = p.x, az = p.z;
      mod.avancerPassant(p, dt, monde, { x: 1e6, z: 1e6 }, autres);
      if (p.etape !== etape) { vus[etape]++; etape = p.etape; }
      if (p.sens !== sens) { demiTours++; sens = p.sens; }
      const d = Math.hypot(p.x - ax, p.z - az);
      dist += d;
      if (!enPause && p.pause <= 0) { marche++; if (d < 1e-6) bloque++; }
      if (n % 6 === 0) for (let k = 0; k < cibles.length; k++) { const e = Math.hypot(p.x - cibles[k][1], p.z - cibles[k][2]); if (e < pres[k][1]) pres[k][1] = e; }
      if (n % 30 === 0) trace.push([+p.x.toFixed(2), +p.z.toFixed(2)]);
    }
    pres.sort((a, b) => a[1] - b[1]);
    res.push({ id: P.id, points: def.ronde.length, vus, bloque: +(bloque * dt).toFixed(1), marche: +(marche * dt).toFixed(0), demiTours, dist: +dist.toFixed(0),
      pres: pres.slice(0, 6).map(([n, e]) => n + ' ' + e.toFixed(2) + ' m'), trace });
  }
  return res;
}
"""
with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    p = nav.new_context(viewport={'width': 1280, 'height': 720}).new_page()
    p.on('pageerror', lambda e: print('ERREUR page :', e))
    url = f'http://localhost:8123/balade/?lieu={LIEU}&perso=garcon&langue=fr&compagnon=kon'
    p.goto(url); p.evaluate("localStorage.clear(); localStorage.setItem('modeDev', 'oui'); localStorage.setItem('baladeYakushima', 'oui')"); p.goto(url)
    p.wait_for_function('window.__pret === true', timeout=180000)
    r = p.evaluate(JS, MINUTES)
    for q in r:
        xs = [t[0] for t in q['trace']]; zs = [t[1] for t in q['trace']]
        print(f"{q['id']} : {q['points']} points, passages {q['vus']}, marche {q['marche']} s dont bloqué {q['bloque']} s, demi-tours forcés {q['demiTours']}, {q['dist']} m parcourus ; x {min(xs)}..{max(xs)}, z {min(zs)}..{max(zs)}")
        print('     au plus près :', ' | '.join(q['pres']))
    nav.close()
