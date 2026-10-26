"""Les bruitages de la balade 3D, en fichiers WAV pour ses vidéos : ceux de son.js (les petites notes des consoles :
le tampon, la récompense, le koban, l'achat, la magie, le daim sauvage…), joués hors temps réel (OfflineAudioContext),
et ceux de bruitage-calcul.js (fabriqués échantillon par échantillon : les cris des compagnons, le nuage, la rame,
le coq, le grondement de la grotte, les feux d'artifice…). Rien d'enregistré, aucun droit. Dans
videos/balade/public/sfx-jeu/<nom>.wav (48 kHz).

    python outils/video/balade/sons.py [--port 8123]

Il faut le site en local (python -m http.server 8123 --directory site), Microsoft Edge et Playwright.
"""
import base64
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

RACINE = Path(__file__).resolve().parents[3]
SORTIE = RACINE / 'videos' / 'balade' / 'public' / 'sfx-jeu'
PORT = sys.argv[sys.argv.index('--port') + 1] if '--port' in sys.argv else '8123'
# son.js : chaque son dure moins de 2 s
NOTES = ['bip', 'choix', 'tampon', 'pression', 'cadeau', 'sauvage', 'koban', 'achat', 'magie', 'declic']
# bruitage-calcul.js
CALCULES = ['pouf', 'cri/kon', 'cri/pon', 'cri/chapu', 'cri/gao', 'cri/fuwa', 'cri/saya', 'tambour', 'rame', 'coq', 'roc', 'slurp',
            'caillou', 'assiette', 'plouf', 'pelle', 'boite', 'feu/depart', 'feu/boum', 'feu/crepite', 'oiseau/corbeau',
            'oiseau/mouette', 'cloche', 'claque', 'ebrouer', 'pas/sable/0', 'pas/sable/1', 'pas/herbe/0', 'pas/herbe/1']

WAV = """(canaux, sr) => {
  const n = canaux[0].length, nc = canaux.length, data = new DataView(new ArrayBuffer(44 + n * 2 * nc));
  const ecrire = (o, s) => { for (let i = 0; i < s.length; i++) data.setUint8(o + i, s.charCodeAt(i)); };
  ecrire(0, 'RIFF'); data.setUint32(4, 36 + n * 2 * nc, true); ecrire(8, 'WAVEfmt ');
  data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, nc, true); data.setUint32(24, sr, true);
  data.setUint32(28, sr * 2 * nc, true); data.setUint16(32, 2 * nc, true); data.setUint16(34, 16, true); ecrire(36, 'data'); data.setUint32(40, n * 2 * nc, true);
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) data.setInt16(44 + (i * nc + c) * 2, Math.max(-1, Math.min(1, canaux[c][i])) * 32767, true);
  const t = new Uint8Array(data.buffer);
  let s = '';
  for (let i = 0; i < t.length; i += 0x8000) s += String.fromCharCode(...t.subarray(i, i + 0x8000));
  return btoa(s);
}"""

RENDRE = """async ([noms, calcules]) => {
  const wav = %s;
  const sr = 48000, off = new OfflineAudioContext(2, sr * 2 * noms.length, sr);
  // son.js crée son contexte au premier son : ce sera celui-ci, dont on fait avancer le temps soi-même (un son toutes
  // les deux secondes)
  let T = 0;
  Object.defineProperty(off, 'currentTime', { get: () => T });
  Object.defineProperty(off, 'state', { get: () => 'running' });
  off.resume = async () => {};
  off.suspend = async () => {};
  window.AudioContext = function () { return off; };
  const { son } = await import('/balade/son.js');
  son.reveiller();
  noms.forEach((nom, k) => { T = 2 * k; son[nom](); });
  T = 0;
  const b = await off.startRendering();
  const sortie = {};
  noms.forEach((nom, k) => {
    const a = 2 * k * sr, z = a + 2 * sr;
    sortie[nom] = wav([b.getChannelData(0).slice(a, z), b.getChannelData(1).slice(a, z)], sr);
  });
  const { fabriquer } = await import('/balade/bruitage-calcul.js');
  for (const quoi of calcules) {
    const c = fabriquer(quoi, sr);
    sortie[quoi] = wav(Array.isArray(c) ? c : [c], sr);
  }
  return sortie;
}""" % WAV


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True)
        p = nav.new_page()
        p.on('pageerror', lambda e: print('erreur page :', e))
        p.goto(f'http://localhost:{PORT}/balade/textes.js')
        sons = p.evaluate(RENDRE, [NOTES, CALCULES])
        for nom, donnees in sons.items():
            f = SORTIE / (nom.replace('/', '-') + '.wav')
            f.write_bytes(base64.b64decode(donnees))
        print(len(sons), 'sons dans', SORTIE, flush=True)
        nav.close()


if __name__ == '__main__':
    main()
