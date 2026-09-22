import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from garde_robe.api.db import Base, get_db
from garde_robe.api.main import app


@pytest.fixture
def client(tmp_path):
    moteur = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(moteur)
    Session = sessionmaker(bind=moteur, expire_on_commit=False)

    def db_de_test():
        with Session() as session:
            yield session

    app.dependency_overrides[get_db] = db_de_test
    yield TestClient(app)
    app.dependency_overrides.clear()


def inscrire(client, email="owen@test.fr", pseudo="owen", mdp="motdepasse123") -> dict:
    r = client.post(
        "/auth/inscription", json={"email": email, "pseudo": pseudo, "mot_de_passe": mdp}
    )
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


VETEMENTS = [
    {"nom": "T-shirt blanc", "categorie": "haut", "couleur": "Blanc", "styles": ["casual"]},
    {"nom": "Jean brut", "categorie": "bas", "couleur": "denim", "styles": ["casual"]},
    {"nom": "Baskets", "categorie": "chaussures", "couleur": "blanc", "styles": ["casual"]},
]


# --- Comptes -----------------------------------------------------------------


def test_inscription_puis_connexion(client):
    inscrire(client)
    r = client.post(
        "/auth/connexion", json={"email": "OWEN@test.fr", "mot_de_passe": "motdepasse123"}
    )
    assert r.status_code == 200
    headers = {"Authorization": f"Bearer {r.json()['token']}"}
    assert client.get("/auth/moi", headers=headers).json()["pseudo"] == "owen"


def test_mot_de_passe_jamais_renvoye(client):
    r = client.post(
        "/auth/inscription",
        json={"email": "a@b.fr", "pseudo": "abc", "mot_de_passe": "motdepasse123"},
    )
    assert "mot_de_passe" not in r.text


def test_email_et_pseudo_uniques(client):
    inscrire(client)
    r = client.post(
        "/auth/inscription",
        json={"email": "owen@test.fr", "pseudo": "autre", "mot_de_passe": "motdepasse123"},
    )
    assert r.status_code == 409
    r = client.post(
        "/auth/inscription",
        json={"email": "autre@test.fr", "pseudo": "owen", "mot_de_passe": "motdepasse123"},
    )
    assert r.status_code == 409


def test_mauvais_mot_de_passe(client):
    inscrire(client)
    r = client.post("/auth/connexion", json={"email": "owen@test.fr", "mot_de_passe": "faux-faux"})
    assert r.status_code == 401


def test_mot_de_passe_trop_court(client):
    r = client.post(
        "/auth/inscription", json={"email": "a@b.fr", "pseudo": "abc", "mot_de_passe": "court"}
    )
    assert r.status_code == 422


@pytest.mark.parametrize("token", [None, "n.importe.quoi"])
def test_acces_sans_token_valide(client, token):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    assert client.get("/vetements", headers=headers).status_code == 401


def test_suppression_compte(client):
    headers = inscrire(client)
    client.post("/vetements", json=VETEMENTS[0], headers=headers)
    assert client.delete("/auth/moi", headers=headers).status_code == 204
    assert client.get("/auth/moi", headers=headers).status_code == 401


# --- Garde-robe --------------------------------------------------------------


def test_crud_vetement(client):
    headers = inscrire(client)
    r = client.post("/vetements", json=VETEMENTS[0], headers=headers)
    assert r.status_code == 201
    v = r.json()
    assert v["couleur"] == "blanc"  # normalisé en minuscules
    assert len(v["saisons"]) == 4  # toutes les saisons par défaut

    r = client.patch(f"/vetements/{v['id']}", json={"formalite": 3}, headers=headers)
    assert r.json()["formalite"] == 3
    assert r.json()["nom"] == "T-shirt blanc"

    assert client.delete(f"/vetements/{v['id']}", headers=headers).status_code == 204
    assert client.get("/vetements", headers=headers).json() == []


def test_garde_robes_isolees(client):
    owen = inscrire(client)
    lea = inscrire(client, email="lea@test.fr", pseudo="lea")
    v = client.post("/vetements", json=VETEMENTS[0], headers=owen).json()

    assert client.get("/vetements", headers=lea).json() == []
    assert client.get(f"/vetements/{v['id']}", headers=lea).status_code == 404
    assert client.delete(f"/vetements/{v['id']}", headers=lea).status_code == 404


def test_tenues_styles_suggestions(client):
    headers = inscrire(client)
    for v in VETEMENTS:
        client.post("/vetements", json=v, headers=headers)

    tenues = client.get("/tenues", headers=headers).json()
    assert len(tenues) == 1
    assert {p["categorie"] for p in tenues[0]["pieces"]} == {"haut", "bas", "chaussures"}

    assert client.get("/styles", headers=headers).json() == [{"style": "casual", "part": 1.0}]
    suggestions = client.get("/suggestions", headers=headers).json()
    assert [s["categorie"] for s in suggestions] == ["veste"]


def test_garde_robe_vide(client):
    headers = inscrire(client)
    assert client.get("/tenues", headers=headers).json() == []
    assert client.get("/styles", headers=headers).json() == []
