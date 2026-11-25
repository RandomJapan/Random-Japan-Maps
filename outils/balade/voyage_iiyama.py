# -*- coding: utf-8 -*-
"""(Le modèle pour un nouveau lieu : en faire une copie, voyage_<lieu>.py, et changer les étapes.)
Le voyage complet d'Iiyama, joué pour de vrai : on est posé près de chaque chose à faire, la bulle du jeu doit proposer la bonne action, on
appuie sur E (la vraie touche), les dialogues avancent avec E, les questions avec les flèches et Entrée, la descente en bouée avec les flèches.
    python outils/balade/voyage_iiyama.py dossier [--tel] [--langue fr] [--perso garcon] [--seul a,b] [--port 8123] [--habile 0.0]
Les étapes : ETAPES (plus bas). À chaque étape : l'action lancée (son id), ce qui est dit, les tampons, des photos ; à la fin un bilan.
--habile : le retard du pilote de la bouée, en secondes (0 : parfait ; 0.25 : un bon joueur ; 9 : il ne touche à rien)."""
import sys, math, json, io
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
PORT, LANGUE, PERSO, SEUL = opt('--port', '8123'), opt('--langue', 'fr'), opt('--perso', 'garcon'), opt('--seul')
HABILE, POUSSE = float(opt('--habile', '0.15')), not drapeau('--sanspousser')
SANSVIRER = drapeau('--sansvirer')
TEL = drapeau('--tel')
TOUT, NUIT = drapeau('--tout'), drapeau('--nuit')
D = Path(ARGS[0]); D.mkdir(parents=True, exist_ok=True)

# id : l'action attendue ; choix : les réponses aux questions, dans l'ordre ; nuit : attendu à la fin ; tampon : attendu
ETAPES = [
    dict(id='chef', choix=[0], tampon='yukizo'),
    dict(id='animatrice', choix=[0], tampon='toro'),
    dict(id='liftier', choix=[0, 1], tampon='slider', bouee=True),
    dict(id='chauffeur', choix=[0], zone='B'),
    dict(id='monKamakura', choix=[], rien='nabe'),          # sans avoir commandé : on ne mange pas
    dict(id='cuisiniere', choix=[0]),
    dict(id='monKamakura', choix=[], tampon='nabe'),
    dict(id='offrande', choix=[], tampon='jinja', dernier=True),
    dict(id='ancien', choix=[0], nuit=True),                 # « Tu veux attendre la nuit ? » (l'ancien, depuis le 2026-11-20)
    dict(id='chauffeurB', choix=[0], zone='A'),
    dict(id='tengu', choix=[]),
    dict(id='feuAllumer', choix=[], secret='noroshi', long=60),
    dict(id='honbu', choix=[0], nuit=False),
    dict(id='sumi', choix=[0], fenetre=True),
    dict(id='tableau-yukizo', choix=[], fenetre=True),
    dict(id='marchand', choix=[], boutique=True),
]
if SEUL: ETAPES = [e for e in ETAPES if e['id'] in SEUL.split(',')]

