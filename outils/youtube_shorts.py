r"""Le robot YouTube : publie sur la chaîne Random Japan Place un Short par lieu de la carte, fait de la vidéo du montage
(D:\Montage\Vidéo lieux random japon, une vidéo muette par lieu, comme pour couvertures_montage.py) et d'une musique de
la banque du propriétaire (C:\Users\Lucas\Videos\noTube).

Demandé par le propriétaire le 2026-11-22 : 170 lieux sur TikTok, 3 Shorts sur YouTube, dont 2 bloqués pour leur musique
(Radwimps). La règle de YouTube : un Short de plus d'une minute avec une musique revendiquée est bloqué partout ; en
dessous d'une minute, il reste en ligne (l'argent va au label ; ce n'est pas un avertissement pour la chaîne). Le robot
coupe donc chaque vidéo à 59 s. Le propriétaire a choisi des musiques connues (sa banque) en le sachant.

À chaque passage :
1. Il lit le tableau (le lien publié de config.js, sinon la copie de secours site/data/secours-lieux.csv) et retrouve la
   vidéo de chaque lieu : même nom que « Nom (EN) » (sans accents ni majuscules), sinon la ligne du lieu dans
   Vignettes.txt (« Nom = fichier.mp4 @ 12 ») ou dans Correspondances.txt du dossier du robot (« Nom = fichier.mp4 »).
2. Il demande à YouTube les vidéos déjà sur la chaîne, publiées ou programmées : un lieu déjà là n'est pas republié
   (reconnu au nom avant « | » dans le titre). Un Short supprimé par le propriétaire sera donc republié.
3. Il prépare les Shorts suivants, dans l'ordre de sortie des lieux sur TikTok (le numéro de leur vidéo) : 59 s au plus,
   le son de la vidéo remplacé par une musique de la banque (la moins utilisée, jamais une des 3 dernières, jamais une
   musique notée bloquée), prise à son passage le plus fort (ou à l'instant donné dans Musiques.txt), fondue au début et
   à la fin, au volume de YouTube (-14 LUFS).
4. Il les envoie programmés : 4 par jour (8 h, 12 h, 17 h et 21 h, heure de Paris), à la suite des Shorts déjà programmés,
   jusqu'à 14 jours d'avance, 12 envois au plus par passage (YouTube en accepte 100 par jour).
5. Il regarde les Shorts qu'il a envoyés : si YouTube en bloque un dans beaucoup de pays, sa musique est notée bloquée
   (plus jamais utilisée) et une notification le dit ; le propriétaire supprime ce Short, le robot republie le lieu
   avec une autre musique au passage suivant.

Titre : « <Nom (EN)> | <préfecture> 📍 #japan #shorts #japantravel #travel #calm », comme les Shorts du propriétaire
(#shorts à la place de #fyp, qui est un mot de TikTok). Description et tags : toujours les mêmes (le propriétaire,
2026-11-22 : « tu choisis les tags et la description et tu mettras les mêmes tout le temps »).

Le dossier du robot (ROBOT, D:\Montage\Robot YouTube) :
- client_secret.json : l'accès à l'API créé par le propriétaire sur Google Cloud (un « ID client OAuth », application de
  bureau) ; jeton.json : l'autorisation qu'il donne une fois avec --autoriser. Ni l'un ni l'autre ne vont dans git.
- journal.json (les envois, leur musique, les musiques bloquées), journal.txt (le récit des passages).
- Correspondances.txt (« Nom du lieu = fichier.mp4 ») et Musiques.txt (« fichier.mp3 = 1:05 » : la musique commence là ;
  « fichier.mp3 = non » : ne plus l'utiliser).
- preparation/ : les Shorts prêts, effacés une fois envoyés.

python outils/youtube_shorts.py --autoriser   une fois : le navigateur s'ouvre, le propriétaire choisit sa chaîne
python outils/youtube_shorts.py --liste       ce qui reste à publier, les lieux sans vidéo, les vidéos sans lieu
python outils/youtube_shorts.py --essai [N]   prépare les N prochains Shorts (3 par défaut) sans rien envoyer
python outils/youtube_shorts.py [--max N]     un passage : envoie jusqu'à N Shorts (12 par défaut)
pythonw outils/youtube_shorts.py --tout-seul  pareil, sans fenêtre, pour la tâche Windows (notification à la fin)
Il faut ffmpeg, numpy, et pip install google-api-python-client google-auth-oauthlib.
"""
import csv
import io
import json
import os
import re
import subprocess
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from couvertures_montage import (EXTENSIONS, REPOS_FICHIER, SANS_FENETRE, VIDEOS_LIEUX, cle, demandes, ffmpeg,  # noqa: E402
                                 prevenir, trouver_video)
