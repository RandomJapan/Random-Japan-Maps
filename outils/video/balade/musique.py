"""Les airs de la balade 3D (site/balade/musique.js), en fichiers WAV pour les vidéos de la balade : ils sont joués
note à note par le navigateur, ici hors temps réel (OfflineAudioContext), donc sans un craquement, et le premier
temps de l'introduction tombe à 0,15 s exactement (comme dans le jeu : commencer(), musique.js). Dans
videos/balade/public/musique/<air>.wav (48 kHz, stéréo).

    python outils/video/balade/musique.py [--port 8123]

Il faut le site en local (python -m http.server 8123 --directory site), Microsoft Edge et Playwright.
Les airs : odori (la danse des fêtes, 112 battements), et l'air de jour de chaque lieu (takachiho 92, aogashima 126, kinkakuji 84, beppu 108, motonosumi 100, sanjubutsu 76…).
"""
import base64
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

RACINE = Path(__file__).resolve().parents[3]
SORTIE = RACINE / 'videos' / 'balade' / 'public' / 'musique'
PORT = sys.argv[sys.argv.index('--port') + 1] if '--port' in sys.argv else '8123'
# l'air : sa durée (s)
AIRS = {'odori': 62, 'takachiho': 75, 'aogashima': 52, 'itsukushima': 70, 'gokayama': 70, 'himeji': 75, 'kinkakuji': 60, 'beppu': 60, 'motonosumi': 60, 'sanjubutsu': 60}

RENDRE = """async ([air, duree]) => {
  const { son } = await import('/balade/son.js');
  const { creerMusique } = await import('/balade/musique.js');
  const sr = 48000, off = new OfflineAudioContext(2, Math.round(sr * duree), sr);
  // le temps du contexte, que l'on fait avancer soi-même pendant que l'ordonnanceur de musique.js place les notes
  let T = 0;
  Object.defineProperty(off, 'currentTime', { get: () => T });
  Object.defineProperty(off, 'state', { get: () => 'running' });
  const sortie = off.createGain();
  sortie.gain.value = 2.4; // (son.js : la sortie commune)
  sortie.connect(off.destination);
  son.pret = () => off;
  son.sortie = () => sortie;
  let rappel = null;
  const si = window.setInterval, st = window.setTimeout;
  window.setInterval = (f) => { rappel = f; return 1; };
  window.setTimeout = (f) => { f(); return 1; };
  const m = creerMusique(air === 'odori' ? 'itsukushima' : air);
  if (air === 'odori') m.fete(true); else m.maj(0);
  window.setInterval = si; window.setTimeout = st;
  for (T = 0; T < duree; T += 0.05) rappel();
  T = 0;
  const b = await off.startRendering();
  // en WAV 16 bits
  const n = b.length, data = new DataView(new ArrayBuffer(44 + n * 4));
  const ecrire = (o, s) => { for (let i = 0; i < s.length; i++) data.setUint8(o + i, s.charCodeAt(i)); };
  ecrire(0, 'RIFF'); data.setUint32(4, 36 + n * 4, true); ecrire(8, 'WAVEfmt ');
  data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 2, true); data.setUint32(24, sr, true);
  data.setUint32(28, sr * 4, true); data.setUint16(32, 4, true); data.setUint16(34, 16, true); ecrire(36, 'data'); data.setUint32(40, n * 4, true);
  const g = b.getChannelData(0), d = b.getChannelData(1);
  let crete = 0;
  for (let i = 0; i < n; i++) {
    crete = Math.max(crete, Math.abs(g[i]), Math.abs(d[i]));
    data.setInt16(44 + i * 4, Math.max(-1, Math.min(1, g[i])) * 32767, true);
    data.setInt16(46 + i * 4, Math.max(-1, Math.min(1, d[i])) * 32767, true);
  }
  const t = new Uint8Array(data.buffer);
  let s = '';
  for (let i = 0; i < t.length; i += 0x8000) s += String.fromCharCode(...t.subarray(i, i + 0x8000));
  return { wav: btoa(s), crete };
}"""


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    voulus = [a for a in sys.argv[1:] if a in AIRS] or list(AIRS)
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True)
        p = nav.new_page()
        p.on('pageerror', lambda e: print('erreur page :', e))
        # une page vide du même site : les modules de la balade s'importent par leur adresse
        p.goto(f'http://localhost:{PORT}/balade/textes.js')
        for air in voulus:
            r = p.evaluate(RENDRE, [air, AIRS[air]])
            (SORTIE / f'{air}.wav').write_bytes(base64.b64decode(r['wav']))
            print(f'{air}.wav : {AIRS[air]} s, crête {r["crete"]:.3f}', flush=True)
        nav.close()


if __name__ == '__main__':
    main()
