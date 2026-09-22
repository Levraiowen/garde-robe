"""Mots de passe (argon2) et jetons d'accès (JWT)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import ALGORITHME_JWT, CLE_SECRETE, DUREE_TOKEN_JOURS
from .db import Utilisateur, get_db

_hasher = PasswordHasher()
_bearer = HTTPBearer(auto_error=False)


def hasher_mot_de_passe(mot_de_passe: str) -> str:
    return _hasher.hash(mot_de_passe)


def verifier_mot_de_passe(mot_de_passe: str, hash_: str) -> bool:
    try:
        return _hasher.verify(hash_, mot_de_passe)
    except VerificationError:
        return False


def creer_token(utilisateur_id: str) -> str:
    expiration = datetime.now(UTC) + timedelta(days=DUREE_TOKEN_JOURS)
    return jwt.encode({"sub": utilisateur_id, "exp": expiration}, CLE_SECRETE, ALGORITHME_JWT)


def utilisateur_courant(
    identifiants: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Utilisateur:
    non_autorise = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Session invalide ou expirée, reconnecte-toi",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if identifiants is None:
        raise non_autorise
    try:
        payload = jwt.decode(identifiants.credentials, CLE_SECRETE, [ALGORITHME_JWT])
    except jwt.PyJWTError:
        raise non_autorise from None
    utilisateur = db.get(Utilisateur, payload.get("sub"))
    if utilisateur is None:
        raise non_autorise
    return utilisateur