from fabriquer_pages import champ, lire_gps, lire_regions, normaliser, slug  # noqa: E402
from fabriquer_prefectures import trouver  # noqa: E402
from sauvegarder_tableau import lien  # noqa: E402

RACINE = Path(__file__).resolve().parent.parent
ROBOT = Path(os.environ.get("ROBOT_YOUTUBE", r"D:\Montage\Robot YouTube"))
MUSIQUES = Path(os.environ.get("MUSIQUES_YOUTUBE", r"C:\Users\Lucas\Videos\noTube"))
PREPARATION = ROBOT / "preparation"
JOURNAL = ROBOT / "journal.json"
RECIT = ROBOT / "journal.txt"
SECRET = ROBOT / "client_secret.json"
JETON = ROBOT / "jeton.json"
CORRESPONDANCES = ROBOT / "Correspondances.txt"
CHOIX_MUSIQUES = ROBOT / "Musiques.txt"
PORTEES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"]

DUREE_MAX = 59.0  # s : un Short de plus d'une minute avec une musique revendiquée est bloqué partout
HEURES = ("08:00", "12:00", "17:00", "21:00")  # les sorties de chaque jour, heure de Paris (4 par jour)
PARIS = ZoneInfo("Europe/Paris")
AVANCE = timedelta(days=14)  # on programme jusqu'à 14 jours devant
ENVOIS_MAX = 12  # par passage
FONDU_DEBUT, FONDU_FIN = 0.6, 2.0  # s, la musique
FONDU_IMAGE = 0.4  # s, l'image à la fin (fondu au noir)
PAYS_BLOQUES = 30  # au-delà, la musique est notée bloquée

TITRE = "{nom} | {pref} 📍 #japan #shorts #japantravel #travel #calm"
DESCRIPTION = """A random place in Japan 🇯🇵📍

Explore every place on my interactive 3D map of Japan, with its location, photos and travel tips:
https://map.randomjapanplace.com/

More places on TikTok: @random_japan_place

#japan #shorts #japantravel #travel #japanvibes #explorejapan #randomjapanplace"""
# les tags : toujours les mêmes ; plus nombreux le 2026-11-22 (le propriétaire : « rajouter quelques tags en plus »).
# YouTube en accepte 500 caractères en tout, en comptant les virgules et les guillemets autour d'un tag à espaces.
TAGS = ["japan", "japan travel", "travel japan", "japan vibes", "explore japan", "visit japan", "japan trip",
        "japanese culture", "japan nature", "hidden gems japan", "random japan place", "travel", "shorts",
        "japan shorts", "beautiful japan", "japan scenery", "japan aesthetic", "places to visit in japan",
        "japan travel guide", "japan travel tips", "japan bucket list", "underrated japan", "japan countryside",
        "japanese shrine", "japanese temple", "japan 3d map", "travel shorts", "nihon", "日本", "japon", "voyage japon"]
assert sum(len(t) + (2 if " " in t else 0) for t in TAGS) + len(TAGS) - 1 <= 480, "trop de tags pour YouTube"
CATEGORIE = "19"  # Voyages et événements

