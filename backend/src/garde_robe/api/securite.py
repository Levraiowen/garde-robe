"""Mots de passe (argon2) et jetons d'accès (JWT)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import ALGORITHME_JWT, CLE_SECRETE, DUREE_TOKEN_JOURS
from .db import Utilisateur, get_db

_hasher = PasswordHasher()
_bearer = HTTPBearer(auto_error=False)
# Hash factice : vérifié quand l'email est inconnu, pour que le temps de réponse
# ne révèle pas si un compte existe.
_HASH_FACTICE = _hasher.hash("mot-de-passe-factice")


def hasher_mot_de_passe(mot_de_passe: str) -> str:
    return _hasher.hash(mot_de_passe)


def verifier_mot_de_passe(mot_de_passe: str, hash_: str | None) -> bool:
    try:
        return _hasher.verify(hash_ or _HASH_FACTICE, mot_de_passe) and hash_ is not None
    except (VerificationError, InvalidHashError):
        return False


def creer_token(utilisateur: Utilisateur) -> str:
    expiration = datetime.now(UTC) + timedelta(days=DUREE_TOKEN_JOURS)
    payload = {"sub": utilisateur.id, "ver": utilisateur.version_jeton, "exp": expiration}
    return jwt.encode(payload, CLE_SECRETE, ALGORITHME_JWT)


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
    if utilisateur is None or payload.get("ver", 0) != utilisateur.version_jeton:
        raise non_autorise
    return utilisateur
