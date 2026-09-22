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


def ajouter_tout(client, headers) -> list[str]:
    return [client.post("/vetements", json=v, headers=headers).json()["id"] for v in VETEMENTS]


# --- Validation --------------------------------------------------------------


@pytest.mark.parametrize(
    "maj", [{"nom": None}, {"nom": "   "}, {"couleur": None}, {"saisons": []}, {"formalite": 9}]
)
def test_modification_invalide(client, maj):
    headers = inscrire(client)
    v = client.post("/vetements", json=VETEMENTS[0], headers=headers).json()
    assert client.patch(f"/vetements/{v['id']}", json=maj, headers=headers).status_code == 422


def test_marque_effacable_et_styles_nettoyes(client):
    headers = inscrire(client)
    v = client.post(
        "/vetements",
        json={**VETEMENTS[0], "marque": "Zara", "styles": [" Chic", "chic", ""]},
        headers=headers,
    ).json()
    assert v["styles"] == ["chic"]
    r = client.patch(f"/vetements/{v['id']}", json={"marque": None}, headers=headers)
    assert r.json()["marque"] is None


def test_image_non_modifiable_directement(client):
    headers = inscrire(client)
    v = client.post(
        "/vetements", json={**VETEMENTS[0], "image": "/medias/autre.jpg"}, headers=headers
    ).json()
    assert v["image"] is None


def test_pseudo_insensible_a_la_casse(client):
    inscrire(client)
    r = client.post(
        "/auth/inscription",
        json={"email": "x@test.fr", "pseudo": "OWEN", "mot_de_passe": "motdepasse123"},
    )
    assert r.status_code == 409


# --- Mot de passe ------------------------------------------------------------


def test_changement_mot_de_passe(client):
    ancien = inscrire(client)
    r = client.put(
        "/auth/mot-de-passe", json={"actuel": "faux-faux", "nouveau": "nouveau123"}, headers=ancien
    )
    assert r.status_code == 400

    r = client.put(
        "/auth/mot-de-passe",
        json={"actuel": "motdepasse123", "nouveau": "nouveau123"},
        headers=ancien,
    )
    assert r.status_code == 200
    nouveau = {"Authorization": f"Bearer {r.json()['token']}"}
    assert client.get("/auth/moi", headers=ancien).status_code == 401  # autres sessions coupées
    assert client.get("/auth/moi", headers=nouveau).status_code == 200
    r = client.post("/auth/connexion", json={"email": "owen@test.fr", "mot_de_passe": "nouveau123"})
    assert r.status_code == 200


# --- Photos ------------------------------------------------------------------

JPEG = b"\xff\xd8\xff\xe0" + b"0" * 100


def test_photo(client):
    from garde_robe.api import config

    headers = inscrire(client)
    v = client.post("/vetements", json=VETEMENTS[0], headers=headers).json()
    url = f"/vetements/{v['id']}/photo"

    r = client.put(
        url, files={"fichier": ("x.jpg", b"pas une image", "image/jpeg")}, headers=headers
    )
    assert r.status_code == 415

    r = client.put(url, files={"fichier": ("x.jpg", JPEG, "image/jpeg")}, headers=headers)
    assert r.status_code == 200
    image = r.json()["image"]
    fichier = config.DOSSIER_MEDIAS / image.rsplit("/", 1)[-1]
    assert image.startswith("/medias/") and fichier.exists()

    # remplacer la photo supprime l'ancienne
    r = client.put(url, files={"fichier": ("y.jpg", JPEG, "image/jpeg")}, headers=headers)
    assert not fichier.exists()
    fichier = config.DOSSIER_MEDIAS / r.json()["image"].rsplit("/", 1)[-1]

    client.delete(f"/vetements/{v['id']}", headers=headers)
    assert not fichier.exists()


def test_photo_d_un_autre(client):
    owen = inscrire(client)
    lea = inscrire(client, email="lea@test.fr", pseudo="lea")
    v = client.post("/vetements", json=VETEMENTS[0], headers=owen).json()
    r = client.put(
        f"/vetements/{v['id']}/photo", files={"fichier": ("x.jpg", JPEG, "image/jpeg")}, headers=lea
    )
    assert r.status_code == 404


# --- Favoris et historique ---------------------------------------------------


def test_favoris(client):
    headers = inscrire(client)
    ids = ajouter_tout(client, headers)

    r = client.post("/favoris", json={"vetement_ids": ids}, headers=headers)
    assert r.status_code == 201
    favori = r.json()
    # idempotent
    r = client.post("/favoris", json={"vetement_ids": list(reversed(ids))}, headers=headers)
    assert r.json()["id"] == favori["id"]
    assert len(client.get("/favoris", headers=headers).json()) == 1
    assert client.get("/tenues", headers=headers).json()[0]["favori_id"] == favori["id"]

    # supprimer une pièce retire le favori
    client.delete(f"/vetements/{ids[0]}", headers=headers)
    assert client.get("/favoris", headers=headers).json() == []


def test_favori_avec_pieces_d_un_autre(client):
    owen = inscrire(client)
    lea = inscrire(client, email="lea@test.fr", pseudo="lea")
    ids = ajouter_tout(client, owen)
    assert client.post("/favoris", json={"vetement_ids": ids}, headers=lea).status_code == 404
    r = client.post("/favoris", json={"vetement_ids": [ids[0], ids[0]]}, headers=owen)
    assert r.status_code == 422


def test_historique(client):
    headers = inscrire(client)
    ids = ajouter_tout(client, headers)

    r = client.post("/portes", json={"vetement_ids": ids}, headers=headers)
    assert r.status_code == 201
    port_id = r.json()["id"]

    vetement = client.get(f"/vetements/{ids[0]}", headers=headers).json()
    assert vetement["nb_ports"] == 1 and vetement["dernier_port"]
    raisons = client.get("/tenues", headers=headers).json()[0]["raisons"]
    assert "déjà portée récemment" in raisons

    assert len(client.get("/portes", headers=headers).json()) == 1
    assert client.delete(f"/portes/{port_id}", headers=headers).status_code == 204
    assert client.get("/portes", headers=headers).json() == []