PRE = """
window.__agi = [];
(() => {
  const L = balade.monde().lieu, M = L.monde, PAS = 0.3, vus = new Set(), cle = (i, j) => i * 100003 + j;
  for (const [x0, z0] of [[0, 47.2], [-3.4, -292.2]]) {
    const file = [[Math.round(x0 / PAS), Math.round(z0 / PAS), M.hauteur(x0, z0)]];
    vus.add(cle(file[0][0], file[0][1]));
    while (file.length) {
      const [i, j, y] = file.pop();
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = i + di, b = j + dj, k = cle(a, b);
        if (vus.has(k) || !M.libre(a * PAS, b * PAS, y, [], [i * PAS, j * PAS])) continue;
        vus.add(k); file.push([a, b, M.hauteur(a * PAS, b * PAS, y)]);
      }
    }
  }
  window.__ou = (x, z) => vus.has(cle(Math.round(x / PAS), Math.round(z / PAS)));
})();
(() => {
  const L = balade.monde().lieu;
  for (const i of L.interactions) { if (i.__enr) continue; const a = i.action; i.__enr = true; i.action = (j) => { window.__agi.push(i.id); return a.call(i, j); }; }
})();
"""
ETAT = """(() => {
  const d = document.querySelector('.dialogue'), c = document.querySelector('.dialogue-choix'), b = document.querySelector('.bulle-action'), e = balade.etat, L = balade.monde().lieu;
  const vis = (el) => !!el && !el.hidden && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden' && el.getBoundingClientRect().width > 0;
  const g = L.conduite;
  return { mode: e.mode, x: +e.x.toFixed(2), y: +e.y.toFixed(2), z: +e.z.toFixed(2), cap: +e.cap.toFixed(2),
    texte: vis(d) ? d.innerText : '', choix: vis(c) ? [...c.querySelectorAll('button, li, .choix')].map((q) => q.innerText).filter(Boolean) : null,
    bulle: vis(b) ? b.innerText : '', nuit: balade.jeu.estNuit, agi: (window.__agi || []).slice(),
    glisse: g && g.actif ? { u: g.u, v: g.v, z: g.z, t: g.t, decompte: g.decompte, fini: !!g.fini, chocs: g.chocs } : null,
    tampons: localStorage.getItem('baladeTampons'), secrets: localStorage.getItem('baladeSecrets'), records: localStorage.getItem('baladeRecords'),
    fenetres: [...document.querySelectorAll('.fond-tableau, .boutique, dialog[open]')].filter(vis).map((q) => q.className),
  };
})()"""
# où se poser pour une action : près de son point (ou de son passant), sur une case libre, tourné vers elle
POSER = """(id) => {
  const M = balade.monde(), L = M.lieu, mo = L.monde, e = balade.etat, jeu = balade.jeu;
  let i = L.interactions.find((q) => q.id === id), x, z, y, r;
  if (id === 'marchand') { x = L.marchand.x; z = L.marchand.z; r = 1.5; y = mo.hauteur(x, z, 50); }
  else if (!i) return { erreur: 'action introuvable : ' + id };
  else if (i.passant) { const p = M.passants.find((q) => q.id === i.passant); if (!p) return { erreur: 'passant absent : ' + i.passant }; x = p.etat.x; z = p.etat.z; y = p.etat.y; r = p.ronde ? 0.95 : 1.3; }
  else { x = i.x; z = i.z; y = i.y ?? mo.hauteur(x, z, 50); r = (i.rayon || 1.6) * 0.5; if (i.si && !i.si(jeu)) return { erreur: 'action fermée (si) : ' + id }; }
  // (d'abord tout près du point lui-même, s'il est libre ; sinon autour)
  const essais = [];
  if (!i || !i.passant) essais.push([x, z]);
  for (const d of [r, r * 0.7, r * 1.3, r * 1.6, r * 1.85]) for (let k = 0; k < 16; k++) { const a = (k / 16) * 2 * Math.PI; essais.push([x + Math.sin(a) * d, z + Math.cos(a) * d]); }
  for (const [px, pz] of essais) {
    const h = mo.hauteur(px, pz, y + 0.6);
    if (Math.abs(h - y) > 0.9 || !mo.libre(px, pz, h) || !window.__ou(px, pz)) continue;
    const [vx, vz] = (i && i.vers) || [x, z];
    e.x = px; e.z = pz; e.y = h; e.cap = Math.atan2(vx - px, vz - pz); e.vx = e.vz = 0;
    balade.jeu.cameraDerriere(0);
    return { x: +px.toFixed(2), z: +pz.toFixed(2), y: +h.toFixed(2), marche: !!(i && i.passant && M.passants.find((q) => q.id === i.passant).ronde) };
  }
  return { erreur: 'aucune case libre près de ' + id };
}"""

bilan, images = [], []
def photo(p, nom):
    f = D / f'{len(images):03d}_{nom}.png'
    p.screenshot(path=str(f)); images.append((nom, f))

