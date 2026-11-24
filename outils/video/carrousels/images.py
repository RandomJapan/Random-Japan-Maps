"""Les images des carrousels TikTok (2026-11-24), prises dans ce qu'on a déjà tourné.

    python outils/video/carrousels/images.py

- des images des prises (la carte, le jeu, la balade : videos/…/rushes/*.mp4, 1080 × 1920), à l'instant choisi sur les planches
  de planches.py ;
- les personnages détourés de detourer.py et les morceaux d'interface déjà découpés (fiche de Himeji, favoris…), chacun avec son
  liseré blanc d'autocollant (le canal alpha élargi en rond, rempli de blanc, sous l'image) ;
- les photos des lieux : des images des vidéos du propriétaire, celles du jeu (site/photos/jeu, 960 × 768).
Sortie : videos/carte/carrousels/images/ (pas dans git).
"""
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageFilter

RACINE = Path(__file__).resolve().parents[3]
V = RACINE / 'videos'
SORTIE = V / 'carte' / 'carrousels' / 'images'
BAL = V / 'balade' / 'public' / 'rushes'
PROMO = V / 'carte' / 'promo30' / 'public' / 'rushes-v'
TUNNEL = V / 'carte' / 'tunnel' / 'public' / 'rushes'
JEU = V / 'carte' / 'jeu' / 'public' / 'rushes'

# nom → (prise, seconde)
IMAGES = {
    # la balade : un plan par lieu, puis les moments
    'b-itsukushima': (BAL / 'it-plage.mp4', 3.4), 'b-aogashima': (BAL / 'ao-belv.mp4', 3.4), 'b-gokayama': (BAL / 'gk-village.mp4', 1.9),
    'b-himeji': (BAL / 'hm-pont.mp4', 1.1), 'b-takachiho': (BAL / 'tk-barque.mp4', 1.9), 'b-kinkakuji': (BAL / 'kk-reflet.mp4', 2.5),
    'b-beppu': (BAL / 'bp-oni.mp4', 2.9), 'b-motonosumi': (BAL / 'mt-tunnel.mp4', 2.5), 'b-sanjubutsu': (BAL / 'sb-vue.mp4', 1.9),
    'b-udo': (BAL / 'ud-torii.mp4', 1.2), 'b-yakushima': (BAL / 'yk-cerf.mp4', 2.1), 'b-tottori': (BAL / 'tt-chameau.mp4', 1.6),
    'b-tsubosaka': (BAL / 'ts-place.mp4', 1.7), 'b-iiyama': (BAL / 'iy-arrivee.mp4', 1.3),
    'b-tresor': (BAL / 'ao-tresor.mp4', 10.5), 'b-okiku': (BAL / 'hm-okiku.mp4', 10.5), 'b-luciole': (BAL / 'gk-luciole-1.mp4', 2.1),
    'b-miroir': (BAL / 'tk-miroir.mp4', 3.1), 'b-corbeaux': (BAL / 'it-corbeaux-1.mp4', 4.7),
    'b-planche': (BAL / 'tt-planche-1.mp4', 1.0), 'b-somen': (BAL / 'tk-somen.mp4', 5.2), 'b-toboggan': (BAL / 'iy-toboggan.mp4', 2.1),
    'b-feux': (BAL / 'it-feux.mp4', 3.3), 'b-kagura': (BAL / 'tk-kagura.mp4', 1.0), 'b-bunbuku': (BAL / 'bunbuku-1.mp4', 1.8),
    'b-trio': (BAL / 'trio.mp4', 0.6), 'b-torii': (BAL / 'it-torii.mp4', 3.2),
    # la carte
    'c-japon': (TUNNEL / 'tn-japon.mp4', 0.8), 'c-reperes': (TUNNEL / 'tn-japon.mp4', 6.8), 'c-aogashima': (TUNNEL / 'tn-aogashima.mp4', 4.8),
    'c-himeji3d': (PROMO / 'p-plongee.mp4', 4.9), 'c-relief': (PROMO / 'p-plongee.mp4', 3.8), 'c-mer': (PROMO / 'p-mer.mp4', 2.6),
    'c-printemps': (PROMO / 'p-printemps.mp4', 1.2), 'c-ete': (PROMO / 'p-ete.mp4', 1.2), 'c-automne': (PROMO / 'p-automne.mp4', 1.2),
    'c-hiver': (PROMO / 'p-hiver.mp4', 1.2), 'c-nuit': (PROMO / 'v3-nuit.mp4', 4.1),
    # le jeu
    'j-menu': (JEU / 'cr-debut.mp4', 0.6), 'j-photo': (JEU / 'cr-debut.mp4', 1.8), 'j-fuji': (JEU / 'cr-debut.mp4', 5.2),
    'j-kinkaku': (JEU / 'jd-1.mp4', 3.9), 'j-motonosumi': (JEU / 'jd-2.mp4', 3.9), 'j-essais': (JEU / 'df-essais.mp4', 7.8),
    'j-trouve': (JEU / 'df-essais.mp4', 12.2), 'j-score': (JEU / 'cr-score.mp4', 1.0), 'j-defi': (JEU / 'cr-defi.mp4', 9.2),
}

