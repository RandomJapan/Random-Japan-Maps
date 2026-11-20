# -*- coding: utf-8 -*-
"""Écrit sujets.json (à côté de ce fichier) : les personnages du jeu à peindre, pour capture.py — où est chacun dans la scène (une expression JS),
comment le cadrer. python outils/inkami/sujets.py"""
import json, io, pathlib

def passant(i):
    return f"M.passants.find((p) => p.id === '{i}').perso.objet"

def arreter(i):
    # (comme quand on lui parle : il s'arrête)
    return f"(() => {{ const p = balade.monde().passants.find((q) => q.id === '{i}'); p.quand = null; p.etat.parle = true; }})()"

def pres(i):
    # (il s'arrête, et le voyageur est posé à trois pas : à Tsubosaka, un passant loin du voyageur n'est pas dessiné — sa photo était vide)
    return f"(() => {{ const p = balade.monde().passants.find((q) => q.id === '{i}'); p.quand = null; p.etat.parle = true; const e = balade.etat; e.x = p.etat.x + 3; e.z = p.etat.z + 3; e.y = balade.monde().lieu.monde.hauteur(e.x, e.z); }})()"

def P(id, lieu, qui, **k):
    return {"id": id, "lieu": lieu, "objet": passant(qui), "avant": arreter(qui), "attente": 1200, "haut": 0.66, "angle": 0.4, "marge": 1.3, **k}

# Des humains seulement (le propriétaire, 2026-11-19 : « ne mets pas d'animaux parce qu'on ne peut pas avoir d'animaux sur les tableaux qu'on
# vend […] Il faut que ce soit absolument des humains ») : ni bête, ni compagnon, ni esprit, ni Bunbuku. (Les neuf premiers de ce genre —
# le cerf, Pon, Chapu, Bunbuku, Kon, Fuwa, Saya, le chameau, Gao — ont été remplacés le jour même.)
S = [
    P("kannushi", "itsukushima", "pretre"),
    P("campeur", "aogashima", "campeur"),
    P("kokiriko", "gokayama", "danseur"),
    P("paysan", "gokayama", "paysan"),
    P("samourai", "himeji", "samourai"),
    {"id": "voyageur", "lieu": "himeji", "perso": "garcon", "stockage": {"baladeAchats": '["armure"]', "baladeTenue": '{"garcon":{"tete":"kabuto","habit":"armure"}}'}, "objet": "M.joueur.objet", "haut": 0.7, "angle": 0.4, "marge": 1.25},
    {"id": "voyageuse", "lieu": "himeji", "perso": "fille", "stockage": {"baladeAchats": '["kimonoOr"]', "baladeTenue": '{"fille":{"habit":"kimonoOr"}}'}, "objet": "M.joueur.objet", "haut": 0.7, "angle": 0.4, "marge": 1.25},
    P("uzume", "takachiho", "uzume"),
    P("somen", "takachiho", "chiho"),
    P("kimono", "kinkakuji", "kimono"),
    P("chajin", "kinkakuji", "chajin"),
    P("tamago", "beppu", "tamago"),
    P("yukata", "beppu", "yukata"),
    # (le pêcheur : cadré sur son corps — sa canne et sa ligne faisaient une boîte de plusieurs mètres, et lui tout petit dedans)
    P("pecheur", "motonosumi", "pecheur", corps={"h": 1.42, "l": 0.9}),
    P("yamabushi", "sanjubutsu", "yamabushi"),
    P("miko", "udo", "miko"),
    P("batelier", "udo", "batelier"),
    P("guide", "yakushima", "guideJomon"),
    P("chamelier", "tottori", "chamelier", avant=pres("chamelier"), attente=2200),
    P("junrei", "tsubosaka", "pelerin"),
    P("jardinier", "tsubosaka", "jardinier", avant=pres("jardinier"), attente=2200),
    # (Iiyama, 2026-11-20 : la sculptrice de neige, son bonnet à pompon ; l'ancien du village des kamakura, sa chapka)
    P("yukizo", "iiyama", "sculptrice", avant=pres("sculptrice"), attente=2200),
    P("kamakura", "iiyama", "ancien", avant=pres("ancien"), attente=2200),
]
json.dump(S, io.open(pathlib.Path(__file__).resolve().parent / 'sujets.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(S), 'sujets')
