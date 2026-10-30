"""Les voix off et deux bruitages des vidéos d'Halloween, générés le 2026-10-21 avec Flora (le connecteur du
propriétaire : ElevenLabs v3, voix « George », un conteur britannique grave ; bruitages ElevenLabs Sound Effects).
Les fichiers sont copiés dans videos/carte/halloween/public/voix (pas dans git) ; ce script les retélécharge depuis Flora.
Le texte de chaque réplique est noté pour mémoire (les balises [mysteriously], [whispers] dirigent la voix).
Le conteur prend son temps (des pauses d'une seconde) : chaque réplique est resserrée dans voix/court/<nom>.wav, ses
silences ramenés à 0,25 s et son débit accéléré de 10 % (atempo : la hauteur de la voix ne change pas).
    python outils/video/halloween/voix.py
"""
import shutil
import subprocess
import urllib.request
from pathlib import Path

DOSSIER = Path(__file__).resolve().parents[3] / 'videos' / 'carte' / 'halloween' / 'public' / 'voix'
B = 'https://media.flora.ai/node-inputs/2026/10/20/'
# nom : (adresse du fichier chez Flora, texte)
VOIX = {
    'hantes-accroche': (B + 'anonymous/a353a67d-87c7-4ac2-9ad4-4e6ea9319bc2.mp3', "[mysteriously] Japan's most haunted places... [whispers] don't go there at night."),
    'hantes-nagoro': (B + 'anonymous/4b785027-2ed6-417b-906d-58601a2ea9e2.mp3', '[mysteriously] Nagoro. Here, the dolls outnumber the living.'),
    'hantes-osorezan': (B + 'anonymous/53c373fc-e88f-409c-91c3-3cf7c42850b9.mp3', '[mysteriously] Mount Osore... said to be the gate to the afterlife.'),
    'hantes-enfer': (B + 'anonymous/c9cfc0a7-23dd-4751-a73d-d6c272632081.mp3', '[mysteriously] Hell Valley. It boils... day and night.'),
    'hantes-himeji': (B + 'anonymous/6a4ee9a6-05c8-4f40-b3b7-13ffacc3e5d6.mp3', '[mysteriously] Himeji Castle... where a ghost still counts the plates.'),
    'hantes-fin': (B + 'anonymous/5941647b-050f-4196-aa92-2f76e9f454c2.mp3', "They're all on my map... [whispers] find them, if you dare."),
    'defile-accroche': (B + 'anonymous/5f4eefa5-1164-4435-beb7-3f43fc55682e.mp3', '[mysteriously] Every night until Halloween... this walks across my map.'),
    'defile-titre': (B + 'anonymous/9d1a67b6-2c05-4d78-b646-87d5da8e3362.mp3', 'The Night Parade of a Hundred Demons.'),
    'defile-legende': (B + 'anonymous/343c81fc-72d8-4a85-93a8-2aa6e07eadd4.mp3', '[mysteriously] Legend says... they marched through old Kyoto.'),
    'defile-fin': (B + 'anonymous/e8333e12-b5b0-44e1-a0ef-346f2c37d176.mp3', 'Summon them yourself... on my map.'),
    'tonnerre': (B + 'px7fsq65yzz1brtqt0dbcj4s6s8gny2h/gen-m174q227v4ny3jnwz078cnrg618gnwd1-0.mp3', 'A single loud cinematic thunder crack with a short rumble, horror movie, close lightning strike'),
    'vent': (B + 'px7fsq65yzz1brtqt0dbcj4s6s8gny2h/gen-m17316j2e3nn7p7gchebeddk818gmtk4-0.mp3', 'Eerie night ambience: low howling wind, faint distant ghostly whispers, creaking wood, horror atmosphere, no music'),
}


def main():
    DOSSIER.mkdir(parents=True, exist_ok=True)
    for nom, (adresse, _texte) in VOIX.items():
        f = DOSSIER / f'{nom}.mp3'
        if adresse and not f.exists():
            urllib.request.urlretrieve(adresse, f)
            print('voix :', nom)
        if nom == 'tonnerre' and f.exists():
            shutil.copy2(f, DOSSIER.parent / 'sfx' / 'tonnerre.mp3')  # un bruitage comme les autres
        court = DOSSIER / 'court' / f'{nom}.wav'
        if f.exists() and not court.exists() and nom.split('-')[0] in ('hantes', 'defile'):
            court.parent.mkdir(exist_ok=True)
            ff = shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()
            subprocess.run([ff, '-loglevel', 'error', '-y', '-i', str(f), '-af',
                            'silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_duration=0.25:'
                            'stop_threshold=-42dB:stop_silence=0.25,atempo=1.1', str(court)], check=True)


if __name__ == '__main__':
    main()