# Les vidéos promo de la carte et de la balade (demandé par le propriétaire le 2026-11-23 : « publier les vidéos
# promotionnelles qu'on a faites pour la carte de temps en temps ») : une tous les 2 jours, à la place du Short de 17 h,
# telles quelles (leur musique est libre : composée, faite par IA, ou CC BY, créditée alors dans la description).
# Pas celles d'Halloween (fini), ni promo30 (elle annonce Halloween), ni les versions 16:9 ou sans musique.
# ia : faite avec des images ou des vidéos d'IA -> l'étiquette « contenu modifié ou synthétique » de YouTube.
PROMOS_VIDEOS = Path(os.environ.get("PROMOS_YOUTUBE", r"D:\Business\Claude Code\Maps Japon\videos"))
PROMO_HEURE, PROMO_TOUS_LES = "17:00", 2  # le créneau de 17 h, un jour sur deux
PERITUNE = "Music: {} by PeriTune (CC BY 4.0) {}"
PROMOS = [
    {"f": "carte/generique/carte-japon-generique-anime.mp4", "titre": "If my Japan map had an anime opening ⚔️", "ia": True},
    {"f": "carte/jeu/carte-japon-jeu-versus.mp4", "titre": "Noob vs pro: who knows Japan best? 🎮"},
    {"f": "balade/balade-3d-les-5-lieux.mp4", "titre": "I turned places in Japan into a 3D game you can walk in ⛩️"},
    {"f": "carte/jarre/carte-japon-jarre.mp4", "titre": "Japan was hidden inside this jar 🏺", "ia": True},
    {"f": "carte/films-octobre/film-voyage.mp4", "titre": "All of Japan, north to south, in one flight ✈️",
     "musique": PERITUNE.format("Ametsuchi", "https://peritune.com/blog/2018/10/01/ametsuchi/")},
    {"f": "carte/jeu/carte-japon-devine-le-lieu.mp4", "titre": "Can you guess this place in Japan? 🎯"},
    {"f": "balade/balade-3d-takachiho.mp4", "titre": "Takachiho Gorge, but you can walk it in 3D 🚣"},
    {"f": "carte/sceau/carte-japon-sceau.mp4", "titre": "I sealed my Japan map with wax 🔴", "ia": True},
    {"f": "carte/generique/carte-japon-generique-anime-2.mp4", "titre": "If my Japan map had an anime opening 2 🌸", "ia": True},
    {"f": "balade/balade-3d-secrets.mp4", "titre": "My 3D Japan game hides secrets 🤫"},
    {"f": "carte/fleche/carte-japon-flechette.mp4", "titre": "I threw a dart at my Japan map 🎯", "ia": True},
    {"f": "carte/jeu/carte-japon-defi-du-jour.mp4", "titre": "A new place in Japan to guess every day 📍"},
    {"f": "balade/balade-3d-kinkakuji.mp4", "titre": "The Golden Pavilion, walkable in 3D ✨"},
    {"f": "carte/films-octobre/promo-carte.mp4", "titre": "My interactive 3D map of Japan 🗾",
     "musique": PERITUNE.format("Michikusa", "https://peritune.com/blog/2015/11/23/michikusa/")},
    {"f": "balade/balade-3d-beppu.mp4", "titre": "The Hells of Beppu in my 3D game ♨️"},
    {"f": "carte/puzzle/carte-japon-puzzle.mp4", "titre": "The last piece of my Japan map puzzle 🧩", "ia": True},
    {"f": "carte/generique/carte-japon-generique-anime-3.mp4", "titre": "If my Japan map had an anime opening 3 ⚔️", "ia": True},
    {"f": "balade/balade-3d-motonosumi.mp4", "titre": "Red torii gates by the sea, in 3D ⛩️"},
    {"f": "carte/jeu/carte-japon-jeu-createur.mp4", "titre": "I made a game to guess places in Japan 🎮"},
    {"f": "carte/films-octobre/film-zoom.mp4", "titre": "From one place to the whole of Japan 🗾",
     "musique": PERITUNE.format("Awayuki", "https://peritune.com/blog/2023/01/07/awayuki/")},
    {"f": "balade/balade-3d-trente-bouddhas.mp4", "titre": "The Thirty Buddhas, now in my 3D game 🙏"},
    {"f": "carte/eclat/carte-japon-eclat.mp4", "titre": "I smashed my Japan map 💥", "ia": True},
    {"f": "balade/balade-3d-udo-yakushima.mp4", "titre": "A secret island you reach only by boat 🔒"},
    {"f": "tournage/promo-carte-tournage.mp4", "titre": "Every place from my videos, on one 3D map of Japan 📍",
     "musique": "Music: 12345 by 魔王魂 (Maou Damashii, CC BY 4.0) https://maou.audio/19_12345/"},
    {"f": "balade/balade-3d-tottori.mp4", "titre": "The Tottori Sand Dunes, in a 3D game 🐪"},
    {"f": "carte/films-octobre/film-pov.mp4", "titre": "POV: you plan your Japan trip on a 3D map",
     "musique": "Music: Avenue Cafe by 魔王魂 (Maou Damashii, CC BY 4.0) https://maou.audio/bgm_acoustic38/"},
    {"f": "balade/balade-3d-tsubosaka.mp4", "titre": "A Japanese temple with giant statues carved in India 🐘"},
    {"f": "carte/generique/carte-japon-generique-anime-4.mp4", "titre": "If my Japan map had an anime opening 4 🌸", "ia": True},
    {"f": "balade/balade-3d-sumi.mp4", "titre": "I put myself in my own game 🎨"},
    {"f": "balade/balade-3d-iiyama.mp4", "titre": "A snow festival you can walk in 3D ❄️"},
    {"f": "carte/tunnel/carte-japon-tunnel-tiktok.mp4", "titre": "From one TikTok to the whole map 📍",
     "musique": PERITUNE.format("Amenoshita3", "https://peritune.com/blog/2020/08/13/amenoshita3/")},
    {"f": "balade/balade-3d-en-vrai.mp4", "titre": "My 3D game vs the real places in Japan", "ia": True},
]


