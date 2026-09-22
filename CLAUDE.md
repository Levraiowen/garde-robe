# Contexte projet — Garde-Robe Virtuelle

## En bref
Application de garde-robe virtuelle : l'utilisateur enregistre ses vêtements, l'app génère les meilleures tenues possibles avec ce qu'il possède, détermine ses styles dominants et suggère des pièces à acheter / à découvrir sur le web.

Projet personnel de Owen (GitHub : Levraiowen). Communication et code en **français** (noms de domaine en français : `Vetement`, `Tenue`, `GardeRobe`, `generer_tenues`…).

## État actuel (v0.1 — MVP moteur)
- Cœur en **Python pur (3.11+)**, aucune dépendance runtime. Layout `src/`.
- Persistance : fichier JSON (`data/exemple_garde_robe.json` comme exemple).
- Interface : CLI uniquement (`garde-robe <fichier> tenues|styles|suggestions`).
- Les suggestions web ne sont que des **liens de recherche** générés (Google Shopping, Vinted, Pinterest) — pas encore de vraie API produit.

## Architecture
| Module | Rôle |
|---|---|
| `models.py` | `Vetement`, `Tenue`, `GardeRobe`, enums `Categorie` / `Saison`, chargement/sauvegarde JSON |
| `couleurs.py` | score d'harmonie entre couleurs (neutres + cercle chromatique) |
| `tenues.py` | énumère les combos valides, les note (couleur 0.45 / style 0.35 / formalité 0.20), applique la diversité |
| `styles.py` | profil de style pondéré (chaque pièce répartit un poids de 1 entre ses styles) |
| `recommandations.py` | pour chaque style dominant, catégories essentielles manquantes → suggestions + liens |
| `cli.py` | point d'entrée ligne de commande |

Règles de composition : une tenue = (haut + bas + chaussures) **ou** (robe + chaussures), + veste optionnelle. Les accessoires ne sont pas encore utilisés.

## Conventions
- Garder le cœur (`src/garde_robe`) indépendant de toute UI / base de données : les futures interfaces (web, mobile) doivent l'appeler, pas le dupliquer.
- Chaque nouvelle règle de notation doit avoir un test dans `tests/`.
- Lancer `pytest` et `ruff check .` avant de commit. Commits en français, concis.
- Ne jamais versionner de vraies photos ou données perso (`data/perso/`, `data/photos/` sont ignorés).

## Décisions ouvertes (à trancher plus tard)
- Stack de l'interface : web (FastAPI + front) vs mobile (Expo / React Native) vs Streamlit pour prototyper.
- Stockage : JSON → SQLite → base distante si multi-appareils.
- Reconnaissance d'image (catégorie / couleur depuis une photo) : modèle local vs API.
- Source des suggestions produits : API marchandes, affiliation, scraping (attention aux CGU).

Voir `docs/VISION.md` et `docs/ROADMAP.md`.
