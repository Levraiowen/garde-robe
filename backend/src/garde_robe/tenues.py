"""Moteur de génération de tenues ("combos").

On énumère les combinaisons valides (haut + bas + chaussures, ou robe +
chaussures, avec veste optionnelle), on les note, puis on garde les
meilleures en limitant la répétition d'une même pièce pour varier.
"""

from __future__ import annotations

from collections import Counter
from itertools import product

from .couleurs import score_palette
from .models import Categorie, GardeRobe, Saison, Tenue, Vetement

POIDS_COULEUR = 0.45
POIDS_STYLE = 0.35
POIDS_FORMALITE = 0.20
PENALITE_RECENTE = 0.04  # par pièce portée récemment


def _score_style(pieces: list[Vetement]) -> tuple[float, str | None]:
    """Part des pièces qui partagent le style le plus représenté."""
    compteur = Counter(s for p in pieces for s in set(p.styles))
    if not compteur:
        return 0.5, None
    style, nb = compteur.most_common(1)[0]
    return nb / len(pieces), style


def _score_formalite(pieces: list[Vetement]) -> float:
    niveaux = [p.formalite for p in pieces]
    ecart = max(niveaux) - min(niveaux)
    return max(0.0, 1 - ecart / 4)


def noter(pieces: list[Vetement]) -> Tenue:
    s_couleur = score_palette([p.couleur for p in pieces])
    s_style, style = _score_style(pieces)
    s_formalite = _score_formalite(pieces)
    score = POIDS_COULEUR * s_couleur + POIDS_STYLE * s_style + POIDS_FORMALITE * s_formalite

    raisons = [f"couleurs {s_couleur:.0%}", f"formalité {s_formalite:.0%}"]
    if style:
        raisons.insert(1, f"style « {style} » {s_style:.0%}")
    return Tenue(pieces=pieces, score=round(score, 3), raisons=raisons)


def _bases(gr: GardeRobe, saison: Saison | None) -> list[list[Vetement]]:
    hauts = gr.par_categorie(Categorie.HAUT, saison)
    bas = gr.par_categorie(Categorie.BAS, saison)
    robes = gr.par_categorie(Categorie.ROBE, saison)
    chaussures = gr.par_categorie(Categorie.CHAUSSURES, saison)

    bases = [[h, b, c] for h, b, c in product(hauts, bas, chaussures)]
    bases += [[r, c] for r, c in product(robes, chaussures)]
    return bases


def generer_tenues(
    gr: GardeRobe,
    saison: Saison | None = None,
    formalite: int | None = None,
    nombre: int = 10,
    max_repetitions: int = 3,
    recents: set[str] | None = None,
) -> list[Tenue]:
    """Retourne les `nombre` meilleures tenues possibles.

    - `saison` : ne garde que les pièces portables à cette saison.
    - `formalite` : cible (1-5), tolérance de ±1 sur la moyenne de la tenue.
    - `max_repetitions` : nb max d'apparitions d'une même pièce dans le résultat.
    - `recents` : ids des pièces portées récemment, légèrement pénalisées pour varier.
    """
    recents = recents or set()
    vestes: list[Vetement | None] = [None, *gr.par_categorie(Categorie.VESTE, saison)]

    candidates = []
    for base, veste in product(_bases(gr, saison), vestes):
        pieces = base + ([veste] if veste else [])
        if formalite is not None:
            moyenne = sum(p.formalite for p in pieces) / len(pieces)
            if abs(moyenne - formalite) > 1:
                continue
        tenue = noter(pieces)
        deja_portees = sum(p.id in recents for p in pieces)
        if deja_portees:
            tenue.score = round(tenue.score - PENALITE_RECENTE * deja_portees, 3)
            tenue.raisons.append(
                "déjà portée récemment"
                if deja_portees == len(pieces)
                else f"{deja_portees} pièce(s) portée(s) récemment"
            )
        candidates.append(tenue)

    candidates.sort(key=lambda t: t.score, reverse=True)

    resultat: list[Tenue] = []
    utilisations: Counter[str] = Counter()
    bases_vues: set[frozenset[str]] = set()
    for tenue in candidates:
        # Même tenue avec / sans veste : on ne garde que la mieux notée.
        base = frozenset(p.id for p in tenue.pieces if p.categorie != Categorie.VESTE)
        if base in bases_vues:
            continue
        if any(utilisations[p.id] >= max_repetitions for p in tenue.pieces):
            continue
        resultat.append(tenue)
        bases_vues.add(base)
        utilisations.update(p.id for p in tenue.pieces)
        if len(resultat) >= nombre:
            break
    return resultat