# les découpes (fond transparent) : nom → (fichier, rayon du liseré en px de l'image source)
D = SORTIE / 'detoures'
UI = V / 'carte' / 'promo30' / 'public' / 'ui-v'
UIB = V / 'balade' / 'public' / 'ui'
DECOUPES = {
    **{n: (D / f'{n}.png', 20) for n in ['fille', 'garcon', 'kon', 'pon', 'chapu', 'gao', 'fuwa', 'saya', 'bunbuku', 'samourai', 'tengu',
                                         'renarde', 'oni', 'kimono']},
    'fiche-himeji': (UI / 'fiche-himeji.png', 22), 'favoris': (UI / 'panneau-favoris.png', 16), 'orochi': (UI / 'bulle-orochi.png', 14),
    'itineraire': (UI / 'resume-itineraire.png', 8), 'bouton-3d': (UIB / 'bouton-3d.png', 8),
    'tampon-ema': (UIB / 'tampon-ema.png', 0), 'tampon-yukizo': (UIB / 'tampon-yukizo.png', 0), 'tampon-toro': (UIB / 'tampon-toro.png', 0),
    'tampon-usagi': (UIB / 'tampon-usagi.png', 0), 'tampon-nabe': (UIB / 'tampon-nabe.png', 0),
}

# les photos des lieux (images des vidéos du propriétaire, celles du jeu)
PHOTOS = {
    'p-itsukushima': '7647214222648151318', 'p-kinkakuji': '7660227940243737878', 'p-shirahige': '7651346651482688790',
    'p-takachiho': '7645362939456785686', 'p-aogashima': '7656153535381294358', 'p-shirogane': '7651317213797944598',
    'p-motonosumi': '7674375149931547907', 'p-hirosaki': '7650552780922424598', 'p-gokayama': '7645659293513108739',
    'p-shuri': '7643858576523480342', 'p-sengen': '7662416807914949910', 'p-nachi': '7666570788287286550',
    'p-tazawa': '7653878257175022870', 'p-oshinkoshin': '7651277560634002710', 'p-sakurajima': '7641695228323319043',
    'p-himeji': '7649489240199531778',
}


def liserer(src, rayon, sortie, hauteur_max=1300):
    im = Image.open(src).convert('RGBA')
    if im.height > hauteur_max:
        k = hauteur_max / im.height
        im = im.resize((round(im.width * k), hauteur_max), Image.LANCZOS)
        rayon = round(rayon * k)
    if rayon <= 0:
        im.save(sortie)
        return
    m = rayon * 2
    grand = Image.new('RGBA', (im.width + 2 * m, im.height + 2 * m), (0, 0, 0, 0))
    grand.paste(im, (m, m))
    a = grand.getchannel('A')
    # le liseré : l'alpha flouté puis seuillé (un élargissement en rond), bords adoucis
    flou = a.filter(ImageFilter.GaussianBlur(rayon * 0.7))
    contour = flou.point(lambda v: 255 if v > 6 else int(v * 255 / 6))
    contour = contour.filter(ImageFilter.GaussianBlur(1.2))
    blanc = Image.new('RGBA', grand.size, (255, 253, 247, 255))
    blanc.putalpha(contour)
    blanc.alpha_composite(grand)
    boite = blanc.getbbox()
    blanc.crop(boite).save(sortie)


def main():
    (SORTIE / 'plans').mkdir(parents=True, exist_ok=True)
    (SORTIE / 'decoupes').mkdir(exist_ok=True)
    (SORTIE / 'photos').mkdir(exist_ok=True)
    for nom, (prise, t) in IMAGES.items():
        o = SORTIE / 'plans' / f'{nom}.jpg'
        if o.exists():
            continue
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', str(prise), '-frames:v', '1', '-q:v', '2', str(o)], check=True)
    for nom, (src, r) in DECOUPES.items():
        liserer(src, r, SORTIE / 'decoupes' / f'{nom}.png')
    for nom, ident in PHOTOS.items():
        shutil.copy(RACINE / 'site' / 'photos' / 'jeu' / f'{ident}.jpg', SORTIE / 'photos' / f'{nom}.jpg')
    shutil.copy(V / 'carte' / 'jeu' / 'public' / 'photos' / 'jeu-fuji.jpg', SORTIE / 'photos' / 'p-fuji.jpg')
    shutil.copy(V / 'carte' / 'jeu' / 'public' / 'ui' / 'salon-1.jpg', SORTIE / 'plans' / 'j-salon.jpg')
    Image.open(UI / 'route.png').convert('RGB').resize((1080, 1920), Image.LANCZOS).save(SORTIE / 'plans' / 'c-route.jpg', quality=92)
    shutil.copy(V / 'carte' / 'promo30' / 'public' / 'img' / 'logo-carre.jpg', SORTIE / 'logo.jpg')
    shutil.copy(V / 'carte' / 'calendrier' / 'public' / 'ui' / 'grain.jpg', SORTIE / 'grain.jpg')
    print('ok', SORTIE)


main()
