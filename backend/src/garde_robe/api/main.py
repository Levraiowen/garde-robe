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

from .. import __version__
from . import routes_auth, routes_garde_robe
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
app.include_router(routes_garde_robe.router)


@app.get("/sante", tags=["système"])
def sante() -> dict[str, str]:
    return {"statut": "ok", "version": __version__}
