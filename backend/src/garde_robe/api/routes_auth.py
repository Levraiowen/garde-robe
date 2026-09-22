"""Comptes : inscription, connexion, profil, suppression."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import Utilisateur, get_db
from .schemas import ConnexionIn, InscriptionIn, SessionOut, UtilisateurOut
from .securite import (
    creer_token,
    hasher_mot_de_passe,
    utilisateur_courant,
    verifier_mot_de_passe,
)

router = APIRouter(prefix="/auth", tags=["comptes"])


def _session(utilisateur: Utilisateur) -> SessionOut:
    return SessionOut(
        token=creer_token(utilisateur.id),
        utilisateur=UtilisateurOut.model_validate(utilisateur),
    )


@router.post("/inscription", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def inscription(donnees: InscriptionIn, db: Session = Depends(get_db)) -> SessionOut:
    email = donnees.email.lower()
    if db.scalar(select(Utilisateur).where(Utilisateur.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Un compte existe déjà avec cet email")
    if db.scalar(select(Utilisateur).where(Utilisateur.pseudo == donnees.pseudo)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ce pseudo est déjà pris")

    utilisateur = Utilisateur(
        email=email,
        pseudo=donnees.pseudo,
        mot_de_passe_hash=hasher_mot_de_passe(donnees.mot_de_passe),
    )
    db.add(utilisateur)
    db.commit()
    return _session(utilisateur)


@router.post("/connexion", response_model=SessionOut)
def connexion(donnees: ConnexionIn, db: Session = Depends(get_db)) -> SessionOut:
    utilisateur = db.scalar(select(Utilisateur).where(Utilisateur.email == donnees.email.lower()))
    if utilisateur is None or not verifier_mot_de_passe(
        donnees.mot_de_passe, utilisateur.mot_de_passe_hash
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email ou mot de passe incorrect")
    return _session(utilisateur)


@router.get("/moi", response_model=UtilisateurOut)
def moi(utilisateur: Utilisateur = Depends(utilisateur_courant)) -> Utilisateur:
    return utilisateur


@router.delete("/moi", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_compte(
    utilisateur: Utilisateur = Depends(utilisateur_courant), db: Session = Depends(get_db)
) -> None:
    db.delete(utilisateur)
    db.commit()
