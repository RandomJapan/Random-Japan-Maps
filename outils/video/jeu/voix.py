"""La voix off des deux vidéos du jeu, générée le 2026-11-09 avec Flora (le connecteur du propriétaire) : ElevenLabs v4, voix « Sarah »,
en anglais, stabilité 0,35 ; une seule génération par vidéo (0,048 $), dite d'une traite puis coupée à ses pauses : chaque morceau
est placé avec son texte à l'écran.
    python outils/video/jeu/voix.py            # télécharge, coupe : videos/carte/jeu/public/voix/<morceau>.wav et durees.json
    python outils/video/jeu/voix.py mesurer    # les morceaux trouvés, sans rien écrire

Un morceau = de la parole séparée du reste par plus de SILENCE secondes (mesuré tous les 10 ms, au-dessus de −36 dB). Si la liste
trouvée n'a pas le nombre de morceaux de NOMS, on s'arrête : la génération ne dit pas ce qu'on croit.
Chaque morceau est ramené au même niveau (RMS de sa parole), car Flora en sort certains 2 à 7 dB plus bas que les autres.
"""
import json
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np

PUBLIC = Path(__file__).resolve().parents[3] / 'videos' / 'carte' / 'jeu' / 'public'
B = 'https://media.flora.ai/node-inputs/2026/11/9/px7fsq65yzz1brtqt0dbcj4s6s8gny2h/gen-'
GEN = {
    'devine': (B + 'm17f0a3ww4d68x55nrjfhbayfx8hxf96-0.mp3',
               "You have three seconds. Where is this? / Bullseye! / Two seconds. / Not bad. / One second. / Far away... / And this one? / Time's up! / "
               "Comment your guess. / Can you beat my score? / Challenge your friends. / Guess the place. One hundred and sixty places. Free. Link in bio!"),
    'defi': (B + 'm175bwd6g5n4x8zphzrhw8nfks8hwa4q-0.mp3',
             "One blurry photo. Six tries. / Tap the map. / Cold. / Every miss makes it sharper. / Warm. / Hot! / Burning! / Found it! / "
             "Shirogane Blue Pond, in Hokkaido. / Share your score. / Same place for everyone. A new one every day. / Today's place is waiting. Link in bio!"),
}
NOMS = {
    'devine': ['d-3s', 'd-ou', 'd-bull', 'd-2s', 'd-pasmal', 'd-1s', 'd-loin', 'd-celui', 'd-temps', 'd-comment', 'd-battre', 'd-amis', 'd-titre', 'd-160', 'd-free', 'd-bio'],
    'defi': ['f-photo', 'f-essais', 'f-tap', 'f-froid', 'f-net', 'f-tiede', 'f-chaud', 'f-brule', 'f-trouve', 'f-nom', 'f-score', 'f-meme', 'f-jour', 'f-attend', 'f-bio'],
}
SILENCE = 0.14
# (les morceaux à réunir, par rang : une courte pause au milieu d'une phrase)
REUNIR = {'devine': [(0, 1)], 'defi': [(9, 10)]}
SR = 48000


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def lire(f):
    r = subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-i', str(f), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).copy()


def morceaux(x):
    pas = int(0.01 * SR)
    rms = np.sqrt(np.convolve(x * x, np.ones(pas) / pas, mode='same'))[::pas]
    parle = rms > 10 ** (-36 / 20)
    # (les bouts de moins de 40 ms ne comptent pas)
    spans, debut = [], None
    for i, p in enumerate(list(parle) + [False]):
        if p and debut is None:
            debut = i
        elif not p and debut is not None:
            if i - debut >= 4:
                spans.append([debut * 0.01, i * 0.01])
            debut = None
    fusion = [spans[0]]
    for a, z in spans[1:]:
        if a - fusion[-1][1] < SILENCE:
            fusion[-1][1] = z
        else:
            fusion.append([a, z])
    return fusion


def ecrire(x, f):
    p = (x * 32767).clip(-32768, 32767).astype('<i2')
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-ac', '2', str(f)], input=p.tobytes(), check=True)


def main():
    mesure = 'mesurer' in sys.argv
    (PUBLIC / 'voix').mkdir(parents=True, exist_ok=True)
    durees = {}
    for nom, (url, texte) in GEN.items():
        f = PUBLIC / 'voix' / f'{nom}.mp3'
        if not f.exists():
            urllib.request.urlretrieve(url, f)
        x = lire(f)
        sp = morceaux(x)
        for i, j in sorted(REUNIR[nom], reverse=True):
            sp[i:j + 1] = [[sp[i][0], sp[j][1]]]
        print(nom, f'{len(x) / SR:.2f} s', len(sp), 'morceaux (attendus', len(NOMS[nom]), ')')
        for k, (a, z) in enumerate(sp):
            print(f'  {NOMS[nom][k] if k < len(NOMS[nom]) else "?":10} {a:6.2f} → {z:6.2f}  ({z - a:.2f} s)')
        if mesure:
            continue
        assert len(sp) == len(NOMS[nom]), f'{nom} : {len(sp)} morceaux'
        for n, (a, z) in zip(NOMS[nom], sp):
            i0, i1 = int(max(0, a - 0.02) * SR), int((z + 0.05) * SR)
            m = x[i0:i1].copy()
            coeur = x[int(a * SR):int(z * SR)]
            m *= 10 ** (-20 / 20) / max(1e-6, np.sqrt(np.mean(coeur ** 2)))  # tous à −20 dB RMS
            f10 = int(0.008 * SR)
            m[:f10] *= np.linspace(0, 1, f10)
            m[-f10:] *= np.linspace(1, 0, f10)
            ecrire(m, PUBLIC / 'voix' / f'{n}.wav')
            durees[n] = round(len(m) / SR, 3)
    if not mesure:
        (Path(__file__).resolve().parent / 'montage' / 'src' / 'durees.json').write_text(json.dumps(durees, indent=0), encoding='utf-8')
        print('→', len(durees), 'morceaux')


if __name__ == '__main__':
    main()
