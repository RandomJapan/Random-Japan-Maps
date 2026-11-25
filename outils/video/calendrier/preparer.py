"""Prépare les vrais plans des vidéos du calendrier de l'Avent (la promo « les cadeaux sont vrais » et le tutoriel de la grue) :
les rushs du propriétaire (videos/tournage/Promo calendrier avent : DJI Osmo Pocket 4, 1728 × 3072 HEVC 10 bits en D-Log M, 29,97 i/s)
coupés, recadrés, mis en couleurs avec le LUT de la caméra (« D-Log to Rec.709 vivid », dans videos/Tik Tok/), éclaircis (la pièce
était sombre), à la vitesse voulue, en H.264 1080 × 1920 (ou au format demandé) à 30 i/s, une image clé toutes les 15 ;
plus la musique (la musique de Noël de la carte, « Yuki akari », rendue par outils/composer_noel.mjs).
Tout va dans videos/carte/calendrier/public/ (hors de git) ; seuls les plans changés sont refaits (une empreinte par plan).
    python outils/video/calendrier/preparer.py

Ce qu'on ne montre pas (2026-11-23) : la boîte aux lettres (0010 : le nom de famille du propriétaire y est écrit deux fois) ;
la boîte LEGO One Piece du rush 0007 (en bas à gauche : les cadres restent au-dessus) ; le rush 0009 est filmé en miroir
(la carte de vœux s'y lit à l'envers) : il est retourné.
"""
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[2]
RUSHS = RACINE / 'videos' / 'tournage' / 'Promo calendrier avent'
LUT = next((RACINE / 'videos' / 'Tik Tok').glob('*.cube'))
PUBLIC = RACINE / 'videos' / 'carte' / 'calendrier' / 'public'
L, H = 1728, 3072  # la taille des rushs

# nom : (rush, début s, fin s, vitesse, zoom, centre (x, y de 0 à 1 dans le rush), options)
# options : miroir (retourner), gamma (éclaircir), format (largeur, hauteur de sortie ; 1080 × 1920 sinon)
GAMMA_PIECE = 1.25
PROMO = {
    'p-grue': ('0003', 9.3, 12.3, 1, 1.12, (0.5, 0.45), {}),
    'p-papier': ('0001', 57.6, 60.0, 1, 1.2, (0.5, 0.5), {'gamma': GAMMA_PIECE}),
    'p-pli-1': ('0001', 164.0, 165.0, 1, 1.5, (0.5, 0.36), {'gamma': GAMMA_PIECE}),
    'p-pli-2': ('0001', 192.0, 193.0, 1, 1.5, (0.62, 0.38), {'gamma': GAMMA_PIECE}),
    'p-pli-3': ('0001', 255.5, 256.5, 1, 1.5, (0.6, 0.33), {'gamma': GAMMA_PIECE}),
    'p-pli-4': ('0001', 400.0, 401.0, 1, 1.5, (0.5, 0.42), {'gamma': GAMMA_PIECE}),
    'p-pli-5': ('0001', 563.0, 564.0, 1, 1.5, (0.62, 0.36), {'gamma': GAMMA_PIECE}),
    'p-pli-6': ('0001', 607.0, 608.0, 1, 1.5, (0.55, 0.36), {'gamma': GAMMA_PIECE}),
    'p-grue-finie': ('0001', 815.0, 817.5, 1, 1.4, (0.5, 0.36), {'gamma': GAMMA_PIECE}),
    'p-calendrier': ('0007', 15.6, 18.0, 1, 1.2, (0.5, 0.62), {}),
    'p-crayon': ('0008', 4.3, 7.8, 1, 1.15, (0.55, 0.55), {}),
    'p-voeux-carte': ('0009', 1.2, 3.2, 1, 1.3, (0.5, 0.3), {'miroir': True}),
    'p-voeux-ecrire': ('0009', 14.0, 18.0, 1, 1.45, (0.42, 0.45), {'miroir': True}),
    'p-voeux-texte': ('0009', 40.3, 41.8, 1, 1.3, (0.55, 0.4), {'miroir': True}),
    'p-porte': ('0009', 88.2, 91.2, 1, 1.2, (0.5, 0.62), {'miroir': True}),
    'p-mur': ('0007', 56.9, 58.6, 1, 2.2, (0.31, 0.33), {}),
    # le pouce levé, ralenti (images intermédiaires calculées) pour finir la vidéo
    'p-pouce': ('0007', 58.5, 60.25, 0.585, 1.4, (0.5, 0.36), {'lisse': True}),
}

