"""Les images et les sons des vidéos de la balade 3D qui ne sont pas filmés dans la balade, dans videos/balade/public
(le dossier « public » du montage, pas dans git) :
- reels/<lieu>.mp4 : un passage de la vidéo du propriétaire de chaque lieu (le vrai lieu, que le montage fait glisser
  sur sa version du jeu), pris dans D:\\Montage\\Vidéo lieux random japon, sans titre incrusté, en H.264 60 images/s,
  couleurs notées (BT.709, plage TV) et une image clé toutes les 15 : le décodeur de Remotion le veut ainsi ;
- sfx/ : les bruitages repris des vidéos d'avant (ceux de video-shotcraft dont la source Mixkit est notée, et ceux faits
  avec Flora pour la promo de 30 s et la vidéo « tunnel ») ; les bruitages du jeu lui-même sont faits par sons.py ;
- logo.jpg : la photo du profil (le logo), en 800 px.
La musique (les airs du jeu) vient de musique.py, la voix de voix.py, les prises de rushes.py et carte.py.
    python outils/video/balade/preparer.py
"""
import shutil
import subprocess
import wave
from pathlib import Path

import numpy as np
from PIL import Image

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[2]
PUBLIC = RACINE / 'videos' / 'balade' / 'public'
VIDEOS_LIEUX = Path(r'D:\Montage\Vidéo lieux random japon')
SR = 48000
# le lieu : (fichier du propriétaire, début (s), durée (s)[, vitesse : moins de 1, ralenti]) : choisis sur des planches à
# une image par seconde
REELS = {
    'itsukushima': ('Itsukushima Shrine.mp4', 44.9, 3.2),  # le grand torii depuis la plage, à marée basse
    'aogashima': ('Aogashima.mp4', 38.25, 2.6),  # le belvédère rond de la crête, Maruyama dans le cratère
    'gokayama': ('Gokayama.mp4', 13.6, 2.6),  # le village et ses toits de chaume, les montagnes enneigées
    'himeji': ('Himeji Castle.mp4', 44.5, 2.4),  # le grand donjon, de face
    'takachiho': ('Takachiho gorge.mp4', 12.0, 2.2),  # la cascade de Manai vue de l'eau, les barques
    # le Pavillon d'or (vidéo 4) : le pavillon et son reflet à travers les pins, la cascade de la Porte du Dragon, le
    # goshuin dans la main (chaque passage tient dans un seul plan de la vidéo du propriétaire)
    # (des plans courts : un peu ralentis, ils tiennent jusqu'au bout du volet, panoramique éclair compris)
    'kinkakuji': ('Kinkaku-ji.mp4', 12.45, 1.2, 0.6),
    'kk-cascade': ('Kinkaku-ji.mp4', 20.5, 1.25, 0.85),
    'kk-goshuin': ('Kinkaku-ji.mp4', 29.5, 1.3, 0.85),
    # les Enfers de Beppu (vidéo 5) : l'eau turquoise qui fume, la boue grise qui bout en cercles, le lac de sang sous ses
    # fumées (pas les plans du début, où le titre « Beppu Onsen » du propriétaire est incrusté)
    'beppu': ('Hells of Beppu.mp4', 34.3, 1.5, 0.8),
    'bp-boue': ('Hells of Beppu.mp4', 9.3, 1.5),
    'bp-sang': ('Hells of Beppu.mp4', 18.8, 1.5),
    # le sanctuaire Motonosumi (vidéo 6) : les torii qui serpentent jusqu'à la mer, la descente dans le tunnel de torii, le grand
    # torii et son tronc des offrandes, la mer qui jaillit (pas les plans du début, où le titre « Motonosumi Shrine » est incrusté)
    'motonosumi': ('Motonosumi Shrine.mp4', 6.45, 1.5, 0.75),
    'mt-tunnel': ('Motonosumi Shrine.mp4', 24.15, 1.6),
    'mt-otorii': ('Motonosumi Shrine.mp4', 11.45, 1.5),
    'mt-souffle': ('Motonosumi Shrine.mp4', 27.9, 1.5),
    # les Trente Bouddhas (vidéo 7) : la brume et la lumière entre les cèdres (un plan court : ralenti), le torii de pierre entre
    # les deux Nio, le chemin qui monte à l'escalier, le pavillon sous la falaise (pas les plans du début, où le titre
    # « 三十仏の仁王像 » est incrusté)
    'sanjubutsu': ('Thirty Buddas.mp4', 26.3, 1.62, 0.68),
    'sb-torii': ('Thirty Buddas.mp4', 20.05, 1.8),
    'sb-escalier': ('Thirty Buddas.mp4', 9.3, 2.2),
    'sb-do': ('Thirty Buddas.mp4', 16.55, 1.5),
    # Udo et Yakushima (vidéo 8) : 0518.mp4 pour Udo (« Inari shrine.mp4 » est un autre sanctuaire), Yaku-Shima.mov. Le sanctuaire dans la
    # grotte : après le titre « 鵜戸神宮 », 1,3 s sans texte (ralenti) ; le rocher de la tortue et sa corde ; les ema en forme de lapin ;
    # les torii rouges, l'escalier ; le sentier de mousse, la baie au couchant, le pont de bois, le cerf et le singe blanc, le tronc géant
    'ud-grotte': ('0518.mp4', 7.55, 1.3, 0.5),
    'ud-tortue': ('0518.mp4', 16.85, 1.0, 0.85),
    'ud-ema': ('0518.mp4', 32.1, 1.3),
    'ud-torii': ('0518.mp4', 3.95, 0.75, 0.55),
    'yk-mousse': ('Yaku-Shima.mov', 20.6, 2.6),
    'yk-baie': ('Yaku-Shima.mov', 23.6, 1.5),
    'yk-pont': ('Yaku-Shima.mov', 28.1, 1.5),
    'yk-singe': ('Yaku-Shima.mov', 41.0, 1.5),
    'yk-tronc': ('Yaku-Shima.mov', 10.4, 1.5),
}
SFX = {
    'promo30': ['whoosh-fast', 'swoosh-quick', 'air-whoosh-powerful', 'zoom-air-fast', 'transition-snap', 'impact-deep-whoosh',
                'impact-epic-trailer', 'bass-hit-short', 'shimmer-sparkle-sweep', 'sparkle-touch', 'paper-slide', 'paper-move-quick',
                'switch-click-quick', 'montee', 'taiko', 'tampon', 'whoosh-swirl', 'stardust-swish', 'sparkle-poof-hit', 'light-spell'],
    'tunnel': ['tap', 'plongee', 'pop', 'pops'],
}


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def metal(t, frequences, amorti):
    # un choc de métal : des partiels qui ne s'accordent pas, chacun s'éteint à sa vitesse
    return sum(np.sin(2 * np.pi * h * t) * np.exp(-t * amorti * (0.6 + 0.5 * k)) / (1 + k) for k, h in enumerate(frequences))


