"""Prépare le dossier « public » du montage des vidéos d'Halloween (videos/halloween/public, pas dans git) :
les extraits des vidéos du propriétaire (9:16, H.264 30 images/s, sans le son), les musiques (site/musique, CC BY) et
les bruitages (ceux du skill video-shotcraft dont l'origine Mixkit est notée : licence libre, sans crédit).
Les rushes de la carte, eux, viennent de rushes.py.
    python outils/video/halloween/preparer.py
"""
import os
import shutil
import subprocess
from pathlib import Path

ICI = Path(__file__).resolve().parent
RACINE = ICI.parent.parent.parent
PUBLIC = RACINE / 'videos' / 'halloween' / 'public'
VIDEOS_LIEUX = Path(os.environ.get('VIDEOS_LIEUX', r'D:\Montage\Vidéo lieux random japon'))
SFX = Path.home() / '.claude' / 'skills' / 'video-shotcraft' / 'assets' / 'audio' / 'sfx'
# nom : (fichier, début en s, durée en s[, images/s]) — choisis sur des planches-contact (un plan fort, sans le titre incrusté)
EXTRAITS = {
    'tunnel-entree': ('Meiji Utsunoya Tunnel.mp4', 8.0, 4.0),  # l'entrée noire du tunnel dans la forêt
    'tunnel': ('Meiji Utsunoya Tunnel.mp4', 11.0, 6.0),  # dedans, sous les lampes
    'nagoro-classe': ('Nagoro Scarecrow Village.mp4', 34.0, 8.0),  # la salle de classe pleine de poupées
    'osorezan-jizo': ('Osorezan Bodaiji Temple.mp4', 15.5, 5.0),  # le jizō aux moulins à vent
    'osorezan-sol': ('Osorezan Bodaiji Temple.mp4', 35.0, 5.0),  # la terre volcanique nue
    'enfer-nuit': ('Hell Valley.mp4', 4.5, 9.0),  # Jigokudani la nuit : lanternes et vapeurs (mais le titre « HOKKAIDO » incrusté)
    'enfer-vapeur': ('Hell Valley.mp4', 14.9, 1.4, 60),  # la vapeur qui monte de la vallée : à 60 images/s, ralentie au montage
    'himeji-ombre': ('Himeji Castle.mp4', 6.0, 3.5),  # le donjon en ombre chinoise
}
MUSIQUES = ['peritune-kengeki', 'maou-bgm-ethnic09', 'maou-04-tsuki-to-okami']
BRUITAGES = ['impact/impact-epic-trailer', 'impact/impact-deep-whoosh', 'impact/bass-hit-short', 'impact/impact-zoom-quick',
             'transition/whoosh-fast', 'transition/swoosh-quick', 'transition/transition-snap', 'transition/air-woosh-quick',
             'transition/wing-flutter', 'crowd/heartbeat-single', 'data/glitch-static', 'light/light-spell',
             'light/shimmer-sparkle-sweep', 'ui/ui-success-soft', 'ui/ui-message-pop', 'paper/paper-slide']


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def main():
    (PUBLIC / 'clips').mkdir(parents=True, exist_ok=True)
    for nom, (source, debut, duree, *ips) in EXTRAITS.items():
        f = PUBLIC / 'clips' / f'{nom}.mp4'
        if f.exists():
            continue
        print('Extrait :', nom, flush=True)
        subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(debut), '-i', str(VIDEOS_LIEUX / source),
                        '-t', str(duree), '-an', '-vf', f'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps={ips[0] if ips else 30},format=yuv420p',
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-g', '15', '-movflags', '+faststart', str(f)], check=True)
    (PUBLIC / 'musique').mkdir(exist_ok=True)
    for m in MUSIQUES:
        shutil.copy2(RACINE / 'site' / 'musique' / f'{m}.m4a', PUBLIC / 'musique' / f'{m}.m4a')
    (PUBLIC / 'sfx').mkdir(exist_ok=True)
    for b in BRUITAGES:
        shutil.copy2(SFX / f'{b}.mp3', PUBLIC / 'sfx' / f'{b.split("/")[1]}.mp3')
    (PUBLIC / 'img').mkdir(exist_ok=True)
    shutil.copy2(RACINE / 'site' / 'img' / 'logo.jpg', PUBLIC / 'img' / 'logo.jpg')
    print('Prêt :', PUBLIC)


if __name__ == '__main__':
    main()