# Le tutoriel : le haut de l'écran (1080 × 1010) montre les mains ; vitesse = les secondes du rush par seconde de vidéo
F_TUTO = (1080, 1010)
T = {'gamma': GAMMA_PIECE, 'format': F_TUTO}
TUTO = {
    't-intro-grue': ('0001', 812.5, 818.5, 1, 1.3, (0.5, 0.36), T),
    't-papier': ('0001', 18.0, 122.0, 14, 1.15, (0.5, 0.42), T),
    't-1': ('0001', 128.0, 176.0, 5.5, 1.3, (0.52, 0.36), T),
    't-2': ('0001', 176.0, 210.0, 3.9, 1.3, (0.6, 0.36), T),
    't-3': ('0001', 210.0, 240.0, 3.4, 1.3, (0.62, 0.36), T),
    't-4': ('0001', 240.0, 286.0, 5.3, 1.3, (0.62, 0.36), T),
    't-5': ('0001', 286.0, 334.0, 5.5, 1.3, (0.62, 0.36), T),
    't-6': ('0001', 334.0, 372.0, 3.8, 1.3, (0.62, 0.36), T),
    't-7': ('0001', 372.0, 404.0, 3.7, 1.3, (0.55, 0.38), T),
    't-8a': ('0001', 404.0, 440.0, 7.2, 1.3, (0.55, 0.38), T),
    't-8b': ('0001', 508.0, 536.0, 5.6, 1.3, (0.6, 0.36), T),
    # l'étape 9, raccourcie le 2026-11-25 (le propriétaire : « à partir de l'étape 9 […] j'ai galère un petit peu, j'ai du mal à
    # trouver comment faire ») : sans les mains qui cachent tout (536 → 544,5, 549,5 → 558), ni la grue sortie du cadre (600 → 602)
    't-9a': ('0001', 558.0, 568.0, 1.6, 1.3, (0.62, 0.36), T),
    't-9b': ('0001', 544.5, 549.5, 1, 1.3, (0.65, 0.36), T),
    't-9c': ('0001', 568.0, 580.0, 2.4, 1.3, (0.6, 0.38), T),
    't-9d': ('0001', 583.0, 589.5, 1.3, 1.3, (0.65, 0.36), T),
    't-9e': ('0001', 589.5, 599.5, 2.0, 1.3, (0.62, 0.34), T),
    't-9f': ('0001', 602.0, 614.0, 3.2, 1.3, (0.55, 0.34), T),
    't-10a': ('0001', 626.0, 644.0, 3.2, 1.3, (0.55, 0.34), T),
    't-10b': ('0001', 714.0, 724.0, 3.2, 1.3, (0.6, 0.34), T),
    't-11': ('0001', 724.0, 750.0, 3.0, 1.3, (0.6, 0.36), T),
    # cadré plus haut et à gauche (2026-11-25) : la grue au lieu de l'avant-bras ; sans 760 → 770 (la main cache la grue)
    't-12': ('0001', 770.0, 810.0, 5.3, 1.3, (0.42, 0.28), T),
    # le début et la fin, en plein écran : la grue dans la main, la grue au-dessus de la page des étapes
    'o-grue-vol': ('0002', 0.0, 5.2, 1, 1.1, (0.5, 0.42), {}),
    'o-grue-main': ('0001', 812.0, 822.0, 1, 1.3, (0.5, 0.38), {'gamma': GAMMA_PIECE}),
    'o-grue-feuille': ('0003', 9.0, 15.4, 1, 1.12, (0.5, 0.45), {}),
    'o-fin': ('0003', 0.0, 3.6, 0.65, 1.12, (0.5, 0.42), {'lisse': True}),
}


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def rush(num):
    return next(RUSHS.glob(f'*_{num}_D.MP4'))