def ecrire(nom, x):
    with wave.open(str(PUBLIC / 'sfx-jeu' / f'{nom}.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x / (np.abs(x).max() + 1e-9) * 0.8, -1, 1) * 32767).astype(np.int16).tobytes())


def cadenas():
    """Les bruits du cadenas de la vidéo d'Udo et Yakushima, calculés (aucun droit) : verrou (le cadenas qui tombe et se ferme, un choc
    sourd et un claquement de métal), deverrou (deux petits déclics et l'anse qui saute), chaine (des maillons qui s'entrechoquent)."""
    (PUBLIC / 'sfx-jeu').mkdir(exist_ok=True)
    g = np.random.default_rng(20261102)
    t = np.arange(int(SR * 0.9)) / SR
    choc = np.sin(2 * np.pi * (70 + 60 * np.exp(-t * 30)) * t) * np.exp(-t * 11)
    ferme = metal(t, [1380, 2210, 3170, 4630], 26) * 0.5 + g.normal(size=t.size) * np.exp(-t * 70) * 0.4
    ecrire('verrou', choc * 1.1 + ferme)
    t = np.arange(int(SR * 0.7)) / SR
    x = metal(t, [2300, 3540, 5120], 60) * 0.5
    x += np.roll(metal(t, [1900, 3010, 4480], 45), int(0.09 * SR)) * 0.8
    x += np.roll(metal(t, [1200, 2050, 3300], 18), int(0.17 * SR)) * 0.6
    ecrire('deverrou', x)
    t = np.arange(int(SR * 0.8)) / SR
    x = np.zeros(t.size)
    for k in range(9):
        d = int(SR * (0.02 + k * 0.05 + g.uniform(0, 0.02)))
        f = g.uniform(1500, 3200)
        x += np.roll(metal(t, [f, f * 1.47, f * 2.13], 55), d) * g.uniform(0.3, 1)
    ecrire('chaine', x * np.minimum(1, (t.size - np.arange(t.size)) / (0.1 * SR)))


def main():
    (PUBLIC / 'reels').mkdir(parents=True, exist_ok=True)
    couleurs = ['-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']
    for lieu, (fichier, debut, duree, *vitesse) in REELS.items():
        f = PUBLIC / 'reels' / f'{lieu}.mp4'
        if not f.exists():
            lent = f'setpts=PTS/{vitesse[0]},' if vitesse else ''
            subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(debut), '-t', str(duree), '-i', str(VIDEOS_LIEUX / fichier),
                            '-an', '-vf', f'{lent}scale=1080:1920,fps=60,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-g', '15',
                            *couleurs, '-movflags', '+faststart', str(f)], check=True)
    (PUBLIC / 'sfx').mkdir(exist_ok=True)
    for dossier, noms in SFX.items():
        for nom in noms:
            shutil.copyfile(RACINE / 'videos' / 'carte' / dossier / 'public' / 'sfx' / f'{nom}.mp3', PUBLIC / 'sfx' / f'{nom}.mp3')
    cadenas()
    Image.open(RACINE / 'outils' / 'logo-source' / 'logo-carre.jpg').convert('RGB').resize((800, 800), Image.LANCZOS) \
        .save(PUBLIC / 'logo.jpg', quality=93)
    print('extraits, bruitages et logo prêts dans', PUBLIC)


if __name__ == '__main__':
    main()
