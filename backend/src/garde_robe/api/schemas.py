"""Schémas d'entrée / sortie de l'API (Pydantic)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from ..models import Categorie, Saison

# --- Comptes -----------------------------------------------------------------


class InscriptionIn(BaseModel):
    email: EmailStr
    pseudo: str = Field(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_.-]+$")
    mot_de_passe: str = Field(min_length=8, max_length=128)


class ConnexionIn(BaseModel):
    email: EmailStr
    mot_de_passe: str


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


class _VetementBase(BaseModel):
    @field_validator("couleur", "styles", check_fields=False)
    @classmethod
    def _minuscules(cls, v):
        if isinstance(v, list):
            return [s.strip().lower() for s in v if s.strip()]
        return v.strip().lower() if isinstance(v, str) else v


class VetementIn(_VetementBase):
    nom: str = Field(min_length=1, max_length=100)
    categorie: Categorie
    couleur: str = Field(min_length=1, max_length=30)
    styles: list[str] = Field(default_factory=list, max_length=10)
    saisons: list[Saison] = Field(default_factory=lambda: list(Saison))
    formalite: int = Field(default=2, ge=1, le=5)
    marque: str | None = Field(default=None, max_length=60)
    image: str | None = Field(default=None, max_length=500)


class VetementMaj(_VetementBase):
    """Mise à jour partielle : seuls les champs fournis sont modifiés."""

    nom: str | None = Field(default=None, min_length=1, max_length=100)
    categorie: Categorie | None = None
    couleur: str | None = Field(default=None, min_length=1, max_length=30)
    styles: list[str] | None = Field(default=None, max_length=10)
    saisons: list[Saison] | None = None
    formalite: int | None = Field(default=None, ge=1, le=5)
    marque: str | None = Field(default=None, max_length=60)
    image: str | None = Field(default=None, max_length=500)


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


# --- Analyse -----------------------------------------------------------------


class TenueOut(BaseModel):
    score: float
    raisons: list[str]
    pieces: list[VetementOut]


class StyleOut(BaseModel):
    style: str
    part: float


class SuggestionOut(BaseModel):
    style: str
    categorie: Categorie
    requete: str
    raison: str
    liens: dict[str, str]
