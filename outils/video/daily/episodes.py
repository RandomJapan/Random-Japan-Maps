"""Les épisodes de « Japan Daily » (2026-11-25) : une énigme par jour, numérotée, sur un lieu de la carte.

Pour un nouvel épisode : ajouter une ligne ici, puis
    python outils/video/daily/preparer.py 6
    python outils/video/daily/rushes.py 6
    python outils/video/daily/finir.py 6

Chaque épisode : le nom du lieu tel qu'il est dans le Sheet (« Nom (EN) »), son fichier dans les vidéos des lieux
(D:\\Vidéos\\Tik Tok\\Vidéo lieux random japon), l'énigme (la seconde où commence le plan de 3 s qui ouvre la vidéo, sans nom
écrit dessus) et le plus beau plan (sa seconde de début et sa durée dans la vidéo source : il est joué en 2,5 s, ralenti s'il
est plus court). « affiche » : le nom en capitales, coupé où il faut. « cadre » (facultatif) : (zoom, x, y) pour recadrer un
plan, par exemple pour sortir du cadre le cartouche du nom que les vidéos récentes ont en haut à gauche.

Les règles du choix (le marketing, 2026-11-25) : jamais le lieu du défi du jour en cours (ni ceux des jours où l'épisode
sera publié : le script de la session du 2026-11-25 les calculait avec lieuDuJour de defi.js), des lieux moins connus que
Kinkaku-ji d'abord, une région différente d'un jour à l'autre. Jamais Kumamon à l'image (Nagoro en a un dans sa classe).
Chaque plan tient entre deux coupes du montage du propriétaire (trouvées par ffmpeg, select='gt(scene,0.25)') : une
énigme qui commençait 0,1 s trop tôt montrait le plan d'avant à l'image 0 (la couverture), ou le titre écrit du lieu.
"""

EPISODES = {
    1: {'lieu': 'Okuoi Rainbow Bridge', 'affiche': 'OKUOI RAINBOW\nBRIDGE', 'fichier': 'Okuoi Rainbow Bridge.mp4',
        'enigme': 31.5, 'beau': (22.85, 1.85)},
    2: {'lieu': 'Okama Crater', 'affiche': 'OKAMA\nCRATER', 'fichier': 'Okama.mov',
        'enigme': 12.3, 'beau': (4.0, 2.5)},
    3: {'lieu': 'Keya no Oto', 'affiche': 'KEYA NO OTO', 'fichier': 'Keya no Ohto.mp4',
        'enigme': 18.75, 'beau': (7.75, 1.55)},
    4: {'lieu': 'Nagoro Scarecrow Village', 'affiche': 'NAGORO\nSCARECROW\nVILLAGE', 'fichier': 'Nagoro Scarecrow Village.mp4',
        'enigme': 13.0, 'beau': (35.0, 2.0)},
    5: {'lieu': 'Uradome Coast', 'affiche': 'URADOME\nCOAST', 'fichier': 'Uradome Coast.mp4',
        'enigme': 7.8, 'beau': (34.55, 2.45)},
}
