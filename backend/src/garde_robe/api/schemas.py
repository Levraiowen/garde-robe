"""Schémas d'entrée / sortie de l'API (Pydantic)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from ..models import Categorie, Saison

PSEUDO = Field(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_.-]+$")
MOT_DE_PASSE = Field(min_length=8, max_length=128)

# --- Comptes -----------------------------------------------------------------


class InscriptionIn(BaseModel):
    email: EmailStr
    pseudo: str = PSEUDO
    mot_de_passe: str = MOT_DE_PASSE


class ConnexionIn(BaseModel):
    email: EmailStr
    mot_de_passe: str = Field(max_length=128)


class ChangementMotDePasseIn(BaseModel):
    actuel: str = Field(max_length=128)
    nouveau: str = MOT_DE_PASSE


class UtilisateurOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    pseudo: str
    profil_public: bool
    cree_le: datetime


class SessionOut(BaseModel):
    token: str
    utilisateur: UtilisateurOut


# --- Vêtements ---------------------------------------------------------------


def _nettoyer_styles(styles: list[str] | None) -> list[str] | None:
    if styles is None:
        return None
    propres: list[str] = []
    for s in styles:
        s = s.strip().lower()
        if s and s not in propres:
            propres.append(s[:30])
    return propres


def _dedoublonner(saisons: list[Saison] | None) -> list[Saison] | None:
    return None if saisons is None else list(dict.fromkeys(saisons))


def _requis(v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError("ne peut pas être vide")
    return v


def _couleur(v: str) -> str:
    return _requis(v).lower()


def _facultatif(v: str | None) -> str | None:
    return (v.strip() or None) if v else None


class VetementIn(BaseModel):
    nom: str = Field(min_length=1, max_length=100)
    categorie: Categorie
    couleur: str = Field(min_length=1, max_length=30)
    styles: list[str] = Field(default_factory=list, max_length=10)
    saisons: list[Saison] = Field(default_factory=lambda: list(Saison), min_length=1)
    formalite: int = Field(default=2, ge=1, le=5)
    marque: str | None = Field(default=None, max_length=60)

    _styles = field_validator("styles")(_nettoyer_styles)
    _saisons = field_validator("saisons")(_dedoublonner)
    _nom = field_validator("nom")(_requis)
    _couleur = field_validator("couleur")(_couleur)
    _marque = field_validator("marque")(_facultatif)


class VetementMaj(BaseModel):
    """Mise à jour partielle : seuls les champs fournis sont modifiés."""

    nom: str | None = Field(default=None, min_length=1, max_length=100)
    categorie: Categorie | None = None
    couleur: str | None = Field(default=None, min_length=1, max_length=30)
    styles: list[str] | None = Field(default=None, max_length=10)
    saisons: list[Saison] | None = Field(default=None, min_length=1)
    formalite: int | None = Field(default=None, ge=1, le=5)
    marque: str | None = Field(default=None, max_length=60)

    _styles = field_validator("styles")(_nettoyer_styles)
    _saisons = field_validator("saisons")(_dedoublonner)
    _nom = field_validator("nom")(_requis)
    _couleur = field_validator("couleur")(_couleur)
    _marque = field_validator("marque")(_facultatif)

    @field_validator("nom", "categorie", "couleur", "styles", "saisons", "formalite", mode="before")
    @classmethod
    def _pas_de_null(cls, v):
        # null explicite interdit sur un champ obligatoire (seule la marque est effaçable)
        if v is None:
            raise ValueError("ne peut pas être vide")
        return v


class VetementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nom: str
    categorie: Categorie
    couleur: str
    styles: list[str]
    saisons: list[Saison]
    formalite: int
    marque: str | None
    image: str | None
    cree_le: datetime
    nb_ports: int = 0
    dernier_port: datetime | None = None


# --- Tenues ------------------------------------------------------------------


class TenueIn(BaseModel):
    vetement_ids: list[str] = Field(min_length=2, max_length=8)


class TenueOut(BaseModel):
    score: float
    raisons: list[str]
    pieces: list[VetementOut]
    favori_id: str | None = None


class FavoriOut(BaseModel):
    id: str
    cree_le: datetime
    pieces: list[VetementOut]


class PortOut(BaseModel):
    id: str
    porte_le: datetime
    pieces: list[VetementOut]


# --- Analyse -----------------------------------------------------------------


class StyleOut(BaseModel):
    style: str
    part: float


class SuggestionOut(BaseModel):
    style: str
    categorie: Categorie
    requete: str
    raison: str
    liens: dict[str, str]
