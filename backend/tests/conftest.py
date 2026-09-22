from pathlib import Path

import pytest

from garde_robe import GardeRobe

EXEMPLE = Path(__file__).parent.parent / "data" / "exemple_garde_robe.json"


@pytest.fixture
def garde_robe() -> GardeRobe:
    return GardeRobe.charger(EXEMPLE)
