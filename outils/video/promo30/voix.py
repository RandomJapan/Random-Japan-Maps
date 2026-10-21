"""La voix off de la vidéo promo de 30 s, générée le 2026-10-21 avec Flora (le connecteur du propriétaire : ElevenLabs
v3, voix « Sarah », une voix féminine posée et chaleureuse de publicité, en anglais comme les vidéos du compte).
Les fichiers vont dans videos/promo30/public/voix (pas dans git) ; ce script les retélécharge depuis Flora. Chaque
réplique est resserrée dans voix/court/<nom>.wav : silences du début et de la fin coupés, pauses ramenées à 0,2 s,
un peu accélérée (atempo ≤ 1,15 : la hauteur ne change pas) pour tenir dans les 30 s avec la musique. Le texte de chaque réplique est noté pour mémoire (les balises [excited]… dirigent la voix).
    python outils/video/promo30/voix.py
"""
import shutil
import subprocess
import urllib.request
from pathlib import Path

DOSSIER = Path(__file__).resolve().parents[3] / 'videos' / 'promo30' / 'public' / 'voix'
B = 'https://media.flora.ai/node-inputs/2026/10/21/anonymous/'
# nom : (fichier chez Flora, texte, accélération)
VOIX = {
    'v1-reve': ('a7f03792-a47e-4101-a767-34e5724677e1.mp3', '[warmly] Ever dreamed of exploring Japan... in 3D?', 1.0),
    'v2-carte': ('81d99308-2a2d-47d4-b86d-768c9a812b54.mp3', '[excited] Meet Random Japan Place: every place from our TikTok, on one living 3D map.', 1.12),
    'v3-video': ('ad5a3026-05f6-4a38-8dac-484c9efae6fc.mp3', 'Tap a place, and watch its video.', 1.1),
    'v4-de': ('233e5a22-0bd5-4cbf-934b-acf5072dc5ff.mp3', '[playfully] Feeling lucky? Roll the dice!', 1.1),
    'v5-route': ('b5dfe00d-89d8-481e-8b23-198f393fecd9.mp3', 'Save your favorites, and plan the perfect trip.', 1.1),
    'v6-legendes': ('9d88cb03-1b29-4036-8588-a75c57fddf6f.mp3', 'Hunt hidden legends... and watch the sea come alive!', 1.15),
    'v7-halloween': ('0b9cecf6-3f96-4aae-a73e-eef9d28d4315.mp3', '[mysteriously] And until October thirty-first... [excited] Halloween takes over!', 1.15),
    'v8-defile': ('16974ea4-4d56-4e3c-b126-28a68630bad7.mp3', 'Follow the Night Parade, and catch all seven yokai!', 1.12),
    'v9-fin': ('ac964c76-8d2b-4040-a57d-0038ce16b78b.mp3', '[confident] Random Japan Place. Explore it, free!', 1.15),
}


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def main():
    (DOSSIER / 'court').mkdir(parents=True, exist_ok=True)
    for nom, (fichier, _texte, vitesse) in VOIX.items():
        f = DOSSIER / f'{nom}.mp3'
        if not f.exists():
            urllib.request.urlretrieve(B + fichier, f)
            print('voix :', nom)
        court = DOSSIER / 'court' / f'{nom}.wav'
        # les pauses ramenées à 0,2 s, le silence du début coupé, celui de la fin aussi (filtre inversé)
        filtre = ('silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_duration=0.2:'
                  'stop_threshold=-42dB:stop_silence=0.2,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse')
        if vitesse != 1:
            filtre += f',atempo={vitesse}'
        subprocess.run([ffmpeg(), '-loglevel', 'error', '-y', '-i', str(f), '-af', filtre, '-ar', '48000', str(court)], check=True)


if __name__ == '__main__':
    main()
