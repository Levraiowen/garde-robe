"""Accès aux données de l'utilisateur connecté, partagé par les routes."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Categorie, GardeRobe, Vetement
from . import config
from .db import PortDB, Utilisateur, VetementDB
from .schemas import VetementOut

# Ordre d'affichage des pièces dans une tenue (du haut vers le bas)
_ORDRE = {
    Categorie.VESTE: 0,
    Categorie.HAUT: 1,
    Categorie.ROBE: 1,
    Categorie.BAS: 2,
    Categorie.CHAUSSURES: 3,
    Categorie.ACCESSOIRE: 4,
}

StatsPorts = dict[str, tuple[int, datetime]]


def vetements_de(db: Session, utilisateur: Utilisateur) -> list[VetementDB]:
    requete = (
        select(VetementDB)
        .where(VetementDB.utilisateur_id == utilisateur.id)
        .order_by(VetementDB.cree_le.desc())
    )
    return list(db.scalars(requete))


def vetement_de(db: Session, utilisateur: Utilisateur, vetement_id: str) -> VetementDB:
    vetement = db.get(VetementDB, vetement_id)
    # 404 aussi si le vêtement appartient à quelqu'un d'autre : on ne révèle pas son existence
    if vetement is None or vetement.utilisateur_id != utilisateur.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vêtement introuvable")
    return vetement


def ports_de(db: Session, utilisateur: Utilisateur) -> list[PortDB]:
    requete = (
        select(PortDB)
        .where(PortDB.utilisateur_id == utilisateur.id)
        .order_by(PortDB.porte_le.desc())
    )
    return list(db.scalars(requete))


def statistiques_ports(ports: list[PortDB]) -> StatsPorts:
    """Pour chaque vêtement : (nombre de fois porté, dernière fois)."""
    stats: StatsPorts = {}
    for port in ports:  # du plus récent au plus ancien
        for vid in port.vetement_ids:
            nb, dernier = stats.get(vid, (0, port.porte_le))
            stats[vid] = (nb + 1, dernier)
    return stats


def vers_out(vetement: VetementDB, stats: StatsPorts | None = None) -> VetementOut:
    out = VetementOut.model_validate(vetement)
    if stats and vetement.id in stats:
        out.nb_ports, out.dernier_port = stats[vetement.id]
    return out


def pieces_out(
    ids: list[str], par_id: dict[str, VetementDB], stats: StatsPorts | None = None
) -> list[VetementOut]:
    """Pièces d'une tenue, dans l'ordre d'affichage ; ignore les vêtements supprimés."""
    pieces = [vers_out(par_id[i], stats) for i in ids if i in par_id]
    return sorted(pieces, key=lambda p: _ORDRE[p.categorie])


def garde_robe_moteur(lignes: list[VetementDB]) -> GardeRobe:
    """Convertit les lignes de la base en objets du moteur."""
    return GardeRobe(
        [Vetement.from_dict(VetementOut.model_validate(v).model_dump(mode="json")) for v in lignes]
    )


def verifier_ids(db: Session, utilisateur: Utilisateur, ids: list[str]) -> list[str]:
    if len(set(ids)) != len(ids):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Pièce en double")
    for vid in ids:
        vetement_de(db, utilisateur, vid)
    return ids


def supprimer_photo(chemin: str | None) -> None:
    """Supprime le fichier d'une photo (seulement dans le dossier des médias)."""
    if not chemin:
        return
    fichier = config.DOSSIER_MEDIAS / Path(chemin).name
    fichier.unlink(missing_ok=True)
