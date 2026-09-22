"""Tenues : suggestions, favoris, historique ; profil de style et suggestions d'achat."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Saison
from ..recommandations import suggerer
from ..styles import profil_style
from ..tenues import generer_tenues
from . import config
from .db import FavoriDB, PortDB, Utilisateur, cle_tenue, get_db
from .depot import (
    garde_robe_moteur,
    pieces_out,
    ports_de,
    statistiques_ports,
    verifier_ids,
    vetements_de,
)
from .schemas import (
    FavoriOut,
    PortOut,
    StyleOut,
    SuggestionOut,
    TenueIn,
    TenueOut,
)
from .securite import utilisateur_courant

router = APIRouter(tags=["tenues"])


def _favoris(db: Session, utilisateur: Utilisateur) -> list[FavoriDB]:
    requete = (
        select(FavoriDB)
        .where(FavoriDB.utilisateur_id == utilisateur.id)
        .order_by(FavoriDB.cree_le.desc())
    )
    return list(db.scalars(requete))


# --- Suggestions de tenues ---------------------------------------------------


@router.get("/tenues", response_model=list[TenueOut])
def tenues(
    saison: Saison | None = None,
    formalite: int | None = Query(default=None, ge=1, le=5),
    nombre: int = Query(default=10, ge=1, le=50),
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> list[TenueOut]:
    lignes = vetements_de(db, utilisateur)
    par_id = {v.id: v for v in lignes}
    ports = ports_de(db, utilisateur)
    stats = statistiques_ports(ports)
    limite = datetime.now(UTC) - timedelta(days=config.JOURS_RECENTS)
    recents = {vid for p in ports if p.porte_le >= limite for vid in p.vetement_ids}
    favoris = {f.cle: f.id for f in _favoris(db, utilisateur)}

    resultat = generer_tenues(garde_robe_moteur(lignes), saison, formalite, nombre, recents=recents)
    return [
        TenueOut(
            score=t.score,
            raisons=t.raisons,
            pieces=pieces_out([p.id for p in t.pieces], par_id, stats),
            favori_id=favoris.get(cle_tenue([p.id for p in t.pieces])),
        )
        for t in resultat
    ]


# --- Favoris -----------------------------------------------------------------


@router.get("/favoris", response_model=list[FavoriOut])
def lister_favoris(
    utilisateur: Utilisateur = Depends(utilisateur_courant), db: Session = Depends(get_db)
) -> list[FavoriOut]:
    par_id = {v.id: v for v in vetements_de(db, utilisateur)}
    stats = statistiques_ports(ports_de(db, utilisateur))
    return [
        FavoriOut(id=f.id, cree_le=f.cree_le, pieces=pieces_out(f.vetement_ids, par_id, stats))
        for f in _favoris(db, utilisateur)
    ]


@router.post("/favoris", response_model=FavoriOut, status_code=status.HTTP_201_CREATED)
def ajouter_favori(
    donnees: TenueIn,
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> FavoriOut:
    ids = verifier_ids(db, utilisateur, donnees.vetement_ids)
    cle = cle_tenue(ids)
    favori = db.scalar(
        select(FavoriDB).where(FavoriDB.utilisateur_id == utilisateur.id, FavoriDB.cle == cle)
    )
    if favori is None:  # idempotent : ajouter deux fois la même tenue ne crée pas de doublon
        favori = FavoriDB(utilisateur_id=utilisateur.id, cle=cle, vetement_ids=ids)
        db.add(favori)
        db.commit()
    par_id = {v.id: v for v in vetements_de(db, utilisateur)}
    return FavoriOut(id=favori.id, cree_le=favori.cree_le, pieces=pieces_out(ids, par_id))


@router.delete("/favoris/{favori_id}", status_code=status.HTTP_204_NO_CONTENT)
def retirer_favori(
    favori_id: str,
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> None:
    favori = db.get(FavoriDB, favori_id)
    if favori is None or favori.utilisateur_id != utilisateur.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Favori introuvable")
    db.delete(favori)
    db.commit()


# --- Historique (tenues portées) ---------------------------------------------


@router.get("/portes", response_model=list[PortOut])
def historique(
    limite: int = Query(default=30, ge=1, le=200),
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> list[PortOut]:
    par_id = {v.id: v for v in vetements_de(db, utilisateur)}
    resultat = []
    for port in ports_de(db, utilisateur):
        pieces = pieces_out(port.vetement_ids, par_id)
        if pieces:  # tous les vêtements supprimés : on n'affiche plus l'entrée
            resultat.append(PortOut(id=port.id, porte_le=port.porte_le, pieces=pieces))
        if len(resultat) >= limite:
            break
    return resultat


@router.post("/portes", response_model=PortOut, status_code=status.HTTP_201_CREATED)
def porter(
    donnees: TenueIn,
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> PortOut:
    ids = verifier_ids(db, utilisateur, donnees.vetement_ids)
    port = PortDB(utilisateur_id=utilisateur.id, vetement_ids=ids)
    db.add(port)
    db.commit()
    par_id = {v.id: v for v in vetements_de(db, utilisateur)}
    return PortOut(id=port.id, porte_le=port.porte_le, pieces=pieces_out(ids, par_id))


@router.delete("/portes/{port_id}", status_code=status.HTTP_204_NO_CONTENT)
def annuler_port(
    port_id: str,
    utilisateur: Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
) -> None:
    port = db.get(PortDB, port_id)
    if port is None or port.utilisateur_id != utilisateur.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Entrée introuvable")
    db.delete(port)
    db.commit()


# --- Analyse -----------------------------------------------------------------


@router.get("/styles", response_model=list[StyleOut])
def styles(
    utilisateur: Utilisateur = Depends(utilisateur_courant), db: Session = Depends(get_db)
) -> list[StyleOut]:
    profil = profil_style(garde_robe_moteur(vetements_de(db, utilisateur)))
    return [StyleOut(style=s, part=p) for s, p in profil]


@router.get("/suggestions", response_model=list[SuggestionOut])
def suggestions(
    utilisateur: Utilisateur = Depends(utilisateur_courant), db: Session = Depends(get_db)
) -> list[SuggestionOut]:
    return [
        SuggestionOut(
            style=s.style, categorie=s.categorie, requete=s.requete, raison=s.raison, liens=s.liens
        )
        for s in suggerer(garde_robe_moteur(vetements_de(db, utilisateur)))
    ]
