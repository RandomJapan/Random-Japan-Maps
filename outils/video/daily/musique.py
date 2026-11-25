"""La musique et les bruitages de « Japan Daily » (2026-11-25), composés ici (aucun droit, aucun crédit), avec les instruments
des vidéos du jeu (jeu/musique.py, qui reprend ceux de la vidéo « sceau ») : la même pour chaque épisode, c'est l'indicatif de
la série.
    python outils/video/daily/musique.py

120 battements par minute (un temps = 30 images à 60 images/s), en miyako-bushi sur la (la, si bémol, ré, mi, fa), 36 temps (18 s),
calée sur le montage (montage/src/Daily.tsx) :
  temps 0 → 6    l'énigme : un cœur, un grave qui monte (le tic-tac du 3-2-1 est un bruitage) ;
  temps 6        coup ; l'indice (6 → 12) : le rythme phonk, sans koto ;
  temps 12 → 18  « Comment your guess » : le rythme s'arrête, le cœur s'emballe, le grave monte, un roulement de claps ;
  temps 18       grand coup (la plongée) ; la réponse (18 → 28) : tout le rythme, le koto ;
  temps 28 → 36  la fin : un coup, la phrase du koto et de la cloche, un dernier coup au temps 32 qui résonne.
Bruitages (sfx/), dans la tonalité : jd-tic, jd-toc (le compte à rebours), jd-indice (la région s'allume), jd-reponse (le nom),
jd-case (les cases du défi qui s'allument), jd-trouve (la dernière, 🎯).
Sortie : videos/carte/daily/public/musique/daily.wav et sfx/jd-*.wav (48 kHz, stéréo).
"""
import importlib.util
import sys
from pathlib import Path

import numpy as np

ICI = Path(__file__).resolve().parent
PUBLIC = ICI.parents[2] / 'videos' / 'carte' / 'daily' / 'public'
sp = importlib.util.spec_from_file_location('musique_jeu', ICI.parent / 'jeu' / 'musique.py')
J = importlib.util.module_from_spec(sp)
sp.loader.exec_module(J)
I, SR = J.I, J.SR

TEMPS = 0.5
PAS = TEMPS / 4
DUREE = 36 * TEMPS
RIFFS = [[(0, 'E5'), (1, 'D5'), (3, 'Bb4'), (4, 'A4'), (6, 'Bb4'), (8, 'D5'), (10, 'E5'), (11, 'F5'), (12, 'E5'), (14, 'D5')],
         [(0, 'A5'), (2, 'F5'), (3, 'E5'), (6, 'D5'), (8, 'E5'), (9, 'D5'), (10, 'Bb4'), (12, 'A4'), (14, 'E4'), (15, 'F4')]]
BASSES = [[(0, 'A2', 6), (6, 'A2', 4), (10, 'D2', 6)], [(0, 'A2', 6), (6, 'F2', 4), (10, 'E2', 6)]]


def musique():
    p = J.Piste(DUREE)
    g = J.Groove(p, PAS, RIFFS, BASSES)
    # l'énigme : le cœur sur chaque temps, le grave qui monte jusqu'à l'indice
    for k in range(0, 6):
        p.poser(J.coeur(), k * TEMPS, 0.8 if k % 2 == 0 else 0.45)
    p.poser(J.montee(6 * TEMPS, 40, 100), 0, 0.4, arret=5.75 * TEMPS)
    # l'indice : le rythme, sans koto
    g.coup(6 * 4)
    g.jouer(6 * 4, 12 * 4, koto=False)
    # « Comment your guess » : le cœur s'emballe, le grave monte, le roulement
    for k in np.arange(12, 18, 0.5):
        p.poser(J.coeur(), k * TEMPS, 0.7 if k % 1 == 0 else 0.4)
    p.poser(J.montee(6 * TEMPS, 36, 150), 12 * TEMPS, 0.5, arret=17.9 * TEMPS)
    for k in range(16 * 8, 18 * 8):  # des triples croches qui montent
        p.poser(I.clap(), k * PAS / 2, 0.08 + 0.3 * (k - 128) / 16, arret=17.95 * TEMPS)
    # la réponse
    g.coup(18 * 4, 1.1)
    g.jouer(18 * 4, 28 * 4)
    p.poser(I.cymbale(), 21 * TEMPS, 0.3)  # le nom arrive
    # la fin
    for k, de in enumerate((28, 32)):
        g.coup(de * 4, 1.05)
        p.poser(I.basse('A2', 3.6 if k else 8 * PAS), de * TEMPS, 0.4)
        p.poser(I.clap(), de * TEMPS, 0.3)
    for s, nom in RIFFS[0][:8]:
        p.poser(I.cloche(nom), 28 * TEMPS + s * PAS, 0.4, pan=-0.2)
        p.poser(I.koto(nom[:-1] + str(int(nom[-1]) - 1)), 28 * TEMPS + s * PAS, 0.45, pan=0.45)
    for k in range(29 * 4, 32 * 4, 2):  # un charleston doux sous les cases du défi
        p.poser(I.charleston(), k * PAS, 0.14, pan=0.35)
    p.poser(I.koto('A3'), 32 * TEMPS, 0.6, pan=0.45)
    p.poser(I.koto('E4'), 32 * TEMPS + 0.02, 0.4, pan=0.45)
    p.poser(I.cloche('A5'), 32 * TEMPS, 0.42, pan=-0.2)
    J.ecrire(PUBLIC / 'musique' / 'daily.wav', p.fin(1.4))


def bruitages():
    s = PUBLIC / 'sfx'
    J.ecrire(s / 'jd-tic.wav', J.mono(J.tic(1760)))  # la
    J.ecrire(s / 'jd-toc.wav', J.mono(J.tic(1320)))  # mi
    J.ecrire(s / 'jd-indice.wav', J.mono(J.carillon(['A4', 'D5', 'E5'], 0.09, 0.9)))
    J.ecrire(s / 'jd-reponse.wav', J.mono(J.carillon(['A4', 'D5', 'E5', 'A5', 'Bb5', 'A5'], 0.06, 1.1)))
    J.ecrire(s / 'jd-case.wav', J.mono(J.carillon(['E5'], 0.05, 0.35)))
    J.ecrire(s / 'jd-trouve.wav', J.mono(J.carillon(['A5', 'E6', 'A6'], 0.05, 0.9)))


if __name__ == '__main__':
    musique()
    bruitages()
    print('→', PUBLIC / 'musique' / 'daily.wav', file=sys.stderr)
