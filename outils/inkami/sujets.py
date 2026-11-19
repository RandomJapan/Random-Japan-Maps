# -*- coding: utf-8 -*-
"""Écrit sujets.json (à côté de ce fichier) : les personnages du jeu à peindre, pour capture.py — où est chacun dans la scène (une expression JS),
comment le cadrer. python outils/inkami/sujets.py"""
import json, io, pathlib

def passant(i):
    return f"M.passants.find((p) => p.id === '{i}').perso.objet"

def arreter(i):
    # (comme quand on lui parle : il s'arrête)
    return f"(() => {{ const p = balade.monde().passants.find((q) => q.id === '{i}'); p.quand = null; p.etat.parle = true; }})()"

CHAMEAU = "M.lieu.animes.map((a) => a.objet).find((o) => o && o.children.length === 4).children[0]"

def P(id, lieu, qui, **k):
    return {"id": id, "lieu": lieu, "objet": passant(qui), "avant": arreter(qui), "attente": 1200, "haut": 0.66, "angle": 0.4, "marge": 1.3, **k}

def C(id, lieu, espece, **k):
    return {"id": id, "lieu": lieu, "compagnon": espece, "objet": "M.kon.objet", "haut": 1.0, "angle": 0.5, "marge": 1.25, "avant": "1", "attente": 4000, "pause": 220, **k}

S = [
    {"id": "shika", "lieu": "itsukushima", "objet": "M.daims.find((d) => d.male).b.objet", "haut": 1.0, "angle": 0.8, "marge": 1.32, "kl": 0.3, "devant": 0.42, "dy": 0.36, "rafale": 5},
    P("campeur", "aogashima", "campeur"),
    P("kokiriko", "gokayama", "danseur"),
    C("pon", "gokayama", "pon"),
    P("samourai", "himeji", "samourai"),
    {"id": "voyageur", "lieu": "himeji", "perso": "garcon", "stockage": {"baladeAchats": '["armure"]', "baladeTenue": '{"garcon":{"tete":"kabuto","habit":"armure"}}'}, "objet": "M.joueur.objet", "haut": 0.7, "angle": 0.4, "marge": 1.25},
    {"id": "voyageuse", "lieu": "himeji", "perso": "fille", "stockage": {"baladeAchats": '["kimonoOr"]', "baladeTenue": '{"fille":{"habit":"kimonoOr"}}'}, "objet": "M.joueur.objet", "haut": 0.7, "angle": 0.4, "marge": 1.25},
    P("uzume", "takachiho", "uzume"),
    C("chapu", "takachiho", "chapu"),
    P("kimono", "kinkakuji", "kimono"),
    P("chajin", "kinkakuji", "chajin"),
    P("tamago", "beppu", "tamago"),
    {"id": "bunbuku", "lieu": "beppu", "objet": "M.marchand.perso.objet", "haut": 0.8, "angle": 0.4, "marge": 1.2},
    C("kon", "motonosumi", "kon", marge=1.08),
    P("yamabushi", "sanjubutsu", "yamabushi"),
    P("miko", "udo", "miko"),
    C("fuwa", "udo", "fuwa", marge=1.0, kl=0.62),
    C("saya", "yakushima", "saya"),
    {"id": "rakuda", "lieu": "tottori", "objet": CHAMEAU, "haut": 0.62, "angle": 0.85, "marge": 1.42, "kl": 0.54, "devant": 0.5, "avant": "(() => { const e = balade.etat; e.x = 181; e.z = 26; })()", "attente": 1500},
    P("junrei", "tsubosaka", "pelerin"),
    C("gao", "tsubosaka", "gao"),
]
json.dump(S, io.open(pathlib.Path(__file__).resolve().parent / 'sujets.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(S), 'sujets')