def couper(nom, plan, dossier):
    num, de, a, v, z, (cx, cy), opt = plan
    lo, ho = opt.get('format', (1080, 1920))
    sortie = dossier / f'{nom}.mp4'
    empreinte = dossier / f'{nom}.json'
    cle = hashlib.sha1(json.dumps([plan, LUT.name, 3]).encode()).hexdigest()
    if sortie.exists() and empreinte.exists() and empreinte.read_text() == cle:
        return
    # la fenêtre du rush : au zoom z, la largeur du rush / z, à la proportion de la sortie, centrée sur (cx, cy), dans le rush
    lc = round(L / z / 2) * 2
    hc = round(lc * ho / lo / 2) * 2
    if hc > H:
        hc = H
        lc = round(hc * lo / ho / 2) * 2
    x = min(max(0, round(cx * L - lc / 2)), L - lc)
    y = min(max(0, round(cy * H - hc / 2)), H - hc)
    filtres = [f'crop={lc}:{hc}:{x}:{y}', 'lut3d=file=lut.cube:interp=tetrahedral']
    if opt.get('gamma'):
        filtres += [f"eq=gamma={opt['gamma']}", 'hqdn3d=2:1.5:4:3']  # pièce sombre : plus clair, un peu moins de bruit
    filtres.append(f'scale={lo}:{ho}:flags=lanczos')
    if opt.get('miroir'):
        filtres.append('hflip')
    if v != 1:
        filtres.append(f'setpts=PTS/{v}')
    if opt.get('lisse'):  # un ralenti sans saccades : les images entre deux sont calculées
        filtres += ['minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:vsbmc=1', 'format=yuv420p']
    else:
        filtres += ['fps=30', 'format=yuv420p']
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', f'{de:.3f}', '-t', f'{a - de:.3f}', '-i', str(rush(num)),
                    '-vf', ','.join(filtres), '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-g', '15',
                    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
                    '-movflags', '+faststart', str(sortie)], check=True, cwd=dossier)
    empreinte.write_text(cle)
    print(' ', nom, f'{(a - de) / v:.2f} s', flush=True)


def musique():
    """« Yuki akari » (la musique de Noël de la carte, case 2 du calendrier), rendue note à note par composer_noel.mjs : en ré,
    96 à la noire, le temps 0 sur l'échantillon 0. La promo prend le second refrain (temps 112 à 144, 70 → 90 s), qui finit sur
    l'accord de ré ; le tutoriel, le morceau sans deux de ses parties (yuki-akari-court.wav)."""
    d = PUBLIC / 'musique'
    d.mkdir(parents=True, exist_ok=True)
    entier = d / 'yuki-akari.wav'
    if not entier.exists():
        subprocess.run(['node', str(RACINE / 'outils' / 'composer_noel.mjs'), str(entier)], check=True, cwd=RACINE)
    court = d / 'yuki-akari-court.wav'
    if not court.exists():
        # le tutoriel en 2 min 19 (2026-11-25, le propriétaire : « 3 minutes, c'est un peu long […] entre 2 minutes et 2 minutes 30 ») :
        # sans A1 (temps 16 → 48) ni le second refrain B2 (112 → 144), deux fois 20 s ; l'intro mène à A2 comme à A1 (la7sus4 →
        # ré), B1 finit sur la7 et le pont part de si mineur (une cadence rompue). Chaque raccord est un fondu de 60 ms qui finit
        # sur le premier temps : l'attaque d'après reste entière.
        sr, f = 48000, 2880
        coupes = [(0, 10 * sr), (30 * sr - f, 70 * sr), (90 * sr - f, None)]
        morceaux = ';'.join(f"[0]atrim=start_sample={a}{f':end_sample={b}' if b else ''},asetpts=PTS-STARTPTS[m{i}]"
                            for i, (a, b) in enumerate(coupes))
        subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(entier), '-filter_complex',
                        f'{morceaux};[m0][m1]acrossfade=ns={f}:c1=qsin:c2=qsin[m01];[m01][m2]acrossfade=ns={f}:c1=qsin:c2=qsin',
                        '-c:a', 'pcm_s24le', str(court)], check=True)
    refrain = d / 'refrain.wav'
    if not refrain.exists():
        # du temps 112 (70 s) : 32 temps (20 s), puis la résonance du dernier accord, fondue sur 0,9 s
        subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', '70', '-t', '21.4', '-i', str(entier),
                        '-af', 'afade=t=out:st=20.3:d=1.1', str(refrain)], check=True)


