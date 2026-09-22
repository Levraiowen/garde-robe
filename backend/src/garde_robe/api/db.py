"""Base de données (SQLAlchemy) et tables."""

from __future__ import annotations

import uuid
from collections.abc import Iterator
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, UniqueConstraint, create_engine
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    Session,
    mapped_column,
    relationship,
    sessionmaker,
)
from sqlalchemy.types import TypeDecorator

from .config import URL_BASE_DE_DONNEES


def _connect_args(url: str) -> dict:
    return {"check_same_thread": False} if url.startswith("sqlite") else {}


moteur = create_engine(URL_BASE_DE_DONNEES, connect_args=_connect_args(URL_BASE_DE_DONNEES))
SessionLocale = sessionmaker(bind=moteur, expire_on_commit=False)


def _uuid() -> str:
    return uuid.uuid4().hex


def _maintenant() -> datetime:
    return datetime.now(UTC)


class DateUTC(TypeDecorator):
    """Datetime toujours relue en UTC (SQLite perd le fuseau horaire)."""

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_result_value(self, valeur, dialect):
        if valeur is not None and valeur.tzinfo is None:
            return valeur.replace(tzinfo=UTC)
        return valeur


class Base(DeclarativeBase):
    pass


class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    pseudo: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    mot_de_passe_hash: Mapped[str] = mapped_column(String(255))
    # Incrémentée au changement de mot de passe : invalide les sessions des autres appareils
    version_jeton: Mapped[int] = mapped_column(default=0)
    # Préparé pour les futures fonctions sociales (voir les garde-robes des autres)
    profil_public: Mapped[bool] = mapped_column(default=False)
    cree_le: Mapped[datetime] = mapped_column(DateUTC, default=_maintenant)

    vetements: Mapped[list[VetementDB]] = relationship(
        back_populates="utilisateur", cascade="all, delete-orphan"
    )
    favoris: Mapped[list[FavoriDB]] = relationship(cascade="all, delete-orphan")
    ports: Mapped[list[PortDB]] = relationship(cascade="all, delete-orphan")


class VetementDB(Base):
    __tablename__ = "vetements"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    utilisateur_id: Mapped[str] = mapped_column(
        ForeignKey("utilisateurs.id", ondelete="CASCADE"), index=True
    )
    nom: Mapped[str] = mapped_column(String(100))
    categorie: Mapped[str] = mapped_column(String(20))
    couleur: Mapped[str] = mapped_column(String(30))
    styles: Mapped[list[str]] = mapped_column(JSON, default=list)
    saisons: Mapped[list[str]] = mapped_column(JSON, default=list)
    formalite: Mapped[int] = mapped_column(default=2)
    marque: Mapped[str | None] = mapped_column(String(60))
    # Chemin public de la photo (/medias/<fichier>), géré uniquement par la route photo
    image: Mapped[str | None] = mapped_column(String(500))
    cree_le: Mapped[datetime] = mapped_column(DateUTC, default=_maintenant)

    utilisateur: Mapped[Utilisateur] = relationship(back_populates="vetements")


class FavoriDB(Base):
    """Tenue enregistrée par l'utilisateur."""

    __tablename__ = "favoris"
    __table_args__ = (UniqueConstraint("utilisateur_id", "cle"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    utilisateur_id: Mapped[str] = mapped_column(
        ForeignKey("utilisateurs.id", ondelete="CASCADE"), index=True
    )
    cle: Mapped[str] = mapped_column(String(400))  # ids triés, séparés par des virgules
    vetement_ids: Mapped[list[str]] = mapped_column(JSON)
    cree_le: Mapped[datetime] = mapped_column(DateUTC, default=_maintenant)


class PortDB(Base):
    """Tenue portée un jour donné (historique)."""

    __tablename__ = "ports"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    utilisateur_id: Mapped[str] = mapped_column(
        ForeignKey("utilisateurs.id", ondelete="CASCADE"), index=True
    )
    vetement_ids: Mapped[list[str]] = mapped_column(JSON)
    porte_le: Mapped[datetime] = mapped_column(DateUTC, default=_maintenant, index=True)


def cle_tenue(vetement_ids: list[str]) -> str:
    return ",".join(sorted(vetement_ids))


def creer_tables() -> None:
    Base.metadata.create_all(moteur)


def get_db() -> Iterator[Session]:
    with SessionLocale() as session:
        yield session
