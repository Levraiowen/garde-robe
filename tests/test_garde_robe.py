from collections import Counter

import pytest

from garde_robe import (
    Categorie,
    GardeRobe,
    Saison,
    Vetement,
    generer_tenues,
    profil_style,
    suggerer,
)
from garde_robe.couleurs import score_paire


def test_chargement_et_sauvegarde(garde_robe, tmp_path):
    chemin = tmp_path / "gr.json"
    garde_robe.sauvegarder(chemin)
    assert len(GardeRobe.charger(chemin)) == len(garde_robe)


def test_ajout_id_duplique(garde_robe):
    with pytest.raises(ValueError):
        garde_robe.ajouter(Vetement(id="h1", nom="x", categorie=Categorie.HAUT, couleur="noir"))


def test_neutres_vont_avec_tout():
    assert score_paire("noir", "rouge") == 1.0
    assert score_paire("rouge", "vert") < score_paire("rouge", "orange")


def test_tenues_valides_et_triees(garde_robe):
    tenues = generer_tenues(garde_robe, nombre=5)
    assert len(tenues) == 5
    assert [t.score for t in tenues] == sorted((t.score for t in tenues), reverse=True)
    for t in tenues:
        cats = {p.categorie for p in t.pieces}
        assert Categorie.CHAUSSURES in cats
        assert Categorie.ROBE in cats or {Categorie.HAUT, Categorie.BAS} <= cats


def test_filtre_saison(garde_robe):
    for t in generer_tenues(garde_robe, saison=Saison.ETE, nombre=20):
        assert all(Saison.ETE in p.saisons for p in t.pieces)


def test_diversite(garde_robe):
    tenues = generer_tenues(garde_robe, nombre=20, max_repetitions=2)
    compteur = Counter(p.id for t in tenues for p in t.pieces)
    assert max(compteur.values()) <= 2


def test_profil_style(garde_robe):
    profil = profil_style(garde_robe)
    assert abs(sum(p for _, p in profil) - 1) < 0.01
    assert profil[0][0] in {"casual", "chic", "streetwear"}


def test_suggestions_catégories_manquantes(garde_robe):
    for s in suggerer(garde_robe):
        pieces = [v for v in garde_robe.vetements if s.style in v.styles]
        assert s.categorie not in {v.categorie for v in pieces}
        assert s.liens