# Les clochettes des vidéos de Noël (2026-11-23) : une boîte à musique en ré majeur, comme dans « Yuki akari ». Chaque note
# a ses partiels de lame (1, 3,93, 9,54 : une lame encastrée), une attaque de 2 ms et une décroissance plus rapide pour les aigus.
GAMME = {'re5': 587.33, 'mi5': 659.26, 'fad5': 739.99, 'la5': 880.0, 'si5': 987.77, 're6': 1174.66, 'mi6': 1318.51,
         'fad6': 1479.98, 'la6': 1760.0, 'si6': 1975.53, 're7': 2349.32, 'mi7': 2637.02, 'fad7': 2959.96}


def clochettes():
    import wave

    import numpy as np
    sr = 48000
    for nom, f0 in GAMME.items():
        f = PUBLIC / 'sfx' / f'clochette-{nom}.wav'
        if f.exists():
            continue
        t = np.arange(int(sr * 1.6)) / sr
        x = np.zeros_like(t)
        for k, a, d in ((1, 1.0, 0.55), (3.93, 0.32, 0.16), (9.54, 0.12, 0.05)):
            if f0 * k < sr / 2.2:
                x += a * np.sin(2 * np.pi * f0 * k * t) * np.exp(-t / (d * (880 / f0) ** 0.35))
        x *= np.minimum(1, t / 0.002)
        x = 0.5 * x / np.abs(x).max()
        y = (np.stack([x, x], 1) * 32767).astype('<i2')
        with wave.open(str(f), 'wb') as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(sr)
            w.writeframes(y.tobytes())


def main():
    durees = {}
    for sous, plans in (('clips', PROMO), ('tuto', TUTO)):
        dossier = PUBLIC / sous
        dossier.mkdir(parents=True, exist_ok=True)
        shutil.copy(LUT, dossier / 'lut.cube')  # (un chemin de filtre avec des espaces casse lut3d)
        print(sous, flush=True)
        for nom, plan in plans.items():
            couper(nom, plan, dossier)
            durees[f'{sous}/{nom}'] = {'d': round((plan[2] - plan[1]) / plan[3], 3), 'v': plan[3]}
    # la durée de chaque plan préparé : le montage règle la vitesse de lecture pour qu'il remplisse sa place
    (ICI / 'montage' / 'src' / 'durees.json').write_text(json.dumps(durees, indent=1), encoding='utf-8')
    musique()
    grue = PUBLIC / 'grue'
    grue.mkdir(exist_ok=True)
    shutil.copy(RACINE / 'site' / 'noel' / 'origami-en-apercu.jpg', grue / 'apercu.jpg')
    (PUBLIC / 'ui').mkdir(exist_ok=True)
    shutil.copy(ICI / 'origami' / 'grain.jpg', PUBLIC / 'ui' / 'grain.jpg')
    ui = PUBLIC / 'ui'
    ui.mkdir(exist_ok=True)
    shutil.copy(RACINE / 'site' / 'img' / 'logo.jpg', ui / 'logo.jpg')
    # les bruitages : l'appui et la petite réponse de la vidéo « le créateur » (en ré, comme Yuki akari), le papier (Mixkit,
    # par video-shotcraft : licence libre, sans crédit)
    sfx = PUBLIC / 'sfx'
    sfx.mkdir(exist_ok=True)
    for dossier, nom in (('carte/jeu', 'cr-appui.wav'), ('carte/jeu', 'cr-reponse.wav'), ('carte/jeu', 'paper-slide.mp3'),
                         ('carte/promo30', 'paper-move-quick.mp3'), ('carte/jeu', 'shimmer-sparkle-sweep.mp3')):
        shutil.copy(RACINE / 'videos' / dossier / 'public' / 'sfx' / nom, sfx / nom)
    clochettes()
    print('→', PUBLIC)


if __name__ == '__main__':
    main()