# ---------------------------------------------------------------------------------------------------- les lieux
def lire_tableau():
    """Les lignes du tableau : le lien publié (à jour), sinon la copie de secours du dépôt."""
    try:
        url = lien("lieux", (RACINE / "site" / "config.js").read_text(encoding="utf-8"))
        with urllib.request.urlopen(url, timeout=60) as r:
            texte = r.read().decode("utf-8-sig")
        if "Nom (EN)" not in texte.splitlines()[0]:
            raise ValueError("contenu inattendu")
    except Exception as e:
        dire(f"Le tableau en ligne ne répond pas ({e}) : on prend la copie de secours")
        texte = (RACINE / "site" / "data" / "secours-lieux.csv").read_text(encoding="utf-8-sig")
    lignes = list(csv.reader(io.StringIO(texte)))
    entetes = [normaliser(h) for h in lignes[0]]
    return [dict(zip(entetes, l)) for l in lignes[1:]]


def lieux():
    """Les lieux affichés sur la carte, avec leur préfecture (en anglais) et le numéro de leur vidéo TikTok."""
    prefs, _ = lire_regions()
    geo = json.loads((RACINE / "site" / "data" / "prefectures.geojson").read_text(encoding="utf-8"))
    out = []
    for r in lire_tableau():
        nom = champ(r, ["nomen", "nom", "name", "nameen"]).strip()
        gps = lire_gps(champ(r, ["coordonneesgps", "coordonnees", "gps", "coordinates"]))
        if not nom or not gps:
            continue
        if re.fullmatch(r"(non|no|false|faux|0|いいえ)", champ(r, ["afficher", "visible", "show"]).strip(), re.I):
            continue
        code, _ = trouver(gps[1], gps[0], geo["features"])
        m = re.search(r"video/(\d+)", champ(r, ["lientiktok", "tiktok"]))
        out.append({"id": slug(nom), "nom": nom, "pref": prefs.get(code, {}).get("en", ""),
                    "tiktok": int(m.group(1)) if m else None})
    return out


def lire_lignes(fichier):
    """Les lignes « gauche = droite » d'un fichier texte du propriétaire (# : une explication)."""
    if not fichier.exists():
        return []
    out = []
    for ligne in fichier.read_text(encoding="utf-8-sig", errors="replace").splitlines():
        ligne = ligne.strip()
        if ligne and not ligne.startswith("#") and "=" in ligne:
            g, _, d = ligne.rpartition("=")
            out.append((g.strip(), d.strip()))
    return out


def videos_des_lieux(tous):
    """{id du lieu: fichier}, et les fichiers du montage qui ne vont à aucun lieu."""
    fichiers = {cle(f.stem): f for f in VIDEOS_LIEUX.iterdir() if f.is_file() and f.suffix.lower() in EXTENSIONS}
    noms = {cle(l["nom"]) for l in tous}
    a_la_main = {k: f for k, (f, _t, _m) in demandes([]).items() if f}  # Vignettes.txt
    a_la_main.update({cle(n): f.split("@")[0].strip() for n, f in lire_lignes(CORRESPONDANCES)})
    trouves = {}
    for l in tous:
        f = a_la_main.get(cle(l["nom"]))
        video = (VIDEOS_LIEUX / f) if f else trouver_video(l["nom"], fichiers, noms - {cle(l["nom"])})
        if video and video.exists():
            trouves[l["id"]] = video
    pris = {v.name for v in trouves.values()}
    return trouves, sorted(f.name for f in fichiers.values() if f.name not in pris)


# ---------------------------------------------------------------------------------------------------- la musique
def secondes(texte):
    """« 1:05 », « 65 » ou « 65,5 » -> 65.0 s."""
    t = texte.replace(",", ".").strip()
    if ":" in t:
        m, s = t.split(":", 1)
        return int(m) * 60 + float(s)
    return float(t)


def duree(fichier):
    r = subprocess.run([ffmpeg(), "-hide_banner", "-i", str(fichier)], capture_output=True, text=True, errors="replace",
                       creationflags=SANS_FENETRE)
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr)
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)) if m else 0.0


