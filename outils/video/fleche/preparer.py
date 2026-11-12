"""Rassemble les fichiers de la vidéo « fléchette » (2026-11-12) dans videos/carte/fleche/public (hors de git), le dossier public
du montage Remotion (outils/video/fleche/montage).
    python outils/video/fleche/preparer.py
- L'accroche : le lancer (VF1b) et la fléchette plantée (VF2b), générés avec Higgsfield (Seedance 2.0, depuis des images de Nano
  Banana faites sur une capture de la carte : voir « The Higgsfield videos » dans instructions/videos.md), dans
  videos/higgsfield/videos, réencodés (1080 × 1920, une image clé toutes les 6).
- Le son de l'accroche (sfx/geste.wav) : le son d'origine des plans, généré avec l'image, coupé comme eux dans le montage.
- Les prises déjà tournées : le vol vers Aogashima (vidéo « jarre »), l'île (vidéo « tunnel »), la ville, le jour et la nuit
  (vidéo « sceau »), la mer, la légende et la route (« jarre »), les quatre saisons (promo30), la balade.
- Le vrai plan d'Aogashima et la fiche de l'île (vidéo « jarre »), l'interface de la vidéo « sceau ».
- Les bruitages : ceux des vidéos d'avant. Le logo.
"""
import json
import shutil
import subprocess
from pathlib import Path

import numpy as np

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[2]
VIDEOS = RACINE / 'videos'
PUBLIC = VIDEOS / 'carte' / 'fleche' / 'public'
SOURCES = VIDEOS / 'higgsfield' / 'videos'
VIDEOS_LIEUX = Path(r'D:\Montage\Vidéo lieux random japon')

PRISES = {
    'rushes': [VIDEOS / 'carte/jarre/public/rushes' / f'{n}.mp4' for n in ('ja-vol', 'ja-mer', 'ja-legende', 'ja-route', 'p-printemps', 'p-ete', 'p-automne', 'p-hiver')]
    + [VIDEOS / 'carte/tunnel/public/rushes/tn-aogashima.mp4']
    + [VIDEOS / 'carte/sceau/public/rushes' / f'{n}.mp4' for n in ('sc-plongee', 'sc-ville', 'sc-jour', 'sc-nuit')]
    + [VIDEOS / 'balade/public/rushes' / f'{n}.mp4' for n in ('tt-escalier', 'tt-planche-2', 'kk-feux')],
    'reels': [VIDEOS / 'carte/jarre/public/reels/aogashima.mp4'],
    'ui': [VIDEOS / 'carte/sceau/public/ui' / n for n in ('bouton-3d.png', 'interrupteur.png')] + [VIDEOS / 'carte/jarre/public/ui/fiche-aogashima.png'],
}
SFX = [VIDEOS / 'carte/tunnel/public/sfx' / n for n in ('tap.mp3', 'pop.mp3', 'pops.mp3', 'whoosh-fast.mp3', 'swoosh-quick.mp3', 'bass-hit-short.mp3',
                                                        'air-whoosh-powerful.mp3', 'paper-slide.mp3', 'sparkle-touch.mp3', 'ui-message-pop.mp3',
                                                        'ui-success-soft.mp3', 'transition-snap.mp3', 'shimmer-sparkle-sweep.mp3', 'zoom-air-fast.mp3')] + [
    VIDEOS / 'carte/promo30/public/sfx' / n for n in ('click-camera.mp3', 'impact-deep-whoosh.mp3', 'hit-fast-exciting.mp3', 'pinceau.mp3', 'tonnerre.mp3')] + [
    VIDEOS / 'carte/eclat/public/sfx' / 'piece.wav']
def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def copier(src, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists() or dest.stat().st_mtime < src.stat().st_mtime:
        shutil.copy2(src, dest)


def clip(nom):
    """Un plan de Flora : recadré en 1080 × 1920, sans son, une image clé toutes les 6 images (le montage le joue image par image)."""
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(SOURCES / f'{nom}.mp4'),
                    # (du 720p agrandi : un peu de piqué, pas d'adoucissement comme pour Flora)
                    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,unsharp=5:5:0.35,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-g', '6', '-an', '-color_range', 'tv', '-colorspace', 'bt709',
                    '-color_primaries', 'bt709', '-color_trc', 'bt709', str(PUBLIC / 'clips' / f'{nom}.mp4')], check=True)


def mise_en_page():
    """La mise en page de l'interface : celle du sceau (l'interrupteur jour/nuit), avec la fiche d'Aogashima de la jarre."""
    plan = json.loads((VIDEOS / 'carte/sceau/public/ui/layout.json').read_text(encoding='utf-8'))
    jarre = json.loads((VIDEOS / 'carte/jarre/public/ui/layout.json').read_text(encoding='utf-8'))
    plan['fiches'] = {'aogashima': jarre['fiches']['aogashima']}
    (PUBLIC / 'ui' / 'layout.json').write_text(json.dumps(plan, ensure_ascii=False, indent=1), encoding='utf-8')


