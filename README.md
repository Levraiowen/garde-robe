# 👕 Garde-Robe Virtuelle

> Numérise tes vêtements, laisse l'application composer tes meilleures tenues, et découvre de nouvelles pièces qui collent à ton style.

![statut](https://img.shields.io/badge/statut-MVP%20en%20cours-orange) ![python](https://img.shields.io/badge/python-3.11%2B-blue)

---

## 💡 L'idée

1. **Inventaire** — tu ajoutes tous tes vêtements (catégorie, couleur, styles, saisons, niveau de formalité, photo…).
2. **Combos** — l'application génère les meilleures tenues possibles avec ce que tu as réellement, en tenant compte de l'harmonie des couleurs, de la cohérence de style et de la formalité.
3. **Profil de style** — elle détermine tes **styles dominants** (casual, chic, streetwear, minimaliste…).
4. **Suggestions** — à partir de ce profil, elle te propose des pièces que tu **n'as pas** (sur le web) pour compléter ta garde-robe ou t'inspirer.

## ✅ Ce qui marche déjà (v0.1)

| Fonction | Module | État |
|---|---|---|
| Modèle de données + sauvegarde JSON | `models.py` | ✅ |
| Harmonie des couleurs (neutres, analogues, complémentaires) | `couleurs.py` | ✅ |
| Génération & notation de tenues (avec diversité) | `tenues.py` | ✅ |
| Profil / styles dominants | `styles.py` | ✅ |
| Suggestions par catégories manquantes + liens de recherche | `recommandations.py` | ✅ (basique) |
| Interface en ligne de commande | `cli.py` | ✅ |
| Interface graphique / mobile | — | 🔜 |
| Reconnaissance des vêtements par photo | — | 🔜 |

## 🚀 Démarrage rapide

```bash
git clone https://github.com/Levraiowen/garde-robe.git
cd garde-robe
python -m venv .venv
.venv\Scripts\activate        # Windows  (macOS/Linux : source .venv/bin/activate)
pip install -e ".[dev]"
```

Essayer avec la garde-robe d'exemple :

```bash
garde-robe data/exemple_garde_robe.json tenues -n 5
garde-robe data/exemple_garde_robe.json tenues --saison hiver --formalite 3
garde-robe data/exemple_garde_robe.json styles
garde-robe data/exemple_garde_robe.json suggestions
```

Exemple de sortie :

```
 1. [1.00] Sweat à capuche gris + Cargo kaki + Baskets blanches
    couleurs 100% · style « streetwear » 100% · formalité 100%
 3. [0.95] T-shirt blanc + Jean brut + Baskets blanches
    couleurs 100% · style « casual » 100% · formalité 75%

streetwear      ███████████ 28%
casual          █████████ 24%
chic            ████████ 21%
```

## 🧠 Comment une tenue est notée

```
score = 0.45 × couleurs + 0.35 × cohérence de style + 0.20 × formalité
```

- **Couleurs** : moyenne des paires de pièces. Les neutres (noir, blanc, beige, denim…) vont avec tout ; les couleurs vives sont comparées sur le cercle chromatique (analogues 👍, complémentaires 👍, le reste 👎).
- **Style** : part des pièces qui partagent le style le plus représenté.
- **Formalité** : plus l'écart entre la pièce la plus décontractée et la plus habillée est grand, plus le score baisse.
- **Diversité** : une même pièce n'apparaît pas plus de `max_repetitions` fois dans les propositions.

## 👗 Format d'un vêtement

```json
{
  "id": "h2",
  "nom": "Chemise oxford bleue",
  "categorie": "haut",
  "couleur": "bleu",
  "styles": ["chic", "preppy"],
  "saisons": ["printemps", "ete", "automne", "hiver"],
  "formalite": 3,
  "marque": "optionnel",
  "image": "optionnel (chemin ou URL)"
}
```

- `categorie` : `haut`, `bas`, `robe`, `veste`, `chaussures`, `accessoire`
- `saisons` : `printemps`, `ete`, `automne`, `hiver` (toutes par défaut)
- `formalite` : de `1` (très décontracté) à `5` (très habillé)

## 🗂️ Structure du projet

```
garde-robe/
├── src/garde_robe/
│   ├── models.py            # Vetement, Tenue, GardeRobe (+ JSON)
│   ├── couleurs.py          # harmonie des couleurs
│   ├── tenues.py            # moteur de combos
│   ├── styles.py            # profil & styles dominants
│   ├── recommandations.py   # suggestions web
│   └── cli.py               # ligne de commande
├── data/exemple_garde_robe.json
├── tests/
├── docs/
│   ├── VISION.md            # vision produit détaillée
│   └── ROADMAP.md           # étapes prévues
└── CLAUDE.md                # contexte pour l'assistant IA
```

## 🧪 Tests & qualité

```bash
pytest
ruff check .
```

Les tests tournent automatiquement sur GitHub Actions à chaque push.

## 🗺️ Suite

Voir [docs/ROADMAP.md](docs/ROADMAP.md) — prochaines grandes étapes : interface utilisateur, photos + détection automatique (couleur / catégorie), vraie recherche de produits en ligne, météo.