def debut_musique(fichier, longueur):
    """Le passage le plus fort de la musique, sur toute la longueur du Short : là où on entend le refrain. Le début
    est ramené au creux le plus proche juste avant (une fin de phrase), pour ne pas couper un mot."""
    pcm = subprocess.run([ffmpeg(), "-v", "error", "-i", str(fichier), "-ac", "1", "-ar", "4000", "-f", "f32le", "-"],
                         capture_output=True, creationflags=SANS_FENETRE).stdout
    son = np.frombuffer(pcm, dtype=np.float32)
    pas = 2000  # 0,5 s
    n = len(son) // pas
    if n * pas / 4000 <= longueur + 2:
        return 0.0
    rms = np.sqrt(np.mean(son[: n * pas].reshape(n, pas) ** 2, axis=1))
    fen = int(longueur / 0.5)
    moyennes = np.convolve(rms, np.ones(fen) / fen, mode="valid")  # la force moyenne de chaque passage possible
    moyennes[: 10] = 0  # pas les 5 premières secondes (souvent un début calme)
    i = int(np.argmax(moyennes))
    avant = rms[max(0, i - 8): i + 2]  # le creux dans les 4 s d'avant
    i = max(0, i - 8) + int(np.argmin(avant))
    return round(i * 0.5, 1)


def choisir_musique(journal, lieu_id):
    """La musique la moins utilisée, jamais une des 3 dernières ni une bloquée ; à égalité, une au hasard (fixé par le
    lieu, pour que l'essai et l'envoi donnent la même)."""
    reglages = {cle(Path(f).stem): d for f, d in lire_lignes(CHOIX_MUSIQUES)}
    toutes = [f for f in sorted(MUSIQUES.iterdir()) if f.suffix.lower() in {".mp3", ".m4a", ".wav", ".flac", ".ogg"}
              and reglages.get(cle(f.stem), "").lower() != "non" and f.name not in journal["musiques_bloquees"]]
    if not toutes:
        raise RuntimeError(f"Aucune musique utilisable dans {MUSIQUES}")
    # les vidéos promo gardent leur propre musique : elles n'ont pas de « musique » de la banque dans le journal
    deja = [e["musique"] for e in journal["envois"] if e.get("musique")]
    usages = {}
    for m in deja:
        usages[m] = usages.get(m, 0) + 1
    recentes = deja[-3:]
    possibles = [f for f in toutes if f.name not in recentes] or toutes
    mini = min(usages.get(f.name, 0) for f in possibles)
    possibles = [f for f in possibles if usages.get(f.name, 0) == mini]
    f = possibles[sum(map(ord, lieu_id)) % len(possibles)]
    reglage = reglages.get(cle(f.stem))
    return f, (secondes(reglage) if reglage and reglage.lower() != "non" else None)


# ---------------------------------------------------------------------------------------------------- le Short
def preparer(lieu, video, journal):
    """Le Short prêt à envoyer : la vidéo (59 s au plus, en 1080 × 1920), la musique à la place du son."""
    musique, debut = choisir_musique(journal, lieu["id"])
    longueur = min(duree(video), DUREE_MAX)
    if debut is None:
        debut = debut_musique(musique, longueur)
    debut = max(0.0, min(debut, duree(musique) - longueur))
    PREPARATION.mkdir(parents=True, exist_ok=True)
    sortie = PREPARATION / f"{lieu['id']}.mp4"
    image = ("scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,"
             f"fade=t=out:st={longueur - FONDU_IMAGE:.2f}:d={FONDU_IMAGE},format=yuv420p")
    son = (f"afade=t=in:d={FONDU_DEBUT},afade=t=out:st={longueur - FONDU_FIN:.2f}:d={FONDU_FIN},"
           "loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000")
    cmd = [ffmpeg(), "-y", "-v", "error", "-i", str(video), "-ss", f"{debut:.2f}", "-i", str(musique),
           "-map", "0:v:0", "-map", "1:a:0", "-t", f"{longueur:.2f}", "-vf", image, "-af", son,
           "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-c:a", "aac", "-b:a", "192k",
           "-map_metadata", "-1", "-map_chapters", "-1", "-write_tmcd", "0",  # ni piste de temps ni infos du montage
           "-movflags", "+faststart", str(sortie)]
    r = subprocess.run(cmd, capture_output=True, text=True, errors="replace", creationflags=SANS_FENETRE)
    if r.returncode or not sortie.exists():
        raise RuntimeError(f"ffmpeg n'a pas pu préparer {lieu['nom']} : {r.stderr[-400:]}")
    return sortie, musique.name, debut, longueur


