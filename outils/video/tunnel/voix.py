"""La voix off et les bruitages faits pour la vidéo « tunnel », générés le 2026-10-21 avec Flora (le connecteur du
propriétaire) : la voix avec ElevenLabs v3, voix « Sarah » (féminine, chaleureuse, celle de la promo de 30 s), en
anglais ; quatre bruitages avec ElevenLabs Sound Effects (le tap, le « whoosh » du plongeon, le pop de la fiche, la
cascade de pops des épingles). Ce script les retélécharge dans videos/tunnel/public (pas dans git). Chaque réplique
est resserrée dans voix/court/<nom>.wav : silences du début et de la fin coupés, pauses ramenées à 0,2 s, un peu
accélérée (atempo ≤ 1,12 : la hauteur ne change pas). Le texte est noté pour mémoire (les balises dirigent la voix).
    python outils/video/tunnel/voix.py
"""
import shutil
import subprocess
import urllib.request
from pathlib import Path

PUBLIC = Path(__file__).resolve().parents[3] / 'videos' / 'tunnel' / 'public'
B = 'https://media.flora.ai/node-inputs/2026/10/21/'
# nom : (fichier chez Flora, texte, accélération)
VOIX = {
    'v1-trouve': ('anonymous/72b9cc93-e1ca-481d-974b-34d0176f1804.mp3', '[curious] You found a hidden place on TikTok...', 1.05),
    'v2-profil': ('anonymous/4c01ae94-2307-43be-9c4b-d50be39fb936.mp3', 'Tap the profile... every place, one link.', 1.05),
    'v3-plonge': ('anonymous/81f48762-7ee8-4130-831c-7f4d13935962.mp3', '[excited] Dive in!', 1.0),
    'v4-carte': ('anonymous/ced190f0-7da2-4369-a27b-1d6d915514e3.mp3', 'One 3D map. A hundred and forty places, all across Japan.', 1.18),
    'v5-epingles': ('anonymous/f58d1926-dfcb-48c9-b460-0fa4a1d5b6cf.mp3', 'Every pin is a place from the videos.', 1.05),
    'v6-fiche': ('anonymous/2df75cc5-c92d-4471-b24a-464b0b47fafb.mp3', 'Tap one: its story, its video, the way there.', 1.08),
    'v7-filtres': ('anonymous/31eb9c30-4255-4054-82b6-b895d860254e.mp3', 'Filter shrines, castles, waterfalls... in a tap.', 1.08),
    'v8-nom': ('anonymous/d199eceb-ead3-4845-bdd8-71e8c6c5d87d.mp3', '[confident] Random Japan Place.', 1.0),
    'v9-voyage': ('anonymous/a0ca39a0-9283-4c2f-91a0-3f645f3904ad.mp3', '[warmly] Your next trip starts here.', 1.0),
}
P = 'px7fsq65yzz1brtqt0dbcj4s6s8gny2h/'
SFX = {
    'tap': P + 'gen-m1719385d55p5r1cg1cgjjsn5h8gq85k-0.mp3',  # un tap d'écran net et sec
    'plongee': P + 'gen-m17a9gy94xv9d647h2gffpn8018gpvdp-0.mp3',  # un whoosh profond qui fonce, puis un impact grave
    'pop': P + 'gen-m171nf4s6dwy44kcwx21xfcz3x8gq2f8-0.mp3',  # le pop d'une fiche qui s'ouvre
    'pops': P + 'gen-m17cg4012ggszeaaqrzfrfjsb18gqrfy-0.mp3',  # une cascade de petits pops (les épingles)
}


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def main():
    (PUBLIC / 'voix' / 'court').mkdir(parents=True, exist_ok=True)
    (PUBLIC / 'sfx').mkdir(parents=True, exist_ok=True)
    for nom, fichier in SFX.items():
        f = PUBLIC / 'sfx' / f'{nom}.mp3'
        if not f.exists():
            urllib.request.urlretrieve(B + fichier, f)
    for nom, (fichier, _texte, vitesse) in VOIX.items():
        f = PUBLIC / 'voix' / f'{nom}.mp3'
        if not f.exists():
            urllib.request.urlretrieve(B + fichier, f)
        court = PUBLIC / 'voix' / 'court' / f'{nom}.wav'
        filtre = ('silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_duration=0.2:'
                  'stop_threshold=-42dB:stop_silence=0.2,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse')
        if vitesse != 1:
            filtre += f',atempo={vitesse}'
        subprocess.run([ffmpeg(), '-loglevel', 'error', '-y', '-i', str(f), '-af', filtre, '-ar', '48000', str(court)], check=True)
    print('voix et bruitages prêts dans', PUBLIC)


if __name__ == '__main__':
    main()
