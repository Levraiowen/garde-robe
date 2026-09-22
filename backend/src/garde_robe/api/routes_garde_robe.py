"""Garde-robe de l'utilisateur connecté : vêtements, tenues, styles, suggestions."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import GardeRobe, Saison, Vetement
from ..recommandations import suggerer
from ..styles import profil_style
from ..tenues import generer_tenues
from .db import Utilisateur, VetementDB, get_db
from .schemas import StyleOut, SuggestionOut, TenueOut, VetementIn, VetementMaj, VetementOut
from .securite import utilisateur_courant

router = APIRouter(tags=["garde-robe"])


def _vetements(db: Session, utilisateur: Utilisateur) -> list[VetementDB]:
    requete = (
        select(VetementDB)
        .where(VetementDB.utilisateur_id == utilisateur.id)
        .order_by(VetementDB.cree_le.desc())
    )
    return list(db.scalars(requete))


def _vetement(db: Session, utilisateur: Utilisateur, vetement_id: str) -> VetementDB:
    vetement = db.get(VetementDB, vetement_id)
    # 404 aussi si le vêtement appartient à quelqu'un d'autre : on ne révèle pas son existence
    if vetement is None or vetement.utilisateur_id != utilisateur.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vêtement introuvable")
    return vetement


def _garde_robe(lignes: list[VetementDB]) -> GardeRobe:
    """Convertit les lignes de la base en objets du moteur."""
    return GardeRobe(
        [Vetement.from_dict(VetementOut.model_validate(v).model_dump(mode="json")) for v in lignes]
    )


# --- Vêtements ---------------------------------------------------------------


@router.get("/vetements", response_model=list[VetementOut])
def lister(
    utilisateur: Utilisateur = Depends(utilisateur_courant), db: Session = Depends(get_db)
) -> list[VetementDB]:
    return _vetements(db, utilisateur)


@router.post("/vetements", response_model=VetementOut, status_code=status.HTTP_201_CREATED)
def ajouter(
    donnees: VetementIn,
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> VetementDB:
    vetement = VetementDB(utilisateur_id=utilisateur.id, **donnees.model_dump(mode="json"))
    db.add(vetement)
    db.commit()
    return vetement


@router.get("/vetements/{vetement_id}", response_model=VetementOut)
def detail(
    vetement_id: str,
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> VetementDB:
    return _vetement(db, utilisateur, vetement_id)


@router.patch("/vetements/{vetement_id}", response_model=VetementOut)
def modifier(
    vetement_id: str,
    donnees: VetementMaj,
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> VetementDB:
    vetement = _vetement(db, utilisateur, vetement_id)
    for champ, valeur in donnees.model_dump(mode="json", exclude_unset=True).items():
        setattr(vetement, champ, valeur)
    db.commit()
    return vetement


@router.delete("/vetements/{vetement_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer(
    vetement_id: str,
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> None:
    db.delete(_vetement(db, utilisateur, vetement_id))
    db.commit()


# --- Analyse -----------------------------------------------------------------


@router.get("/tenues", response_model=list[TenueOut])
def tenues(
    saison: Saison | None = None,
    formalite: int | None = Query(default=None, ge=1, le=5),
    nombre: int = Query(default=10, ge=1, le=50),
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> list[TenueOut]:
    lignes = _vetements(db, utilisateur)
    par_id = {v.id: v for v in lignes}
    return [
        TenueOut(
            score=t.score,
            raisons=t.raisons,
            pieces=[VetementOut.model_validate(par_id[p.id]) for p in t.pieces],
        )
        for t in generer_tenues(_garde_robe(lignes), saison, formalite, nombre)
    ]


@router.get("/styles", response_model=list[StyleOut])
def styles(
    utilisateur: Utilisateur = Depends(utilisateur_courant), db: Session = Depends(get_db)
) -> list[StyleOut]:
    profil = profil_style(_garde_robe(_vetements(db, utilisateur)))
    return [StyleOut(style=s, part=p) for s, p in profil]


@router.get("/suggestions", response_model=list[SuggestionOut])
def suggestions(
    utilisateur: Utilisateur = Depends(utilisateur_courant), db: Session = Depends(get_db)
) -> list[SuggestionOut]:
    return [
        SuggestionOut(
            style=s.style, categorie=s.categorie, requete=s.requete, raison=s.raison, liens=s.liens
        )
        for s in suggerer(_garde_robe(_vetements(db, utilisateur)))
    ]
