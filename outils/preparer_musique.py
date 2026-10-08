"""Prépare la musique du lecteur de la carte (site/musique.js).

Les morceaux sont choisis à la main dans CHOIX : un style, une ambiance et la page du morceau chez son auteur.
Deux auteurs japonais seulement, sous licence libre Creative Commons Attribution 4.0 (CC BY 4.0, usage
commercial permis, à condition de les créditer, ce que fait le lecteur pendant chaque morceau) :
  - 魔王魂 (Maou Damashii, https://maou.audio) : tout le site est en CC BY 4.0 ; crédit « 音楽：魔王魂 ».
  - PeriTune (https://peritune.com) : sa page « ご利用について » (https://peritune.com/about/) dit que les
    morceaux publiés jusqu'en février 2026 restent en CC BY 4.0 (ceux d'après ont d'autres règles : le script
    refuse un morceau publié après). Beaucoup de pages anciennes n'affichent pas le badge, c'est normal.

Pour chaque morceau qui manque, le script lit sa page, télécharge le mp3, égalise son volume (loudnorm, deux
passes, à −18 LUFS : un koto doux et une chanson rock sonnent aussi fort) et le compresse en AAC (.m4a) dans
site/musique/. Puis il écrit site/data/musique.json (titre, auteur, voix, page, durée), que lit le lecteur.

Il faut ffmpeg : celui du système, sinon `pip install imageio-ffmpeg`.
    python outils/preparer_musique.py
"""
import hashlib
import html
import io
import json
import re
import shutil
import subprocess
import tempfile
import time
import urllib.request
import zipfile
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DOSSIER = RACINE / 'site' / 'musique'
DONNEES = RACINE / 'site' / 'data' / 'musique.json'
CACHE = Path(tempfile.gettempdir()) / 'carte-japon-musique'

VOLUME = -18  # LUFS : assez doux pour accompagner la carte
DEBIT = {'chant': '96k', 'instrumental': '80k'}

# (style, ambiance, page du morceau). Styles : trad (instruments japonais), pop (J-pop chantée), cafe
# (acoustique de café). Ambiances : calme, enjouee, energique. Choisis sur les étiquettes des auteurs
# (バラード, 4つ打ち, ロック, お祭り, 戦闘…) et la liste des instruments.
CHOIX = [
    # ---- Traditionnelle : koto, shamisen, shakuhachi, flûte, taiko
    ('trad', 'calme', 'https://peritune.com/blog/2019/04/08/oboro/'),          # shakuhachi et koto
    ('trad', 'calme', 'https://peritune.com/blog/2016/06/12/minamo/'),         # koto, marimba de verre
    ('trad', 'calme', 'https://peritune.com/blog/2017/09/08/shizima2/'),       # koto et piano
    ('trad', 'calme', 'https://peritune.com/blog/2017/10/08/hanagoyomi/'),     # koto et cordes
    ('trad', 'calme', 'https://maou.audio/bgm_ethnic32/'),                     # koto du Nouvel An
    ('trad', 'enjouee', 'https://peritune.com/blog/2019/01/12/ohayashi/'),     # fête : shamisen, shinobue, taiko
    ('trad', 'enjouee', 'https://peritune.com/blog/2015/11/23/michikusa/'),    # koto, shamisen, shime-daiko
    ('trad', 'enjouee', 'https://peritune.com/blog/2020/04/01/otogi4/'),       # conte : koto, flûte
    ('trad', 'enjouee', 'https://peritune.com/blog/2023/01/07/awayuki/'),      # koto, flûte, guitare
    ('trad', 'enjouee', 'https://maou.audio/bgm_ethnic09/'),                   # fête de quartier
    ('trad', 'enjouee', 'https://maou.audio/bgm_ethnic27/'),                   # shamisen
    ('trad', 'energique', 'https://peritune.com/blog/2016/10/13/amenoshita2/'),  # koto, shamisen, taiko
    ('trad', 'energique', 'https://peritune.com/blog/2020/08/13/amenoshita3/'),  # koto, shamisen, shakuhachi
    ('trad', 'energique', 'https://peritune.com/blog/2018/10/01/ametsuchi/'),    # koto, orchestre
    ('trad', 'energique', 'https://peritune.com/blog/2021/08/17/kengeki/'),      # rock japonais de sabre
    ('trad', 'energique', 'https://maou.audio/bgm_ethnic33/'),                   # thème héroïque à la japonaise
    # ---- Pop japonaise (chansons en japonais)
    ('pop', 'calme', 'https://maou.audio/07_sakurabiyori/'),         # ballade
    ('pop', 'calme', 'https://maou.audio/03_luna_jp/'),              # ballade (version japonaise)
    ('pop', 'calme', 'https://maou.audio/36_tsukinokawa/'),          # ballade
    ('pop', 'calme', 'https://maou.audio/20_ahurera/'),              # ballade
    ('pop', 'calme', 'https://maou.audio/10_where_you_are/'),        # ballade
    ('pop', 'enjouee', 'https://maou.audio/05_halzion/'),            # dance-pop (4つ打ち)
    ('pop', 'enjouee', 'https://maou.audio/39_soleil/'),             # dance-pop
    ('pop', 'enjouee', 'https://maou.audio/37_taiyo_to_spangle/'),   # dance-pop
    ('pop', 'enjouee', 'https://maou.audio/28_karenai_hana/'),       # anisong
    ('pop', 'enjouee', 'https://maou.audio/30_feels_happiness/'),
    ('pop', 'energique', 'https://maou.audio/04_tsuki_to_okami/'),   # rock
    ('pop', 'energique', 'https://maou.audio/11_soreha_shinkiro_datta/'),  # rock
    ('pop', 'energique', 'https://maou.audio/19_12345/'),            # rock
    ('pop', 'energique', 'https://maou.audio/01_crying_again/'),     # rock
    ('pop', 'energique', 'https://maou.audio/44_hikari_trigger/'),
    # ---- Café (guitare et piano acoustiques)
    ('cafe', 'calme', 'https://maou.audio/bgm_acoustic42/'),
    ('cafe', 'calme', 'https://maou.audio/bgm_acoustic06/'),
    ('cafe', 'calme', 'https://maou.audio/bgm_acoustic04/'),
    ('cafe', 'calme', 'https://maou.audio/bgm_acoustic16/'),
    ('cafe', 'calme', 'https://maou.audio/bgm_acoustic29/'),
    ('cafe', 'enjouee', 'https://maou.audio/bgm_acoustic01/'),
    ('cafe', 'enjouee', 'https://maou.audio/bgm_acoustic26/'),
    ('cafe', 'enjouee', 'https://maou.audio/bgm_acoustic38/'),
    ('cafe', 'enjouee', 'https://maou.audio/bgm_acoustic50/'),
    ('cafe', 'enjouee', 'https://maou.audio/bgm_acoustic41/'),
]