def titre(lieu):
    t = TITRE.format(nom=lieu["nom"], pref=lieu["pref"] or "Japan")
    while len(t) > 100 and "#" in t:  # YouTube : 100 caractères au plus ; on retire les derniers mots-clés
        t = t.rsplit(" #", 1)[0]
    return t[:100]


def titre_promo(promo):
    t = promo["titre"] + " #japan #shorts #japantravel"
    while len(t) > 100 and "#" in t:
        t = t.rsplit(" #", 1)[0]
    return t[:100]


# ---------------------------------------------------------------------------------------------------- YouTube
def youtube(autoriser=False):
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build

    jeton = Credentials.from_authorized_user_file(str(JETON), PORTEES) if JETON.exists() else None
    if jeton and jeton.expired and jeton.refresh_token:
        try:
            jeton.refresh(Request())
        except Exception as e:
            dire(f"L'autorisation n'est plus valable ({e})")
            jeton = None
    if not jeton or not jeton.valid:
        if not autoriser:
            raise RuntimeError("Le robot n'a pas (ou plus) l'autorisation de publier : lancer une fois "
                               "« python outils/youtube_shorts.py --autoriser »")
        if not SECRET.exists():
            raise RuntimeError(f"Il manque {SECRET} (l'ID client OAuth téléchargé depuis Google Cloud)")
        flux = InstalledAppFlow.from_client_secrets_file(str(SECRET), PORTEES)
        jeton = flux.run_local_server(port=0, prompt="consent",
                                      success_message="C'est bon : le robot peut publier sur ta chaîne. Tu peux fermer cette page.")
    JETON.write_text(jeton.to_json(), encoding="utf-8")
    return build("youtube", "v3", credentials=jeton, cache_discovery=False)


def videos_de_la_chaine(yt):
    """Toutes les vidéos de la chaîne (publiées, programmées, privées) : id, titre, statut, date, pays bloqués."""
    chaine = yt.channels().list(part="snippet,contentDetails", mine=True).execute()["items"][0]
    liste = chaine["contentDetails"]["relatedPlaylists"]["uploads"]
    ids, page = [], None
    while True:
        r = yt.playlistItems().list(part="contentDetails", playlistId=liste, maxResults=50, pageToken=page).execute()
        ids += [i["contentDetails"]["videoId"] for i in r["items"]]
        page = r.get("nextPageToken")
        if not page:
            break
    out = []
    for i in range(0, len(ids), 50):
        r = yt.videos().list(part="snippet,status,contentDetails", id=",".join(ids[i:i + 50])).execute()
        for v in r["items"]:
            restr = v["contentDetails"].get("regionRestriction", {})
            out.append({"id": v["id"], "titre": v["snippet"]["title"], "statut": v["status"]["privacyStatus"],
                        "programme": v["status"].get("publishAt"), "publie": v["snippet"].get("publishedAt"),
                        "bloque": len(restr.get("blocked", [])) if "blocked" in restr else (250 if "allowed" in restr else 0)})
    return chaine["snippet"]["title"], out


def creneaux(chaine, maintenant):
    """Les créneaux libres (8 h, 12 h, 17 h, 21 h, heure de Paris), dans l'ordre, après le dernier Short programmé."""
    programmes = [datetime.fromisoformat(v["programme"].replace("Z", "+00:00")) for v in chaine if v["programme"]]
    apres = max([maintenant + timedelta(hours=1)] + programmes)
    jour = apres.astimezone(PARIS).date()
    while True:
        for h in HEURES:
            creneau = datetime.combine(jour, datetime.strptime(h, "%H:%M").time(), PARIS)
            if creneau > apres:
                yield creneau
        jour += timedelta(days=1)


def creneau_promo(quand):
    """Le créneau d'une vidéo promo : 17 h, un jour sur deux."""
    local = quand.astimezone(PARIS)
    return local.strftime("%H:%M") == PROMO_HEURE and local.date().toordinal() % PROMO_TOUS_LES == 0


