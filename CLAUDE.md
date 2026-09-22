# Contexte projet — Garde-Robe Virtuelle

## En bref
App **mobile** de garde-robe virtuelle : l'utilisateur crée un compte, enregistre ses vêtements, l'app génère les meilleures tenues avec ce qu'il possède, détermine ses styles dominants et suggère des pièces à acheter / à découvrir sur le web.

Projet personnel de Owen (GitHub : Levraiowen, dépôt public). Communication et code en **français** (noms de domaine en français : `Vetement`, `Tenue`, `GardeRobe`, `generer_tenues`, `useSession`…).

## Architecture (monorepo)
- `backend/` — Python 3.11+
  - `src/garde_robe/` : **moteur** en Python pur (aucune dépendance) — `models`, `couleurs`, `tenues`, `styles`, `recommandations`, `cli`.
  - `src/garde_robe/api/` : **API FastAPI** — `config` (variables d'env), `db` (SQLAlchemy : `Utilisateur`, `VetementDB`), `securite` (argon2 + JWT HS256, dépendance `utilisateur_courant`), `schemas` (Pydantic), `routes_auth`, `routes_garde_robe`, `main`.
  - Tests : `pytest` (moteur + API via `TestClient`, base SQLite temporaire par test).
- `mobile/` — Expo SDK 57, React Native, TypeScript strict, Expo Router, React Compiler activé.
  - `src/app/_layout.tsx` : `SessionProvider` + `Stack.Protected` → `(app)` si connecté, `(auth)` sinon.
  - `src/lib/api.ts` : client HTTP ; URL = `EXPO_PUBLIC_API_URL` sinon IP de l'hôte Expo port 8000. 401 → déconnexion auto.
  - `src/lib/session.tsx` : jeton dans SecureStore (localStorage sur web), vérifié via `/auth/moi` au démarrage.
  - `src/components/ui.tsx` : kit d'UI maison (Bouton, Puce, Onglets, Champ, Carte, Texte…). Réutiliser plutôt que recréer.
  - Lire `mobile/AGENTS.md` : Expo change vite, vérifier la doc versionnée (docs.expo.dev/versions/v57.0.0) avant d'utiliser une API Expo ; installer avec `npx expo install`.

## Design
Épuré, sobre, « luxe » : **blanc + marron** (référence : apps de mode type catalogue).
- Palette dans `mobile/src/constants/theme.ts` (fond blanc, crème `#F6F2EC`, marron `#6B4A36`, noir chaud `#1C1714`).
- Titres en serif (Georgia / serif système), labels en petites capitales espacées, boutons pilule noirs, onglets soulignés, grille 2 colonnes.
- Thème clair uniquement pour l'instant (`userInterfaceStyle: light`).
- Pas de photos encore : la vignette d'un vêtement = pastille de sa couleur sur fond crème.

## Règles de composition des tenues
(haut + bas + chaussures) **ou** (robe + chaussures), + veste optionnelle. Accessoires pas encore utilisés.
Score = 0.45 couleurs + 0.35 style + 0.20 formalité ; max 3 apparitions d'une pièce.

## Conventions
- Le moteur reste indépendant de l'API / la base : l'API convertit `VetementDB` → `Vetement` et appelle le moteur.
- Une ressource d'un autre utilisateur renvoie **404** (on ne révèle pas son existence).
- Les listes de couleurs de `mobile/src/constants/vetements.ts` doivent rester alignées avec `backend/src/garde_robe/couleurs.py`.
- Avant de commit : `pytest`, `ruff check .`, `ruff format --check .` (backend) ; `npx tsc --noEmit`, `npx expo lint`, prettier (mobile).
- Sous Windows, ne pas éditer les fichiers via PowerShell 5.1 `Get-Content/Set-Content` (casse l'UTF-8 des accents).
- Si Metro ne voit pas les modifs (web figé sur une ancienne version) : relancer `npx expo start --clear`.
- Commits en français, concis. Ne jamais versionner de données perso (`*.db`, `data/perso/`, `.env`).

## Préparé pour plus tard (ne pas implémenter sans demande)
- Social : `Utilisateur.profil_public` existe déjà ; suivre des utilisateurs, voir leur garde-robe, liker des tenues.
- Photos (upload + détourage + détection couleur/catégorie), météo, vraie source produits.
- Mise en ligne de l'API (Render/Railway/Fly + Postgres) et build EAS.

Voir `docs/VISION.md` et `docs/ROADMAP.md`.
