"""Harmonie des couleurs entre deux pièces.

Approche volontairement simple pour le MVP : les neutres vont avec tout,
le reste est placé sur un cercle chromatique (teinte en degrés).
"""

from __future__ import annotations

NEUTRES = {
    "noir",
    "blanc",
    "gris",
    "beige",
    "creme",
    "ecru",
    "marine",
    "denim",
    "camel",
    "marron",
    "kaki",
    "taupe",
}

TEINTES = {
    "rouge": 0,
    "bordeaux": 345,
    "rose": 330,
    "orange": 30,
    "moutarde": 45,
    "jaune": 60,
    "vert": 120,
    "turquoise": 175,
    "bleu": 220,
    "violet": 280,
}


def est_neutre(couleur: str) -> bool:
    return couleur.lower() in NEUTRES


def score_paire(c1: str, c2: str) -> float:
    """Score d'harmonie entre 0 et 1 pour deux couleurs."""
    c1, c2 = c1.lower(), c2.lower()
    if est_neutre(c1) or est_neutre(c2):
        return 1.0
    if c1 == c2:
        return 0.8  # monochrome
    if c1 not in TEINTES or c2 not in TEINTES:
        return 0.5  # couleur inconnue : neutre par défaut
    ecart = abs(TEINTES[c1] - TEINTES[c2]) % 360
    ecart = min(ecart, 360 - ecart)
    if ecart <= 40:
        return 0.85  # analogues
    if 150 <= ecart <= 210:
        return 0.75  # complémentaires
    return 0.4


def score_palette(couleurs: list[str]) -> float:
    """Moyenne des scores de toutes les paires de la tenue."""
    paires = [score_paire(a, b) for i, a in enumerate(couleurs) for b in couleurs[i + 1 :]]
    return sum(paires) / len(paires) if paires else 1.0