AUTEURS = {
    'maou': {'nom': '魔王魂', 'site': 'https://maou.audio/', 'licence': 'CC BY 4.0'},
    'peritune': {'nom': 'PeriTune', 'site': 'https://peritune.com/', 'licence': 'CC BY 4.0'},
}
LICENCE = 'https://creativecommons.org/licenses/by/4.0/'


def lire(url, binaire=False, page=None):
    """Une page ou un fichier, gardé en cache dans le dossier temporaire (une relance ne retélécharge rien).
    Un fichier se télécharge depuis la page du morceau (`page`), comme le bouton « télécharger » du site :
    魔王魂 refuse les mp3 demandés sans elle."""
    CACHE.mkdir(exist_ok=True)
    f = CACHE / (hashlib.md5(url.encode()).hexdigest() + ('.bin' if binaire else '.html'))
    if not f.exists():
        time.sleep(1)  # poliment, un fichier par seconde
        entetes = {'User-Agent': 'Mozilla/5.0 (map.randomjapanplace.com)', **({'Referer': page} if page else {})}
        req = urllib.request.Request(url, headers=entetes)
        f.write_bytes(urllib.request.urlopen(req, timeout=120).read())
    return f if binaire else f.read_text(encoding='utf-8', errors='replace')


def texte(s):
    s = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', s, flags=re.S)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()


def morceau_maou(url):
    p = lire(url)
    t = texte(p)
    nom = html.unescape(re.search(r'<title>(.*?)</title>', p, re.S).group(1)).split('|')[0].strip()
    sous = re.search(r'サブタイトル：([^<]+)<', p)
    voix = re.search(r'ボーカル： ?([^ ]+(?: & [^ ]+)?)', t)
    mp3 = sorted(set(re.findall(r'https://maou\.audio/sound/(?:bgm|song)/maou_[^"\']+?\.mp3', p)))
    # la version normale : ni boucle, ni karaoké (inst), ni courte
    mp3 = [m for m in mp3 if not re.search(r'/maou_(loop|inst|short)_', m)]
    assert len(mp3) == 1, (url, mp3)
    titre = f'{nom}「{html.unescape(sous.group(1)).strip()}」' if sous else nom
    return {'titre': titre, 'auteur': 'maou', 'voix': voix.group(1) if voix else None, 'mp3': mp3[0]}


