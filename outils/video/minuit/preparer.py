"""Les bruitages de la vidéo « minuit », dans videos/carte/minuit/public/sfx (le dossier « public » du montage, pas dans
git), repris des vidéos d'avant : ceux de video-shotcraft dont la source Mixkit est notée et ceux faits avec Flora (le
tap, le pop, la cascade de pops et le plongeon de la vidéo « tunnel », le sceau de la promo de 30 s, le tonnerre des
vidéos d'Halloween), et deux sons du jeu de la balade (sons.py : la cloche, que la vidéo fait sonner à minuit, et le
« pouf » des yōkai qui disparaissent) ; et le logo pour la fin (ui/logo.jpg, celui de la vidéo « tunnel »). Le tic-tac
de l'horloge et le coup sourd de minuit sont composés par musique.py ; les prises (rushes.py), les captures
(captures.py) et la voix (voix.py) se font à part.
    python outils/video/minuit/preparer.py
"""
import shutil
from pathlib import Path

RACINE = Path(__file__).resolve().parents[3]
PUBLIC = RACINE / 'videos' / 'carte' / 'minuit' / 'public'
SOURCES = {
    RACINE / 'videos' / 'carte' / 'tunnel' / 'public' / 'sfx': [
        'tap.mp3', 'pop.mp3', 'pops.mp3', 'plongee.mp3', 'whoosh-fast.mp3', 'swoosh-quick.mp3', 'zoom-air-fast.mp3',
        'bass-hit-short.mp3', 'air-whoosh-powerful.mp3', 'paper-slide.mp3', 'paper-move-quick.mp3', 'sparkle-touch.mp3',
        'shimmer-sparkle-sweep.mp3', 'ui-message-pop.mp3', 'ui-success-soft.mp3', 'transition-snap.mp3'],
    RACINE / 'videos' / 'carte' / 'promo30' / 'public' / 'sfx': ['tampon.mp3'],
    RACINE / 'videos' / 'carte' / 'halloween' / 'public' / 'sfx': ['tonnerre.mp3', 'wing-flutter.mp3', 'impact-zoom-quick.mp3'],
    RACINE / 'videos' / 'balade' / 'public' / 'sfx-jeu': ['kane.wav', 'pouf.wav'],
}


def main():
    (PUBLIC / 'sfx').mkdir(parents=True, exist_ok=True)
    for dossier, noms in SOURCES.items():
        for nom in noms:
            shutil.copyfile(dossier / nom, PUBLIC / 'sfx' / nom)
    (PUBLIC / 'ui').mkdir(exist_ok=True)
    shutil.copyfile(RACINE / 'videos' / 'carte' / 'tunnel' / 'public' / 'tiktok' / 'avatar.jpg', PUBLIC / 'ui' / 'logo.jpg')
    print('bruitages prêts dans', PUBLIC / 'sfx')


if __name__ == '__main__':
    main()
