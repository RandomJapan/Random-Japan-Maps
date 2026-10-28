"""La voix off des vidéos de la balade 3D, générée le 2026-10-26 (le 2026-10-27 pour la vidéo du Pavillon d'or, le 2026-10-28 pour Beppu) avec Flora (le connecteur du propriétaire) :
ElevenLabs v4, voix « Sarah » (celle de la promo de 30 s et de la vidéo « tunnel »), en anglais, stabilité 0,45
(environ 0,05 $ la réplique). Ce script les retélécharge dans videos/balade/public/voix (pas dans git) et resserre
chacune dans voix/court/<nom>.wav : silences du début et de la fin coupés, pauses ramenées à 0,2 s, un peu accélérée
si besoin (atempo : la hauteur ne change pas). Le texte est noté pour mémoire. Les répliques longues sont aussi coupées
à leurs pauses (COUPES), pour placer chaque morceau avec son texte à l'écran.
    python outils/video/balade/voix.py
    python outils/video/balade/voix.py mesurer b5 c7    # où parle-t-elle dans ces répliques (pour choisir les coupes)
"""
import shutil
import subprocess
import sys
import urllib.request
import wave
from pathlib import Path

PUBLIC = Path(__file__).resolve().parents[3] / 'videos' / 'balade' / 'public'
B = 'https://media.flora.ai/node-inputs/2026/10/{jour}/px7fsq65yzz1brtqt0dbcj4s6s8gny2h/gen-'
# nom : (génération Flora, texte, accélération[, jour d'octobre de la génération : le 26 sinon])
VOIX = {
    # vidéo 1 : la balade, les cinq lieux
    'a1': ('m17ewfsea8bz6k540mrf2qzg7h8h19rd', 'I turned the places from my videos... into a video game.', 1.0),
    'a2': ('m176q2fr44662rnvm5d9z1kbqs8h0bzj', 'Five real places, rebuilt in 3D.', 1.0),
    'a3': ('m179mtszv3zkx9bwa8s6dg49yd8h1vza', 'Pick your companion!', 1.0),
    'a4': ('m174vrj5cd4dbt8hs8e708ew4x8h1dvk', 'Talk to everyone, collect stamps... and find the secrets.', 1.0),
    'a5': ('m178bm10znp8vq375szejqc3vx8h0mb1', "It's free, right on my map.", 1.0),
    'a6': ('m174gs6066yc680vxttrese4sh8h1heq', 'Link in bio!', 1.0),
    # vidéo 2 : Takachiho
    'b1': ('m176ywyrhk2zd44zgtk1w8218h8h0vmw', 'This gorge in Japan hides a legend...', 1.0),
    'b2': ('m17eyhz5zv8swyhhgr2jxxxgfn8h0qs9', 'Row under the waterfall,', 1.0),
    'b3': ('m174q1xw90jt2kgdsj7f2ab5hh8h1axy', 'catch flowing noodles,', 1.0),
    'b4': ('m176tqjv31cj2ye5tw9gnbpm658h1v54', 'watch the gods dance at night...', 1.0),
    'b5': ('m17bq95fneedxg5cn8wzwjd3dx8h0ahc', 'But look closely. Something shines on the cliff.', 1.0),
    'b6': ('m172c9ng833mnyaa8vac6rryhs8h1jrf', 'Hang the mirror facing the cave... and bring back the sun!', 1.0),
    'b7': ('m17djzrvb6h1jcws19y5m71sj58h0t0x', 'Takachiho, in 3D. Link in bio.', 1.0),
    # vidéo 3 : les secrets
    'c1': ('m17abgkykdcsrf06t1kk3wgxj98h03tt', 'Every place in my game hides a secret.', 1.0),
    'c2': ('m176072ycbq3xf0y5904pm5eqn8h00bb', 'Follow the sacred crows,', 1.0),
    'c3': ('m17c8vy74p510kg9697ryvrc0x8h1wdc', 'dig up a treasure,', 1.0),
    'c4': ('m17424cq9y3hhsw45fcp5ch6sn8h1746', 'chase a golden firefly,', 1.0),
    'c5': ('m17a08hg9fkycfqq2eqfet0tx58h1cdd', 'give a ghost her very last plate...', 1.0),
    'c6': ('m1758j4czq3q0rsaqedegx2fg98h1egs', "Each secret gives you a gold koban. Spend them at Bunbuku's shop!", 1.0),
    'c7': ('m17f3546rzhqqdmarkz6rtb98x8h01je', 'Fireworks, samurai armor, secret companions...', 1.0),
    'c8': ('m178ypcv5k6e51dq70gvkz4bj98h04xf', 'Can you find all five? Link in bio.', 1.0),
    # vidéo 4 : le Pavillon d'or (2026-10-27)
    'd1': ('m17b734carhh81pgtanhcbkx4h8h3r4y', 'I rebuilt the Golden Pavilion... in my video game!', 1.0, 27),
    'd2': ('m175jpqfkf1xy864b1syzh8ns58h2w6c', 'Its pond is a real mirror.', 1.1, 27),
    'd3': ('m17fxd81fd3gzwzgyqqvg793jh8h2a1a', 'Watch the carp leap,', 1.0, 27),
    'd4': ('m17efna8pg75nffczwhczmetzx8h3cwe', 'toss a coin for luck,', 1.0, 27),
    'd5': ('m17492gqkc46fc2f29vkt3w7x58h30vd', 'sip matcha,', 1.0, 27),
    'd6': ('m17589rxdv9d0bzx4p9wgag8n98h3016', 'get your temple seal...', 1.0, 27),
    'd7': ('m179gf3ne4g1jmnj0c1bvdkst58h22ea', 'and earn the phoenix wings!', 1.0, 27),
    'd8': ('m17b2ecpshxbh3pr4eknjsv1z18h25ra', 'But at night... the phoenix vanishes from the reflection!', 1.0, 27),
    'd9': ('m17dbafwdchs9wgb1xc5vymfkh8h3mk6', 'Can you find where it went?', 1.0, 27),
    'd10': ('m17fjvb8e4k57744wqyxah3hgn8h26ae', 'Kinkaku-ji, in 3D. Link in bio.', 1.0, 27),
    # vidéo 5 : les Enfers de Beppu (2026-10-28)
    'e1': ('m1793k4jeygtqvqzh77v86t0358h4w2g', 'I rebuilt the Hells of Beppu... in my video game!', 1.0, 28),
    'e2': ('m170zxjbjpbbbqbsxknbrsbwph8h5zgc', 'Even the streets steam!', 1.1, 28),
    'e10': ('m17db6cg080qjfjstf11wxnf118h4gqb', 'Get all five stamps... and earn the oni horns!', 1.1, 28),
    'e11': ('m17dmm0ftyrmvzg6ttv93ys9w58h519a', 'But the monk Ippen hid three stones...', 1.1, 28),
    'e12': ('m17dnht5t30zf60yb9fdpqre4x8h573m', 'Throw each one into a different hell!', 1.1, 28),
    'e13': ('m17dff671abavfb2cjxk0g8g6s8h5ve9', 'Can you find them?', 1.0, 28),
    'e14': ('m1768wg1aj2640txb2g056ngt18h5nm9', 'Beppu, in 3D. Link in bio.', 1.0, 28),
    # (la liste des enfers d'une traite, coupée à ses pauses : générées une par une, ces sept répliques duraient 1,5 à 2,4 s,
    # trop pour un plan de trois temps (1,67 s à 108 battements) ; dans une énumération, la voix va plus vite)
    'f1': ('m17c9nwwms3hn2m7mekrjk67gd8h42c6', 'Boil eggs in a blue hell, watch the mud bubble, hear an oni snore, meet the big red demon,', 1.2, 28),
    'f2': ('m17anx8gekgjcs3fdbyz6as1z98h5vgm', 'see a milky white pond, a pond of blood... and a geyser under a stone roof!', 1.2, 28),
}
# Les répliques coupées à leurs pauses (secondes dans voix/court/<nom>.wav, mesurées le 2026-10-26) : chaque morceau
# se place avec son texte à l'écran. Sans ça, une réplique entière débordait sur la suivante (elles se superposaient)
# ou disait un mot pendant qu'un autre texte était affiché.
COUPES = {
    'a4': {'a4a': (0, 1.21), 'a4b': (1.40, 2.52), 'a4c': (2.72, None)},  # Talk to everyone, / collect stamps... / and find the secrets.
    'b5': {'b5a': (0, 1.32), 'b5b': (1.62, None)},  # But look closely. / Something shines on the cliff.
    'b6': {'b6a': (0, 1.97), 'b6b': (2.32, None)},  # Hang the mirror facing the cave... / and bring back the sun!
    'b7': {'b7a': (0, 0.68), 'b7b': (0.96, 1.90), 'b7c': (2.24, None)},  # Takachiho, / in 3D. / Link in bio.
    'c6': {'c6a': (0, 2.23), 'c6b': (2.50, None)},  # Each secret gives you a gold koban. / Spend them at Bunbuku's shop!
    'c7': {'c7a': (0, 0.92), 'c7b': (1.03, 2.23), 'c7c': (2.42, None)},  # Fireworks, / samurai armor, / secret companions...
    'c8': {'c8a': (0, 1.35), 'c8b': (1.66, None)},  # Can you find all five? / Link in bio.
    'd1': {'d1a': (0, 1.95), 'd1b': (2.08, None)},  # I rebuilt the Golden Pavilion... / in my video game!
    'd8': {'d8a': (0, 1.05), 'd8b': (1.25, None)},  # But at night... / the phoenix vanishes from the reflection!
    'd10': {'d10a': (0, 0.80), 'd10b': (0.95, 2.00), 'd10c': (2.12, None)},  # Kinkaku-ji, / in 3D. / Link in bio.
    # (Beppu, 2026-10-28)
    'e1': {'e1a': (0, 1.95), 'e1b': (2.15, None)},  # I rebuilt the Hells of Beppu... / in my video game!
    'f1': {'f1a': (0, 1.60), 'f1b': (1.86, 3.22), 'f1c': (3.42, 4.67), 'f1d': (4.84, None)},  # Boil eggs in a blue hell, / watch the mud bubble, / hear an oni snore, / meet the big red demon,
    'f2': {'f2a': (0, 1.53), 'f2b': (1.80, 3.00), 'f2c': (3.28, None)},  # see a milky white pond, / a pond of blood... / and a geyser under a stone roof!
    'e10': {'e10a': (0, 1.56), 'e10b': (1.68, None)},  # Get all five stamps... / and earn the oni horns!
    'e14': {'e14a': (0, 0.62), 'e14b': (0.74, 1.86), 'e14c': (2.02, None)},  # Beppu, / in 3D. / Link in bio.
}


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def mesurer(nom):
    """Les moments où elle parle dans voix/court/<nom>.wav : ce qui dépasse -38 dB par tranches de 10 ms, les silences
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
    for nom, (gen, _texte, vitesse, *jour) in VOIX.items():
        f = PUBLIC / 'voix' / f'{nom}.mp3'
        if not f.exists():
            urllib.request.urlretrieve(f'{B.format(jour=jour[0] if jour else 26)}{gen}-0.mp3', f)
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
