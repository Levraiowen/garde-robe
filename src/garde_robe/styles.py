"""Analyse des styles dominants de la garde-robe."""

from __future__ import annotations

from collections import Counter

from .models import GardeRobe


def profil_style(gr: GardeRobe) -> list[tuple[str, float]]:
    """Répartition des styles (part de chaque style, triée décroissante).

    Chaque vêtement répartit un poids de 1 entre ses styles, pour qu'une
    pièce très taguée ne pèse pas plus qu'une autre.
    """
    poids: Counter[str] = Counter()
    for v in gr.vetements:
        if not v.styles:
            continue
        part = 1 / len(v.styles)
        for s in v.styles:
            poids[s] += part

    total = sum(poids.values())
    if not total:
        return []
    return [(s, round(p / total, 3)) for s, p in poids.most_common()]


def styles_dominants(gr: GardeRobe, n: int = 3) -> list[str]:
    return [s for s, _ in profil_style(gr)[:n]]
