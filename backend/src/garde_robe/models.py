"""Modèles de données : vêtements, garde-robe et tenues."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from enum import StrEnum
from pathlib import Path


class Categorie(StrEnum):
    HAUT = "haut"
    BAS = "bas"
    ROBE = "robe"  # pièce unique : remplace haut + bas
    VESTE = "veste"
    CHAUSSURES = "chaussures"
    ACCESSOIRE = "accessoire"


class Saison(StrEnum):
    PRINTEMPS = "printemps"
    ETE = "ete"
    AUTOMNE = "automne"
    HIVER = "hiver"


TOUTES_SAISONS = list(Saison)


@dataclass
class Vetement:
    id: str
    nom: str
    categorie: Categorie
    couleur: str
    styles: list[str] = field(default_factory=list)
    saisons: list[Saison] = field(default_factory=lambda: list(TOUTES_SAISONS))
    formalite: int = 2  # 1 = très décontracté … 5 = très habillé
    marque: str | None = None
    image: str | None = None  # chemin local ou URL de la photo

    @classmethod
    def from_dict(cls, d: dict) -> Vetement:
        return cls(
            id=d["id"],
            nom=d["nom"],
            categorie=Categorie(d["categorie"]),
            couleur=d["couleur"].lower(),
            styles=[s.lower() for s in d.get("styles", [])],
            saisons=[Saison(s) for s in d.get("saisons", [s.value for s in TOUTES_SAISONS])],
            formalite=int(d.get("formalite", 2)),
            marque=d.get("marque"),
            image=d.get("image"),
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "nom": self.nom,
            "categorie": self.categorie.value,
            "couleur": self.couleur,
            "styles": self.styles,
            "saisons": [s.value for s in self.saisons],
            "formalite": self.formalite,
            "marque": self.marque,
            "image": self.image,
        }


@dataclass
class Tenue:
    pieces: list[Vetement]
    score: float
    raisons: list[str] = field(default_factory=list)

    def __str__(self) -> str:
        noms = " + ".join(p.nom for p in self.pieces)
        return f"[{self.score:.2f}] {noms}"


class GardeRobe:
    """Collection de vêtements, persistée en JSON."""

    def __init__(self, vetements: list[Vetement] | None = None):
        self.vetements: list[Vetement] = list(vetements or [])

    def ajouter(self, vetement: Vetement) -> None:
        if any(v.id == vetement.id for v in self.vetements):
            raise ValueError(f"Un vêtement avec l'id '{vetement.id}' existe déjà")
        self.vetements.append(vetement)

    def retirer(self, vetement_id: str) -> None:
        self.vetements = [v for v in self.vetements if v.id != vetement_id]

    def par_categorie(self, categorie: Categorie, saison: Saison | None = None) -> list[Vetement]:
        return [
            v
            for v in self.vetements
            if v.categorie == categorie and (saison is None or saison in v.saisons)
        ]

    @classmethod
    def charger(cls, chemin: str | Path) -> GardeRobe:
        data = json.loads(Path(chemin).read_text(encoding="utf-8"))
        return cls([Vetement.from_dict(d) for d in data["vetements"]])

    def sauvegarder(self, chemin: str | Path) -> None:
        data = {"vetements": [v.to_dict() for v in self.vetements]}
        Path(chemin).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def __len__(self) -> int:
        return len(self.vetements)
