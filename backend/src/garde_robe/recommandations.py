"""Suggestions d'achats / d'inspiration à partir des styles dominants.

MVP : on détecte les catégories qui manquent pour chaque style dominant et
on génère des liens de recherche. L'intégration de vraies sources (API
marchandes, scraping, IA de vision) viendra plus tard — voir docs/ROADMAP.md.
"""

from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import quote_plus

from .models import Categorie, GardeRobe
from .styles import styles_dominants

CATEGORIES_ESSENTIELLES = [Categorie.HAUT, Categorie.BAS, Categorie.VESTE, Categorie.CHAUSSURES]

MANQUE = {
    Categorie.HAUT: "Aucun haut",
    Categorie.BAS: "Aucun bas",
    Categorie.VESTE: "Aucune veste",
    Categorie.CHAUSSURES: "Aucune paire de chaussures",
}
RECHERCHE = {
    Categorie.HAUT: "haut",
    Categorie.BAS: "pantalon",
    Categorie.VESTE: "veste",
    Categorie.CHAUSSURES: "chaussures",
}

MOTEURS = {
    "Google Shopping": "https://www.google.com/search?tbm=shop&q={q}",
    "Vinted": "https://www.vinted.fr/catalog?search_text={q}",
    "Pinterest": "https://www.pinterest.fr/search/pins/?q={q}",
}


@dataclass
class Suggestion:
    style: str
    categorie: Categorie
    requete: str
    liens: dict[str, str]
    raison: str


def _liens(requete: str) -> dict[str, str]:
    q = quote_plus(requete)
    return {nom: url.format(q=q) for nom, url in MOTEURS.items()}


def suggerer(gr: GardeRobe, nb_styles: int = 3) -> list[Suggestion]:
    suggestions = []
    for style in styles_dominants(gr, nb_styles):
        pieces_du_style = [v for v in gr.vetements if style in v.styles]
        categories_presentes = {v.categorie for v in pieces_du_style}
        for cat in CATEGORIES_ESSENTIELLES:
            if cat in categories_presentes:
                continue
            requete = f"{RECHERCHE[cat]} {style}"
            suggestions.append(
                Suggestion(
                    style=style,
                    categorie=cat,
                    requete=requete,
                    liens=_liens(requete),
                    raison=f"{MANQUE[cat]} {style} dans ta garde-robe",
                )
            )
    return suggestions
