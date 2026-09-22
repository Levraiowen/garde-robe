import os
import tempfile
from pathlib import Path

# Avant tout import de l'API : photos dans un dossier temporaire, pas d'avertissement de clé.
os.environ.setdefault("GARDE_ROBE_MEDIAS", tempfile.mkdtemp(prefix="garde-robe-medias-"))
os.environ.setdefault("GARDE_ROBE_SECRET", "cle-de-test")

import pytest  # noqa: E402

from garde_robe import GardeRobe  # noqa: E402

EXEMPLE = Path(__file__).parent.parent / "data" / "exemple_garde_robe.json"


@pytest.fixture
def garde_robe() -> GardeRobe:
    return GardeRobe.charger(EXEMPLE)
