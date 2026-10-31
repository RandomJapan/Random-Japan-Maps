"""La voix off de la vidéo « minuit » (la dernière nuit d'Halloween sur la carte), générée le 2026-10-31 avec Flora
(le connecteur du propriétaire) : ElevenLabs v4, voix « George » (le conteur britannique grave des vidéos d'Halloween du
21 octobre), en anglais, stabilité 0,4 (environ 0,05 $ la réplique). Ce script les retélécharge dans
videos/carte/minuit/public/voix (pas dans git) et resserre chacune dans voix/court/<nom>.wav : silences du début et de
la fin coupés, pauses ramenées à 0,2 s, un peu accélérée si besoin (atempo : la hauteur ne change pas). Le texte est noté
pour mémoire. Les répliques en deux temps sont coupées à leur pause (COUPES), pour placer chaque morceau avec son texte
à l'écran.
    python outils/video/minuit/voix.py
    python outils/video/minuit/voix.py mesurer m1 m3    # où parle-t-il dans ces répliques (pour choisir les coupes)
"""
import shutil
import subprocess
import sys
import urllib.request
import wave
from pathlib import Path

PUBLIC = Path(__file__).resolve().parents[3] / 'videos' / 'carte' / 'minuit' / 'public'
B = 'https://media.flora.ai/node-inputs/2026/10/31/px7fsq65yzz1brtqt0dbcj4s6s8gny2h/gen-'
# nom : (génération Flora, texte, accélération)
VOIX = {
    'm1': ('m17aj2ca98mdatevjvz4pjps258habpb', 'This map is haunted... until midnight.', 1.0),
    'm2': ('m172jz8kqsgnk2yr3ebs2b21ch8hbz48', 'Every pin wears a witch hat,', 1.0),
    'm3': ('m171n68q85ft14taq367kevvbn8hbjyb', 'summon the Night Parade... of a hundred demons,', 1.0),
    'm4': ('m17devdvs6g9f8neajq496xbwh8ha4sf', 'and hunt seven hidden yokai!', 1.0),
    'm5': ('m17dat43c5dterdrt88bwbryj18ha3ey', 'But at midnight... it all disappears.', 1.0),
    'm6': ('m17c5z1mhqd6dcn91fnahxdjxx8hb8cn', 'Tonight is the last night. Link in bio!', 1.0),
}
# morceau : (début, fin) en secondes dans voix/court/<réplique>.wav (fin None : jusqu'au bout)
COUPES = {
    'm1': {'m1a': (0, 1.66), 'm1b': (1.95, None)},
    'm3': {'m3a': (0, 1.62), 'm3b': (1.88, None)},
    'm5': {'m5a': (0, 0.95), 'm5b': (1.22, None)},
    'm6': {'m6a': (0, 1.8), 'm6b': (1.98, None)},
}


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def mesurer(nom):
    """Les moments où il parle dans voix/court/<nom>.wav : ce qui dépasse -38 dB par tranches de 10 ms, les silences
    de moins de 60 ms ne coupent pas (une pause entre deux phrases fait 0,2 à 0,45 s)."""
    import numpy as np
    with wave.open(str(PUBLIC / 'voix' / 'court' / f'{nom}.wav')) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, w.getnchannels()).mean(axis=1) / 32768
        sr = w.getframerate()
    pas = sr // 100
    k = len(x) // pas
    actif = 20 * np.log10(np.sqrt((x[:k * pas].reshape(k, pas) ** 2).mean(axis=1) + 1e-12)) > -38
    morceaux, debut, silence = [], None, 0
    for i, a in enumerate(actif):
        if a:
            debut, silence = (i if debut is None else debut), 0
        elif debut is not None:
            silence += 1
            if silence >= 6:
                morceaux.append(f'{debut / 100:.2f}-{(i - silence + 1) / 100:.2f}')
                debut, silence = None, 0
    if debut is not None:
        morceaux.append(f'{debut / 100:.2f}-{(k - silence) / 100:.2f}')
    print(f'{nom} ({len(x) / sr:.2f} s) :', '  '.join(morceaux))


def main():
    if sys.argv[1:2] == ['mesurer']:
        for nom in sys.argv[2:] or [p.stem for p in sorted((PUBLIC / 'voix' / 'court').glob('*.wav'))]:
            mesurer(nom)
        return
    (PUBLIC / 'voix' / 'court').mkdir(parents=True, exist_ok=True)
    for nom, (gen, _texte, vitesse) in VOIX.items():
        f = PUBLIC / 'voix' / f'{nom}.mp3'
        if not f.exists():
            urllib.request.urlretrieve(f'{B}{gen}-0.mp3', f)
        court = PUBLIC / 'voix' / 'court' / f'{nom}.wav'
        filtre = ('silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_duration=0.2:'
                  'stop_threshold=-42dB:stop_silence=0.2,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse')
        if vitesse != 1:
            filtre += f',atempo={vitesse}'
        subprocess.run([ffmpeg(), '-loglevel', 'error', '-y', '-i', str(f), '-af', filtre, '-ar', '48000', str(court)], check=True)
        for morceau, (de, a) in COUPES.get(nom, {}).items():
            # un fondu de 10 ms à chaque bout : pas de clic à la coupe
            fin = f':end={a}' if a is not None else ''
            subprocess.run([ffmpeg(), '-loglevel', 'error', '-y', '-i', str(court), '-af',
                            f'atrim=start={de}{fin},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,areverse,afade=t=in:d=0.01,areverse',
                            '-ar', '48000', str(court.with_name(f'{morceau}.wav'))], check=True)
    print('voix prêtes dans', PUBLIC / 'voix')


if __name__ == '__main__':
    main()