def envoyer(yt, chemin, titre_video, quand, description=DESCRIPTION, ia=False):
    from googleapiclient.http import MediaFileUpload

    corps = {"snippet": {"title": titre_video, "description": description, "tags": TAGS, "categoryId": CATEGORIE,
                         "defaultLanguage": "en"},
             "status": {"privacyStatus": "private", "publishAt": quand.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
                        "selfDeclaredMadeForKids": False, "embeddable": True, "containsSyntheticMedia": ia}}
    media = MediaFileUpload(str(chemin), mimetype="video/mp4", chunksize=8 * 1024 * 1024, resumable=True)
    requete = yt.videos().insert(part="snippet,status", body=corps, media_body=media)
    reponse = None
    while reponse is None:
        _etat, reponse = requete.next_chunk()
    return reponse["id"]


# ---------------------------------------------------------------------------------------------------- le passage
def dire(texte):
    ligne = f"{datetime.now():%Y-%m-%d %H:%M} {texte}"
    try:
        print(ligne)
    except (UnicodeEncodeError, AttributeError, OSError):  # pythonw n'a pas de console
        pass
    ROBOT.mkdir(parents=True, exist_ok=True)
    with RECIT.open("a", encoding="utf-8") as f:
        f.write(ligne + "\n")


def lire_journal():
    if JOURNAL.exists():
        return json.loads(JOURNAL.read_text(encoding="utf-8"))
    return {"envois": [], "musiques_bloquees": {}}


def ecrire_journal(journal):
    ROBOT.mkdir(parents=True, exist_ok=True)
    JOURNAL.write_text(json.dumps(journal, ensure_ascii=False, indent=1), encoding="utf-8")


def a_publier(tous, trouves, deja):
    """Les lieux qui ont une vidéo (exportée depuis plus de 10 min) et ne sont pas sur la chaîne, du plus ancien sur
    TikTok au plus récent."""
    import time
    pret = [l for l in tous if l["id"] in trouves and cle(l["nom"]) not in deja
            and time.time() - trouves[l["id"]].stat().st_mtime > REPOS_FICHIER]
    return sorted(pret, key=lambda l: (l["tiktok"] is None, l["tiktok"] or 0, l["nom"]))


def passage(envois_max, essai=None, tout_seul=False):
    journal = lire_journal()
    tous = lieux()
    trouves, _orphelins = videos_des_lieux(tous)
    if essai:
        for lieu in a_publier(tous, trouves, set())[:essai]:
            chemin, musique, debut, longueur = preparer(lieu, trouves[lieu["id"]], journal)
            journal["envois"].append({"musique": musique})  # pour que l'essai suivant prenne une autre musique
            dire(f"Essai : {chemin.name} ({longueur:.0f} s) · {titre(lieu)} · musique {musique} à {debut:.0f} s")
        return 0

    yt = youtube()
    nom_chaine, chaine = videos_de_la_chaine(yt)
    # les Shorts du robot que YouTube bloque : leur musique ne sert plus
    par_id = {v["id"]: v for v in chaine}
    alertes = []
    for e in journal["envois"]:
        v = par_id.get(e.get("video"))
        if v and v["bloque"] >= PAYS_BLOQUES and e.get("promo") and not e.get("signale"):
            e["signale"] = True
            alertes.append(f"La vidéo promo « {e['titre']} » est bloquée par YouTube : regarde dans YouTube Studio pourquoi.")
        if v and v["bloque"] >= PAYS_BLOQUES and e.get("musique") and e["musique"] not in journal["musiques_bloquees"]:
            journal["musiques_bloquees"][e["musique"]] = f"{datetime.now():%Y-%m-%d} {e['nom']}"
            alertes.append(f"{e['nom']} est bloqué par YouTube à cause de sa musique ({e['musique']}). "
                           "Supprime ce Short dans YouTube Studio : le robot le republiera avec une autre musique.")
    for a in alertes:
        dire(a)
    deja = {cle(v["titre"].split("|")[0]) for v in chaine}
    titres = {cle(v["titre"]) for v in chaine}
    restants = a_publier(tous, trouves, deja)
    promos = [p for p in PROMOS if cle(titre_promo(p)) not in titres and (PROMOS_VIDEOS / p["f"]).exists()]
    maintenant = datetime.now(timezone.utc)
    envoyes, reste = [], len(restants)
    for quand in creneaux(chaine, maintenant):
        if len(envoyes) >= envois_max or quand > maintenant + AVANCE or not (restants or promos):
            break
        if creneau_promo(quand) and promos:  # une vidéo promo, telle quelle
            promo = promos.pop(0)
            description = DESCRIPTION + (f"\n\n{promo['musique']}" if promo.get("musique") else "")
            video_id = envoyer(yt, PROMOS_VIDEOS / promo["f"], titre_promo(promo), quand, description, promo.get("ia", False))
            journal["envois"].append({"promo": promo["f"], "titre": titre_promo(promo), "video": video_id,
                                      "sortie": quand.isoformat(), "envoye": datetime.now(PARIS).isoformat(timespec="seconds")})
            envoyes.append(promo["titre"])
            dire(f"Envoyé : la vidéo promo « {promo['titre']} » (sortie le {quand:%d/%m à %H:%M}) https://youtube.com/shorts/{video_id}")
        elif restants:  # le Short d'un lieu
            lieu = restants.pop(0)
            chemin, musique, debut, longueur = preparer(lieu, trouves[lieu["id"]], journal)
            video_id = envoyer(yt, chemin, titre(lieu), quand)
            journal["envois"].append({"lieu": lieu["id"], "nom": lieu["nom"], "fichier": trouves[lieu["id"]].name,
                                      "musique": musique, "debut": debut, "duree": round(longueur, 1), "video": video_id,
                                      "sortie": quand.isoformat(), "envoye": datetime.now(PARIS).isoformat(timespec="seconds")})
            chemin.unlink(missing_ok=True)
            envoyes.append(lieu["nom"])
            reste -= 1
            dire(f"Envoyé : {lieu['nom']} (sortie le {quand:%d/%m à %H:%M}, musique {musique} à {debut:.0f} s) "
                 f"https://youtube.com/shorts/{video_id}")
        else:  # plus de lieux : ce créneau reste libre, on attend celui d'une promo
            continue
        chaine.append({"id": video_id, "titre": "", "statut": "private",
                       "programme": quand.astimezone(timezone.utc).isoformat(), "publie": None, "bloque": 0})
        ecrire_journal(journal)
    ecrire_journal(journal)
    dire(f"Passage fini ({nom_chaine}) : {len(envoyes)} Short(s) programmé(s), {reste} lieu(x) et {len(promos)} vidéo(s) promo "
         "encore à publier")
    if tout_seul and (envoyes or alertes):
        prevenir("Robot YouTube", " ".join(alertes) or f"{len(envoyes)} Short(s) programmé(s) sur YouTube. Encore {reste} lieu(x) à publier.")
    return 0


