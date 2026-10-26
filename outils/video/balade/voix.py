"""La voix off des trois vidéos de la balade 3D, générée le 2026-10-26 avec Flora (le connecteur du propriétaire) :
ElevenLabs v4, voix « Sarah » (celle de la promo de 30 s et de la vidéo « tunnel »), en anglais, stabilité 0,45
(environ 0,05 $ la réplique). Ce script les retélécharge dans videos/balade/public/voix (pas dans git) et resserre
chacune dans voix/court/<nom>.wav : silences du début et de la fin coupés, pauses ramenées à 0,2 s, un peu accélérée
si besoin (atempo : la hauteur ne change pas). Le texte est noté pour mémoire.
    python outils/video/balade/voix.py
"""
import shutil
import subprocess
import urllib.request
from pathlib import Path

PUBLIC = Path(__file__).resolve().parents[3] / 'videos' / 'balade' / 'public'
B = 'https://media.flora.ai/node-inputs/2026/10/26/px7fsq65yzz1brtqt0dbcj4s6s8gny2h/gen-'
# nom : (génération Flora, texte, accélération)
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
}


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def main():
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
    print('voix prêtes dans', PUBLIC / 'voix')


if __name__ == '__main__':
    main()
