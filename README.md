# Garde-Robe Virtuelle

> Numérise tes vêtements, laisse l'application composer tes meilleures tenues, et découvre de nouvelles pièces qui collent à ton style.

![statut](https://img.shields.io/badge/statut-v0.2%20en%20cours-6B4A36) ![mobile](https://img.shields.io/badge/app-Expo%20SDK%2057-1C1714) ![python](https://img.shields.io/badge/API-Python%203.11%2B-8C8078)

---

## L'idée

1. **Inventaire** : tu ajoutes tes vêtements (catégorie, couleur, styles, saisons, niveau d'habillé, marque…).
2. **Combos** : l'app génère les meilleures tenues possibles avec ce que tu as réellement.
3. **Profil de style** : elle détermine tes **styles dominants** (streetwear, chic, minimaliste…).
4. **Suggestions** : elle propose des pièces que tu **n'as pas** pour compléter ta garde-robe ou t'inspirer.
5. *(plus tard)* **Social** : suivre des gens dont tu aimes le style, voir leur garde-robe, liker des tenues.

## Ce qui marche (v0.2)

| Fonction | Où | État |
|---|---|---|
| Comptes : inscription, connexion, session mémorisée, déconnexion, suppression du compte | API + mobile | ✅ |
| Garde-robe personnelle : ajouter / modifier / supprimer un vêtement | API + mobile | ✅ |
| Génération de tenues filtrables (saison, occasion) | moteur + mobile | ✅ |
| Profil de style + suggestions avec liens (Google Shopping, Vinted, Pinterest) | moteur + mobile | ✅ (basique) |
| Design épuré blanc / marron | mobile | ✅ |
| Photos des vêtements | — | 🔜 |
| Fonctions sociales | — | 🔜 (base prête : `profil_public`) |

## Architecture

```
garde-robe/
├── backend/                  # Python
│   ├── src/garde_robe/
│   │   ├── models.py, couleurs.py, tenues.py, styles.py, recommandations.py   # moteur (Python pur)
│   │   ├── cli.py            # ligne de commande (démo du moteur)
│   │   └── api/              # API FastAPI : comptes (JWT + argon2), vêtements, tenues…
│   ├── tests/                # pytest (moteur + API)
│   └── data/exemple_garde_robe.json
├── mobile/                   # app Expo (React Native + TypeScript + Expo Router)
│   └── src/{app,components,constants,lib}
└── docs/                     # vision, roadmap
```

```
 App mobile (Expo)  ──HTTP/JSON + jeton──▶  API FastAPI  ──▶  moteur garde_robe
   jeton dans SecureStore                    SQLite (dev)
```

## Lancer le projet en local

**Prérequis :** Python 3.11+, Node 20+, et l'app **Expo Go** sur ton téléphone (App Store / Play Store).

### 1. L'API (terminal 1)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux : source .venv/bin/activate
pip install -e ".[dev]"
uvicorn garde_robe.api.main:app --reload --host 0.0.0.0 --port 8000
```

La doc interactive de l'API est disponible sur http://localhost:8000/docs.

### 2. L'app mobile (terminal 2)

```bash
cd mobile
npm install
npx expo start
```

Scanne le QR code avec Expo Go (Android) ou l'appareil photo (iPhone). **Le téléphone et le PC doivent être sur le même Wi-Fi.**
L'app trouve l'API toute seule (IP du PC, port 8000). En cas de souci :
- Windows peut bloquer le port 8000 : autorise Python dans le pare-feu (réseau privé) ;
- ou force l'adresse dans `mobile/.env` (voir `mobile/.env.example`).

Tu peux aussi tester dans le navigateur avec `npx expo start --web`.

### Variables d'environnement de l'API

| Variable | Défaut | Rôle |
|---|---|---|
| `GARDE_ROBE_SECRET` | clé de dev (avertissement) | Clé de signature des jetons. **À définir en production.** |
| `GARDE_ROBE_DB` | `sqlite:///./garde_robe.db` | Base de données (SQLAlchemy). |
| `GARDE_ROBE_TOKEN_JOURS` | `30` | Durée de validité d'une session. |

## API

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/auth/inscription` | Crée un compte, renvoie `{token, utilisateur}` |
| POST | `/auth/connexion` | Connexion, renvoie `{token, utilisateur}` |
| GET / DELETE | `/auth/moi` | Profil courant / suppression du compte (et de sa garde-robe) |
| GET / POST | `/vetements` | Lister / ajouter |
| GET / PATCH / DELETE | `/vetements/{id}` | Détail / modifier / supprimer |
| GET | `/tenues?saison=&formalite=&nombre=` | Meilleures tenues |
| GET | `/styles` | Profil de style |
| GET | `/suggestions` | Pièces à ajouter + liens |

Toutes les routes hors `/auth/inscription` et `/auth/connexion` demandent `Authorization: Bearer <token>`. Chaque utilisateur ne voit que sa propre garde-robe.

## Comment une tenue est notée

```
score = 0.45 × couleurs + 0.35 × cohérence de style + 0.20 × formalité
```

- **Couleurs** : les neutres (noir, blanc, beige, denim…) vont avec tout ; les couleurs vives sont comparées sur le cercle chromatique.
- **Style** : part des pièces qui partagent le style le plus représenté.
- **Formalité** : pénalise les écarts (baskets + costume).
- **Diversité** : une même pièce n'apparaît pas plus de 3 fois dans les propositions.

## Qualité

```bash
cd backend && pytest && ruff check . && ruff format --check .
cd mobile && npx tsc --noEmit && npx expo lint
```

La CI GitHub Actions lance tout ça à chaque push.

## Suite

Voir [docs/ROADMAP.md](docs/ROADMAP.md).
