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

## Ce qui marche (v0.3)

| Fonction | État |
|---|---|
| **Comptes** : inscription, connexion, session mémorisée (même hors ligne), changement de mot de passe (déconnecte les autres appareils), suppression du compte | ✅ |
| **Garde-robe** : grille façon catalogue, filtres par catégorie, recherche (nom, marque, couleur, style), ajout / modification / duplication / suppression | ✅ |
| **Photos** des vêtements (appareil photo ou galerie), avec la couleur en secours | ✅ |
| **Tenues** : « tenue du jour » selon la saison actuelle, filtres saison / occasion, variété (pas de doublon avec/sans veste) | ✅ |
| **Favoris** : enregistrer une tenue d'un cœur, la retrouver dans l'onglet Favoris | ✅ |
| **Historique** : « Je la porte aujourd'hui » (avec Annuler) ; les pièces portées récemment sont moins proposées ; « porté N fois » sur chaque vêtement | ✅ |
| **Mon style** : style dominant, répartition, palette de couleurs, pièces à redécouvrir, suggestions d'achat (Google Shopping, Vinted, Pinterest) | ✅ |
| **Profil** : statistiques, dernières tenues portées | ✅ |
| Design épuré blanc / marron, toasts de confirmation, vibrations, états vides et erreurs avec « Réessayer » | ✅ |
| Fonctions sociales | 🔜 (base prête : `profil_public`) |

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
| `GARDE_ROBE_MEDIAS` | `./medias` | Dossier des photos des vêtements. |

## API

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/auth/inscription` | Crée un compte, renvoie `{token, utilisateur}` |
| POST | `/auth/connexion` | Connexion, renvoie `{token, utilisateur}` |
| GET / DELETE | `/auth/moi` | Profil courant / suppression du compte (garde-robe, photos, historique) |
| PUT | `/auth/mot-de-passe` | Change le mot de passe, renvoie un nouveau jeton (les autres sessions sont coupées) |
| GET / POST | `/vetements` | Lister (avec `nb_ports`, `dernier_port`) / ajouter |
| GET / PATCH / DELETE | `/vetements/{id}` | Détail / modifier / supprimer |
| PUT / DELETE | `/vetements/{id}/photo` | Envoyer (multipart, JPEG/PNG/WebP, 8 Mo max) / retirer la photo |
| GET | `/tenues?saison=&formalite=&nombre=` | Meilleures tenues (avec `favori_id`) |
| GET / POST, DELETE | `/favoris`, `/favoris/{id}` | Tenues favorites |
| GET / POST, DELETE | `/portes`, `/portes/{id}` | Historique des tenues portées |
| GET | `/styles` | Profil de style |
| GET | `/suggestions` | Pièces à ajouter + liens |

Toutes les routes hors `/auth/inscription` et `/auth/connexion` demandent `Authorization: Bearer <token>`. Chaque utilisateur ne voit que ses propres données : un objet d'un autre utilisateur répond 404.

> **Photos :** servies publiquement sous `/medias/<nom aléatoire>`. Le nom n'est pas devinable, mais avant une vraie mise en ligne il faudra passer à un stockage objet avec des liens signés.

## Comment une tenue est notée

```
score = 0.45 × couleurs + 0.35 × cohérence de style + 0.20 × formalité
```

- **Couleurs** : les neutres (noir, blanc, beige, denim…) vont avec tout ; les couleurs vives sont comparées sur le cercle chromatique.
- **Style** : part des pièces qui partagent le style le plus représenté.
- **Formalité** : pénalise les écarts (baskets + costume).
- **Diversité** : une même pièce n'apparaît pas plus de 3 fois dans les propositions, et une même tenue n'est pas proposée deux fois (avec et sans veste).
- **Historique** : chaque pièce portée dans les 3 derniers jours retire 4 points, pour varier.

## Qualité

```bash
cd backend && pytest && ruff check . && ruff format --check .
cd mobile && npx tsc --noEmit && npx expo lint
```

La CI GitHub Actions lance tout ça à chaque push.

## Suite

Voir [docs/ROADMAP.md](docs/ROADMAP.md).