# Le son de l'accroche : les morceaux des plans, coupés comme dans le montage (montage/src/accroche.json : le fichier, sa seconde à la
# première image, les images de début et de fin dans la vidéo, la vitesse)
ACCROCHE = json.loads((ICI / 'montage' / 'src' / 'accroche.json').read_text(encoding='utf-8'))['morceaux']
# (dB par plan : chacun sort de Seedance à son propre niveau)
GAINS = {'VF1b': 0, 'VF2b': 0}
FIN_GESTE = 300  # image : le temps 12, où la musique éclate
# Images : à 24 images/s, l'image d'un choc arrive juste après lui dans le son d'origine (mesuré sur la jarre : 2 images à 60).
RETARD = 2
# (images, dB) : des nuances à la main, si un bruit couvre le geste qu'on doit entendre
NUANCES = ()
# Le limiteur, avant de tout remonter à −1 dB : le choc de la fléchette (−11 dB) est bien plus fort que le reste. À 0,25, la
# vibration de la fléchette restait 28 dB sous la musique ; à 0,12, le choc est tassé et le reste remonte de 6 dB (le sceau, fait
# de petits bruits : 0,08 ; la jarre : 0,35).
LIMITE = 0.12


def son_de(plan, sr):
    """Le son d'un plan de Flora (stéréo, sr), ou None s'il n'en a pas."""
    r = subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-i', str(SOURCES / f'{plan}.mp4'), '-vn', '-ac', '2', '-ar', str(sr), '-f', 'f32le', '-'],
                       capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.float32).reshape(-1, 2) if r.returncode == 0 and r.stdout else None


def geste():
    """Le son de l'accroche. Seedance génère le son avec l'image : la cire qui coule, le tampon qui s'enfonce et se décolle y tombent
    déjà avec l'image. On le prend tel quel, coupé comme l'image (la leçon de la jarre : les bruitages posés à la main sonnaient
    faux), puis un limiteur fort qui fait monter tous les petits bruits. Un plan sans son reçoit le silence de la pièce (piece.wav)."""
    sr = 48000
    sortie = np.zeros((round(FIN_GESTE / 60 * sr), 2), dtype=np.float32)
    fondu = np.linspace(0, 1, int(0.004 * sr), dtype=np.float32)[:, None]
    piece = None
    for m in ACCROCHE:
        f0, f1, v = m['f0'], min(m['f1'], FIN_GESTE), m['v']
        son = son_de(m['clip'], sr)
        n = round((f1 - f0) / 60 * sr)
        if son is None:
            if piece is None:
                brut = subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-i', str(PUBLIC / 'sfx' / 'piece.wav'), '-ac', '2', '-ar', str(sr), '-f', 'f32le', '-'],
                                      capture_output=True, check=True).stdout
                piece = np.frombuffer(brut, dtype=np.float32).reshape(-1, 2)
            morceau = np.resize(piece, (n, 2)).astype(np.float32) * 0.3  # (le souffle de la pièce, sous le bruit de la cire)
        else:
            son = son[int(m['s0'] * sr):int((m['s0'] + (f1 - f0) / 60 * v) * sr)]
            x = np.linspace(0, len(son) - 1, n)
            morceau = np.column_stack([np.interp(x, np.arange(len(son)), son[:, c]) for c in (0, 1)]).astype(np.float32)
        morceau *= 10 ** (GAINS.get(m['clip'], 0) / 20)
        morceau[:len(fondu)] *= fondu
        morceau[-len(fondu):] *= fondu[::-1]
        debut = round((f0 + RETARD) / 60 * sr)
        fin = min(len(sortie), debut + n)
        sortie[debut:fin] += morceau[:fin - debut]
    sortie = np.frombuffer(subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-f', 'f32le', '-ar', str(sr), '-ac', '2', '-i', '-',
                                           '-af', f'alimiter=limit={LIMITE}:attack=1:release=40:level=false:latency=1', '-f', 'f32le', '-'],
                                          input=sortie.tobytes(), capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, 2).copy()
    enveloppe = np.ones(len(sortie), dtype=np.float32)
    for a, z, db in NUANCES:
        enveloppe[round(a / 60 * sr):round(z / 60 * sr)] = 10 ** (db / 20)
    enveloppe = np.convolve(enveloppe, np.ones(240, dtype=np.float32) / 240, mode='same')  # (5 ms de transition)
    sortie *= enveloppe[:, None]
    sortie *= 10 ** (-1 / 20) / np.abs(sortie).max()
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', str(PUBLIC / 'sfx' / 'geste.wav')],
                   input=sortie.tobytes(), check=True)


def main():
    for dossier in ('img', 'rushes', 'reels', 'clips', 'ui', 'sfx', 'musique'):
        (PUBLIC / dossier).mkdir(parents=True, exist_ok=True)
    for dossier, fichiers in PRISES.items():
        for f in fichiers:
            copier(f, PUBLIC / dossier / f.name)
    for f in SFX:
        copier(f, PUBLIC / 'sfx' / f.name)
    copier(VIDEOS / 'carte/tunnel/public/tiktok/avatar.jpg', PUBLIC / 'ui' / 'logo.jpg')
    mise_en_page()
    for m in ACCROCHE:
        clip(m['clip'])
    geste()
    print('bruitages et prises prêts dans', PUBLIC)


if __name__ == '__main__':
    main()