def morceau_peritune(url):
    p = lire(url)
    date = re.search(r'/blog/(\d{4})/(\d\d)/', url)
    assert (int(date.group(1)), int(date.group(2))) < (2026, 3), f'{url} : publié après février 2026'
    nom = re.search(r'「([^」]+)」', html.unescape(re.search(r'<title>(.*?)</title>', p, re.S).group(1)))
    # le mp3, ou pour certains morceaux un zip (mp3, ogg, m4a) ; jamais la version en boucle (/loop/)
    mp3 = sorted(set(re.findall(r'https?://peritune\.com/music/[^"\']+?\.mp3', p))) \
        or sorted(set(re.findall(r'https?://peritune\.com/music/[^"\']+?\.zip', p)))
    assert len(mp3) == 1, (url, mp3)
    return {'titre': nom.group(1) if nom else Path(mp3[0]).stem.split('_', 1)[1], 'auteur': 'peritune', 'voix': None,
            'mp3': mp3[0].replace('http://', 'https://')}


def source(url, page):
    """Le fichier son téléchargé ; d'un zip, on sort le mp3 (pas la boucle)."""
    f = lire(url, binaire=True, page=page)
    if not url.endswith('.zip'):
        return f
    with zipfile.ZipFile(io.BytesIO(f.read_bytes())) as z:
        noms = [n for n in z.namelist() if n.lower().endswith('.mp3') and 'loop' not in n.lower()]
        assert len(noms) == 1, (url, z.namelist())
        sortie = f.with_suffix('.mp3')
        sortie.write_bytes(z.read(noms[0]))
        return sortie


def ffmpeg():
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    import imageio_ffmpeg  # pip install imageio-ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def encoder(source, cible, debit, infos):
    """Volume égalisé en deux passes (loudnorm), puis AAC, avec l'index au début (lecture immédiate)."""
    exe = ffmpeg()
    filtre = f'loudnorm=I={VOLUME}:TP=-1.5:LRA=11'
    sortie = subprocess.run([exe, '-hide_banner', '-nostats', '-i', str(source), '-af', filtre + ':print_format=json',
                             '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    m = json.loads(sortie[sortie.rindex('{'):sortie.rindex('}') + 1])
    filtre += (f":measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
               f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run([exe, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source), '-vn', '-af', filtre,
                    '-ar', '44100', '-c:a', 'aac', '-b:a', debit, '-map_metadata', '-1',
                    '-metadata', f"title={infos['titre']}", '-metadata', f"artist={AUTEURS[infos['auteur']]['nom']}",
                    '-movflags', '+faststart', str(cible)], check=True)


def duree(fichier):
    sortie = subprocess.run([ffmpeg(), '-hide_banner', '-i', str(fichier)], capture_output=True, text=True,
                            encoding='utf-8', errors='replace').stderr
    h, mi, s = re.search(r'Duration: (\d+):(\d+):([\d.]+)', sortie).groups()
    return round(int(h) * 3600 + int(mi) * 60 + float(s))


def main():
    DOSSIER.mkdir(exist_ok=True)
    morceaux, gardes = [], set()
    for style, ambiance, page in CHOIX:
        infos = morceau_peritune(page) if 'peritune.com' in page else morceau_maou(page)
        ident = ('peritune-' if infos['auteur'] == 'peritune' else 'maou-') + page.rstrip('/').rsplit('/', 1)[1].lower()
        ident = re.sub(r'[^a-z0-9-]+', '-', ident).strip('-')
        cible = DOSSIER / f'{ident}.m4a'
        if not cible.exists():
            print('…', ident, infos['titre'], flush=True)
            encoder(source(infos['mp3'], page), cible, DEBIT['chant' if infos['voix'] else 'instrumental'], infos)
        gardes.add(cible.name)
        morceaux.append({'id': ident, 'style': style, 'ambiance': ambiance, 'titre': infos['titre'],
                         'auteur': infos['auteur'], **({'voix': infos['voix']} if infos['voix'] else {}),
                         'page': page, 'fichier': f'musique/{cible.name}', 'duree': duree(cible)})
    for f in DOSSIER.glob('*.m4a'):  # un morceau retiré de CHOIX
        if f.name not in gardes:
            f.unlink()
            print('retiré :', f.name)
    DONNEES.write_text(json.dumps({'licence': LICENCE, 'auteurs': AUTEURS, 'morceaux': morceaux},
                                  ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    total = sum(f.stat().st_size for f in DOSSIER.glob('*.m4a'))
    print(f'{len(morceaux)} morceaux, {sum(m["duree"] for m in morceaux) // 60} min, {total / 1e6:.0f} Mo')


if __name__ == '__main__':
    main()
