"""Vêtements de l'utilisateur connecté (et leurs photos)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import config
from .db import FavoriDB, Utilisateur, VetementDB, get_db
from .depot import (
    ports_de,
    statistiques_ports,
    supprimer_photo,
    vers_out,
    vetement_de,
    vetements_de,
)
from .schemas import VetementIn, VetementMaj, VetementOut
from .securite import utilisateur_courant

router = APIRouter(prefix="/vetements", tags=["vêtements"])


@router.get("", response_model=list[VetementOut])
def lister(
    utilisateur: Utilisateur = Depends(utilisateur_courant), db: Session = Depends(get_db)
) -> list[VetementOut]:
    stats = statistiques_ports(ports_de(db, utilisateur))
    return [vers_out(v, stats) for v in vetements_de(db, utilisateur)]


@router.post("", response_model=VetementOut, status_code=status.HTTP_201_CREATED)
def ajouter(
    donnees: VetementIn,
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> VetementOut:
    vetement = VetementDB(utilisateur_id=utilisateur.id, **donnees.model_dump(mode="json"))
    db.add(vetement)
    db.commit()
    return vers_out(vetement)


@router.get("/{vetement_id}", response_model=VetementOut)
def detail(
    vetement_id: str,
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> VetementOut:
    vetement = vetement_de(db, utilisateur, vetement_id)
    return vers_out(vetement, statistiques_ports(ports_de(db, utilisateur)))


@router.patch("/{vetement_id}", response_model=VetementOut)
def modifier(
    vetement_id: str,
    donnees: VetementMaj,
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> VetementOut:
    vetement = vetement_de(db, utilisateur, vetement_id)
    for champ, valeur in donnees.model_dump(mode="json", exclude_unset=True).items():
        setattr(vetement, champ, valeur)
    db.commit()
    return vers_out(vetement, statistiques_ports(ports_de(db, utilisateur)))


@router.delete("/{vetement_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer(
    vetement_id: str,
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> None:
    vetement = vetement_de(db, utilisateur, vetement_id)
    # Une tenue favorite sans cette pièce n'a plus de sens : on la retire.
    favoris = db.scalars(select(FavoriDB).where(FavoriDB.utilisateur_id == utilisateur.id))
    for favori in favoris:
        if vetement_id in favori.vetement_ids:
            db.delete(favori)
    supprimer_photo(vetement.image)
    db.delete(vetement)
    db.commit()


# --- Photo -------------------------------------------------------------------


def _extension(contenu: bytes) -> str | None:
    """Type réel du fichier d'après sa signature (on ne se fie pas au nom ni au type déclaré)."""
    if contenu.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if contenu.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if contenu[:4] == b"RIFF" and contenu[8:12] == b"WEBP":
        return ".webp"
    return None


@router.put("/{vetement_id}/photo", response_model=VetementOut)
def definir_photo(
    vetement_id: str,
    fichier: UploadFile = File(...),
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> VetementOut:
    vetement = vetement_de(db, utilisateur, vetement_id)
    contenu = fichier.file.read(config.TAILLE_MAX_PHOTO + 1)
    if len(contenu) > config.TAILLE_MAX_PHOTO:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Photo trop lourde (8 Mo max)"
        )
    extension = _extension(contenu)
    if extension is None:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Format non pris en charge (JPEG, PNG ou WebP)"
        )

    config.DOSSIER_MEDIAS.mkdir(parents=True, exist_ok=True)
    nom = f"{uuid.uuid4().hex}{extension}"
    (config.DOSSIER_MEDIAS / nom).write_bytes(contenu)
    ancienne = vetement.image
    vetement.image = f"/medias/{nom}"
    db.commit()
    supprimer_photo(ancienne)
    return vers_out(vetement, statistiques_ports(ports_de(db, utilisateur)))


@router.delete("/{vetement_id}/photo", response_model=VetementOut)
def retirer_photo(
    vetement_id: str,
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> VetementOut:
    vetement = vetement_de(db, utilisateur, vetement_id)
    supprimer_photo(vetement.image)
    vetement.image = None
    db.commit()
    return vers_out(vetement, statistiques_ports(ports_de(db, utilisateur)))
