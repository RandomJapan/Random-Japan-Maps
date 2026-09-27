"""Fabrique les images du site à partir des deux versions du logo.

Pour changer de logo : remplace les fichiers de outils/logo-source/
(même nom), puis lance :  python outils/preparer_logo.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

ICI = Path(__file__).parent
SOURCES = ICI / "logo-source"
IMG = ICI.parent / "site" / "img"


def rond(image, taille):
    """Image carrée découpée en rond, coins transparents (lissés)."""
    grand = taille * 4
    masque = Image.new("L", (grand, grand), 0)
    ImageDraw.Draw(masque).ellipse((0, 0, grand - 1, grand - 1), fill=255)
    sortie = image.resize((taille, taille), Image.LANCZOS).convert("RGBA")
    sortie.putalpha(masque.resize((taille, taille), Image.LANCZOS))
    return sortie


def recadrer(image, ratio):
    """Recadre au centre pour obtenir le rapport largeur/hauteur voulu."""
    l, h = image.size
    if l / h > ratio:
        nl = round(h * ratio)
        return image.crop(((l - nl) // 2, 0, (l - nl) // 2 + nl, h))
    nh = round(l / ratio)
    return image.crop((0, (h - nh) // 2, l, (h - nh) // 2 + nh))


def main():
    IMG.mkdir(parents=True, exist_ok=True)
    carre = Image.open(SOURCES / "logo-carre.jpg").convert("RGB")
    large = Image.open(SOURCES / "logo-large.jpg").convert("RGB")

    # Logo rond de l'en-tête et de l'écran de chargement
    carre.resize((256, 256), Image.LANCZOS).save(IMG / "logo.jpg", quality=86, optimize=True, progressive=True)
    # Icône de l'onglet du navigateur
    rond(carre, 64).save(IMG / "favicon.png", optimize=True)
    # Icône quand on ajoute le site à l'écran d'accueil du téléphone
    carre.resize((180, 180), Image.LANCZOS).save(IMG / "icone-180.png", optimize=True)
    # Aperçu quand on partage le lien (TikTok, Instagram, WhatsApp, Discord…)
    recadrer(large, 1200 / 630).resize((1200, 630), Image.LANCZOS).save(
        IMG / "partage.jpg", quality=84, optimize=True, progressive=True
    )

    for f in ("logo.jpg", "favicon.png", "icone-180.png", "partage.jpg"):
        print(f"{f}: {(IMG / f).stat().st_size // 1024} Ko")


if __name__ == "__main__":
    main()