def liste():
    tous = lieux()
    trouves, orphelins = videos_des_lieux(tous)
    sans = [l["nom"] for l in tous if l["id"] not in trouves]
    print(f"{len(tous)} lieux sur la carte, {len(trouves)} avec une vidéo du montage.")
    print(f"\nLieux sans vidéo trouvée ({len(sans)}) : ajouter « Nom = fichier.mp4 » dans {CORRESPONDANCES}")
    for n in sans:
        print("  -", n)
    print(f"\nVidéos du montage qui ne vont à aucun lieu ({len(orphelins)}) :")
    for f in orphelins:
        print("  -", f)
    manquent = [p["f"] for p in PROMOS if not (PROMOS_VIDEOS / p["f"]).exists()]
    print(f"\n{len(PROMOS)} vidéos promo, une tous les {PROMO_TOUS_LES} jours à {PROMO_HEURE}" +
          (f" ; introuvables : {', '.join(manquent)}" if manquent else ""))
    for p in PROMOS:
        print("  -", titre_promo(p), "(IA)" if p.get("ia") else "", "·", p.get("musique", ""))
    ordre = a_publier(tous, trouves, set())
    print(f"\nOrdre de publication (du plus ancien sur TikTok), les 10 premiers :")
    for l in ordre[:10]:
        print("  -", titre(l), "←", trouves[l["id"]].name)


def main():
    args = sys.argv[1:]
    tout_seul = "--tout-seul" in args
    try:
        if "--autoriser" in args:
            yt = youtube(autoriser=True)
            nom, chaine = videos_de_la_chaine(yt)
            dire(f"Autorisation enregistrée pour la chaîne « {nom} » ({len(chaine)} vidéos dessus)")
            return 0
        if "--liste" in args:
            liste()
            return 0
        if "--essai" in args:
            i = args.index("--essai")
            n = int(args[i + 1]) if i + 1 < len(args) and args[i + 1].isdigit() else 3
            return passage(0, essai=n)
        n = ENVOIS_MAX
        if "--max" in args:
            n = int(args[args.index("--max") + 1])
        return passage(n, tout_seul=tout_seul)
    except Exception as e:
        dire(f"Erreur : {e}")
        if tout_seul:
            prevenir("Robot YouTube", f"Le passage n'a pas marché : {e}"[:250])
        return 1


if __name__ == "__main__":
    sys.exit(main())
