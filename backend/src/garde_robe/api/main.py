"""Point d'entrée de l'API.

Lancer en local (depuis backend/) :
    uvicorn garde_robe.api.main:app --reload --host 0.0.0.0 --port 8000
Documentation interactive : http://localhost:8000/docs
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .. import __version__
from . import config, routes_auth, routes_tenues, routes_vetements
from .db import creer_tables


@asynccontextmanager
async def _cycle_de_vie(_: FastAPI) -> AsyncIterator[None]:
    creer_tables()
    yield


app = FastAPI(title="Garde-Robe API", version=__version__, lifespan=_cycle_de_vie)

# L'app mobile n'est pas concernée par CORS ; utile pour la version web d'Expo en dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_auth.router)
app.include_router(routes_vetements.router)
app.include_router(routes_tenues.router)

# Photos des vêtements. Les noms de fichiers sont aléatoires (non devinables) ;
# à remplacer par un stockage objet avec URLs signées avant une vraie mise en ligne.
config.DOSSIER_MEDIAS.mkdir(parents=True, exist_ok=True)
app.mount("/medias", StaticFiles(directory=config.DOSSIER_MEDIAS), name="medias")


@app.get("/sante", tags=["système"])
def sante() -> dict[str, str]:
    return {"statut": "ok", "version": __version__}
