"""Configuration lue depuis les variables d'environnement."""

from __future__ import annotations

import os
import warnings
from pathlib import Path

_CLE_DEV = "cle-de-dev-a-changer-en-production"

CLE_SECRETE = os.environ.get("GARDE_ROBE_SECRET", _CLE_DEV)
if CLE_SECRETE == _CLE_DEV:
    warnings.warn(
        "GARDE_ROBE_SECRET non défini : clé de dev utilisée (ne pas utiliser en production)",
        stacklevel=1,
    )

URL_BASE_DE_DONNEES = os.environ.get("GARDE_ROBE_DB", "sqlite:///./garde_robe.db")
DUREE_TOKEN_JOURS = int(os.environ.get("GARDE_ROBE_TOKEN_JOURS", "30"))
ALGORITHME_JWT = "HS256"

# Photos des vêtements
DOSSIER_MEDIAS = Path(os.environ.get("GARDE_ROBE_MEDIAS", "./medias")).resolve()
TAILLE_MAX_PHOTO = 8 * 1024 * 1024  # 8 Mo

# Une pièce portée il y a moins de N jours est légèrement pénalisée dans les tenues
JOURS_RECENTS = 3
