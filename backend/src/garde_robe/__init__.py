"""Garde-robe virtuelle : inventaire de vêtements, génération de tenues et suggestions de style."""

from .models import Categorie, GardeRobe, Saison, Tenue, Vetement
from .recommandations import suggerer
from .styles import profil_style, styles_dominants
from .tenues import generer_tenues

__version__ = "0.2.0"

__all__ = [
    "Categorie",
    "GardeRobe",
    "Saison",
    "Tenue",
    "Vetement",
    "generer_tenues",
    "profil_style",
    "styles_dominants",
    "suggerer",
]