with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    ctx = nav.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True) if TEL else nav.new_context(viewport={'width': 1280, 'height': 720})
    p = ctx.new_page()
    erreurs = []
    p.on('pageerror', lambda e: (erreurs.append(str(e)), print('ERREUR page :', e)))
    p.on('console', lambda m: (erreurs.append(m.text[:300]), print('console :', m.text[:300])) if m.type == 'error' and 'supported source' not in m.text and 'favicon' not in m.text else None)
    url = f'http://localhost:{PORT}/balade/?lieu=iiyama&perso={PERSO}&langue={LANGUE}&compagnon=kon'
    p.goto(url)
    p.evaluate("localStorage.clear(); localStorage.setItem('baladeYakushima', 'oui')")
    if '--visiteur' not in sys.argv: p.evaluate("localStorage.setItem('modeDev', 'oui')")
    p.goto(url)
    p.wait_for_function('window.__pret === true', timeout=180000)
    p.add_style_tag(content='.aide, .rappel-compagnon { display: none !important; }')

    def avancer(choix, duree=40, bouee=False, pause=1.4, non=False, peu=False):
        """Fait avancer ce qui se dit jusqu'au calme ; rend les textes, les questions vues."""
        dits, questions, t, calme, dernier, tph = [], [], 0.0, 0.0, '', 0.0
        choix = list(choix)
        gauche = droite = haut = False
        file_u = []
        while t < duree:
            p.wait_for_timeout(60 if bouee else 180); t += 0.06 if bouee else 0.18
            s = p.evaluate(ETAT)
            g = s['glisse']
            if g and s['mode'] != 'jeu':
                calme = 0; continue
            if g:
                calme = 0
                # le pilote : ramener la bouée au milieu (avec HABILE secondes de retard), se pencher en avant
                file_u.append((t, g['u']))
                while len(file_u) > 1 and file_u[1][0] <= t - HABILE: file_u.pop(0)
                u = file_u[0][1] if HABILE < 5 else 0
                veutG, veutD = (u > 0.12 and not SANSVIRER), (u < -0.12 and not SANSVIRER)
                if veutG != gauche: (p.keyboard.down if veutG else p.keyboard.up)('ArrowLeft'); gauche = veutG
                if veutD != droite: (p.keyboard.down if veutD else p.keyboard.up)('ArrowRight'); droite = veutD
                veutH = POUSSE and (HABILE < 5 or SANSVIRER) and not g['fini']
                if veutH != haut: (p.keyboard.down if veutH else p.keyboard.up)('ArrowUp'); haut = veutH
                if t - tph > 2.6: photo(p, 'bouee'); tph = t
                continue
            for k, tenu in (('ArrowLeft', gauche), ('ArrowRight', droite), ('ArrowUp', haut)):
                if tenu: p.keyboard.up(k)
            gauche = droite = haut = False
            if s['choix']:
                calme = 0
                if s['texte'] != dernier: dits.append(s['texte'].replace('\n', ' / ')); dernier = s['texte']
                n = choix.pop(0) if choix else (len(s['choix']) - 1 if non else 0)
                questions.append((s['choix'], n))
                if not peu: photo(p, 'question')
                for _ in range(n): p.keyboard.press('ArrowDown'); p.wait_for_timeout(90)
                p.keyboard.press('Enter'); p.wait_for_timeout(250)
            elif s['texte']:
                calme = 0
                if s['texte'] != dernier:
                    dits.append(s['texte'].replace('\n', ' / ')); dernier = s['texte']
                    if peu and len(dits) == 1:
                        p.keyboard.press('KeyE'); p.wait_for_timeout(420); photo(p, nom_photo); continue
                    if not peu and (len(dits) <= 2 or len(dits) % 3 == 0): photo(p, 'dit')
                p.keyboard.press('KeyE')
            else:
                dernier = ''
                if s['fenetres']:
                    return dits, questions, s
                if s['mode'] == 'jeu':
                    calme += 0.18
                    if calme >= pause: return dits, questions, s
                else:
                    calme = 0
                    if not peu and t - tph > 2.4: photo(p, 'scene'); tph = t
        return dits, questions, p.evaluate(ETAT)

    nom_photo = 'dit'
    d0, _, s = avancer([], duree=25)
    print('départ :', s['x'], s['z'], '|', ' / '.join(d0)[:200])
    p.evaluate(PRE)
    photo(p, 'depart')
    if NUIT:
        p.evaluate("balade.jeu.nuit(true)"); p.wait_for_timeout(3200)
    if TOUT:
        ids = p.evaluate("balade.monde().lieu.interactions.filter((i) => i.x != null || i.passant).map((i) => i.id)")
        ETAPES = [dict(id=i, tout=True) for i in ids if not SEUL or i in SEUL.split(',')]
    for E in ETAPES:
        nom_photo = E['id']
        r = {'id': E['id'], 'defauts': []}
        avant = p.evaluate(ETAT)
        pos = p.evaluate(POSER, E['id'])
        if pos.get('erreur'):
            r['defauts'].append(pos['erreur']); bilan.append(r); print('  !!', E['id'], pos['erreur']); continue
        p.wait_for_timeout(700 if not pos.get('marche') else 260)
        s = p.evaluate(ETAT)
        # (une scène qui s'ouvre d'elle-même en arrivant : le chauffeur qui appelle qui passe près de lui, 2026-11-20)
        if s['texte'] or s['mode'] != 'jeu':
            d_avant, _, s = avancer([], duree=15)
            print('       scène en arrivant :', ' / '.join(d_avant)[:160])
            p.wait_for_timeout(400); s = p.evaluate(ETAT)
        r['bulle'] = s['bulle']
        if not s['bulle']: r['defauts'].append('pas de bulle d\'action')
        if not E.get('tout'): photo(p, f"{E['id']}_bulle")
        n0 = len(s['agi'])
        p.keyboard.press('KeyE')
        dits, questions, s = avancer(E.get('choix', []), duree=E.get('long', 45), bouee=E.get('bouee', False), non=E.get('tout', False), peu=E.get('tout', False))
        r['agi'] = s['agi'][n0:]
        if E['id'] != 'marchand' and E['id'] != 'sumi' and not E['id'].startswith('tableau') and (not r['agi'] or r['agi'][0] != E['id']): r['defauts'].append(f"action lancée : {r['agi']} (attendue : {E['id']})")
        r['dits'], r['questions'] = dits, questions
        if s['fenetres']:
            r['fenetre'] = s['fenetres']
            p.wait_for_timeout(900); photo(p, f"{E['id']}_fenetre")
            p.keyboard.press('Escape'); p.wait_for_timeout(600)
            d2, q2, s = avancer([1], duree=12)
            r['dits'] += d2
            s2 = p.evaluate(ETAT)
            if s2['fenetres']: r['defauts'].append(f"la fenêtre reste : {s2['fenetres']}")
        if not E.get('tout'): photo(p, f"{E['id']}_fin")
        T = json.loads(s['tampons'] or '{}')
        mes = T.get('iiyama', []) if isinstance(T, dict) else []
        r['tampons'] = mes
        if E.get('tampon') and E['tampon'] not in json.dumps(mes): r['defauts'].append(f"tampon {E['tampon']} absent : {mes}")
        if E.get('rien') and E['rien'] in json.dumps(mes): r['defauts'].append(f"tampon {E['rien']} donné trop tôt")
        if 'nuit' in E and s['nuit'] != E['nuit']: r['defauts'].append(f"nuit : {s['nuit']} (attendu : {E['nuit']})")
        if E.get('zone') and (s['z'] < -232) != (E['zone'] == 'B'): r['defauts'].append(f"zone : z = {s['z']} (attendue : {E['zone']})")
        if E.get('secret') and E['secret'] not in (s['secrets'] or ''): r['defauts'].append(f"secret absent : {s['secrets']}")
        if E.get('bouee'): r['records'] = s['records']
        if s['mode'] != 'jeu': r['defauts'].append(f"mode à la fin : {s['mode']}")
        r['fin'] = [s['x'], s['y'], s['z']]
        bilan.append(r)
        print(('  ok ' if not r['defauts'] else '  !! ') + E['id'], '| bulle :', r.get('bulle'), '| action :', r.get('agi'), '| tampons :', mes, '| fin :', r['fin'], '| nuit :', s['nuit'], ('| ' + str(r.get('records')) if E.get('bouee') else ''))
        for q in questions: print('       question :', q)
        for t in r['dits']: print('       «', t[:260], '»')
        for x in r['defauts']: print('       DÉFAUT :', x)
    fin = p.evaluate("({ tampons: localStorage.getItem('baladeTampons'), secrets: localStorage.getItem('baladeSecrets'), tenue: localStorage.getItem('baladeTenue'), gagnees: localStorage.getItem('baladeTenuesVues'), sac: localStorage.getItem('baladeSac'), koban: localStorage.getItem('baladeKoban'), cles: Object.keys(localStorage) })")
    print('à la fin :', json.dumps(fin, ensure_ascii=False))
    print('erreurs de page :', len(erreurs))
    nav.close()

json.dump({'bilan': bilan, 'erreurs': erreurs}, io.open(D / 'voyage.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
# les planches : douze images par planche
police = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 17)
par = 12
for n in range(0, len(images), par):
    lot = images[n:n + par]
    w0, h0 = Image.open(lot[0][1]).size
    W = 300 if TEL else 480; H = round(h0 * W / w0); col = 6 if TEL else 4; lig = math.ceil(len(lot) / col)
    P = Image.new('RGB', (col * W + (col - 1) * 4, lig * H + (lig - 1) * 4), '#1e1e1e')
    d = ImageDraw.Draw(P)
    for i, (nom, f) in enumerate(lot):
        x, y = (i % col) * (W + 4), (i // col) * (H + 4)
        P.paste(Image.open(f).convert('RGB').resize((W, H), Image.LANCZOS), (x, y))
        d.rectangle([x, y, x + 10 + d.textlength(nom, font=police), y + 24], fill='#000000'); d.text((x + 5, y + 3), nom, fill='#ffe066', font=police)
    P.save(D / f'planche_{n // par:02d}.jpg', quality=86)
print('planches :', math.ceil(len(images) / par), 'dans', D)
print('défauts :', sum(len(r['defauts']) for r in bilan))
