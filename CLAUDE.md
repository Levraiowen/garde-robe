# Contexte projet — Garde-Robe Virtuelle

## En bref
App **mobile** de garde-robe virtuelle : l'utilisateur crée un compte, enregistre ses vêtements (avec photo), l'app génère les meilleures tenues avec ce qu'il possède, retient ses favoris et ce qu'il a porté, détermine ses styles dominants et suggère des pièces à acheter / à découvrir sur le web.

Projet personnel de Owen (GitHub : Levraiowen, dépôt public). Communication et code en **français** (noms de domaine en français : `Vetement`, `Tenue`, `GardeRobe`, `generer_tenues`, `useSession`…).

## Architecture (monorepo)
- `backend/` — Python 3.11+
  - `src/garde_robe/` : **moteur** en Python pur (aucune dépendance) — `models`, `couleurs`, `tenues` (param `recents` pour pénaliser les pièces portées), `styles`, `recommandations`, `cli`.
  - `src/garde_robe/api/` : **API FastAPI**
    - `config` (variables d'env), `db` (SQLAlchemy : `Utilisateur`, `VetementDB`, `FavoriDB`, `PortDB` ; type `DateUTC`), `securite` (argon2 + JWT HS256 avec `ver` = `version_jeton`, dépendance `utilisateur_courant`), `schemas` (Pydantic), `depot` (accès aux données partagé), `routes_auth`, `routes_vetements` (+ photo), `routes_tenues` (tenues, favoris, portes, styles, suggestions), `main`.
  - Photos : fichiers dans `GARDE_ROBE_MEDIAS` (défaut `backend/medias/`, ignoré par git), servis sous `/medias/`. Type vérifié par signature (JPEG/PNG/WebP). Le champ `image` n'est modifiable que via `PUT /vetements/{id}/photo`.
  - Tests : `pytest` (moteur + API via `TestClient`, base SQLite temporaire par test ; `conftest.py` fixe `GARDE_ROBE_MEDIAS` avant les imports).
  - Pas de migrations : `create_all` ne modifie pas une table existante. Si on change un modèle, supprimer `backend/garde_robe.db` en dev (ou ajouter Alembic avant la prod).
- `mobile/` — Expo SDK 57, React Native, TypeScript strict, Expo Router, React Compiler activé.
  - `src/app/_layout.tsx` : `SessionProvider` + `ToastProvider` + `Stack.Protected` → `(app)` si connecté, `(auth)` sinon.
  - `(app)/(tabs)` : Garde-robe, Tenues (Pour toi / Favoris), Mon style, Profil. `(app)/vetement/nouveau` (modal, `?copie=<id>` pour dupliquer), `vetement/[id]`, `historique`, `compte/mot-de-passe`.
  - `src/lib/api.ts` : client HTTP ; URL = `EXPO_PUBLIC_API_URL` sinon IP de l'hôte Expo port 8000. 401 → déconnexion auto. `urlMedia()` pour les photos.
  - `src/lib/session.tsx` : jeton + utilisateur dans SecureStore (localStorage sur web) ; au démarrage, si le serveur est injoignable, on reste connecté avec l'utilisateur mémorisé.
  - `src/lib/hooks.ts` : `useDonnees` (recharge au focus), `confirmer`, `vibrer`, `messageDe`. `src/components/toast.tsx` : `useToast()(message, {libelle, onPress})`.
  - `src/components/ui.tsx` : kit d'UI maison (Ecran avec `pied` fixe, Bouton, BoutonIcone, Puce, Onglets, Champ `secret`, EtatVide, EtatErreur…). Réutiliser plutôt que recréer.
  - Lire `mobile/AGENTS.md` : Expo change vite, vérifier la doc versionnée (docs.expo.dev/versions/v57.0.0) avant d'utiliser une API Expo ; installer avec `npx expo install`.
  - Web (react-native-web) : utiliser `role` / `aria-*` (pas `accessibilityLabel`/`accessibilityRole` sur les Pressable, non repris) ; ne pas imbriquer un Pressable dans un autre (bouton dans bouton).

## Design / UX
Épuré, sobre, « luxe » : **blanc + marron** (référence : apps de mode type catalogue).
- Palette dans `mobile/src/constants/theme.ts` (fond blanc, crème `#F6F2EC`, marron `#6B4A36`, noir chaud `#1C1714`). `LargeurMax` = 720 pour tablette / web.
- Titres en serif (Georgia / serif système), labels en petites capitales espacées, boutons pilule noirs, onglets soulignés, grille 2 à 5 colonnes selon la largeur.
- Thème clair uniquement (`userInterfaceStyle: light`).
- Chaque action donne un retour : toast (avec « Annuler » quand c'est réversible), vibration légère, état de chargement sur le bouton. Chaque liste a un état vide explicite et une erreur avec « Réessayer ».

## Règles de composition des tenues
(haut + bas + chaussures) **ou** (robe + chaussures), + veste optionnelle. Accessoires pas encore utilisés.
Score = 0.45 couleurs + 0.35 style + 0.20 formalité ; −0.04 par pièce portée dans les 3 derniers jours ; max 3 apparitions d'une pièce ; une seule variante avec/sans veste.

## Conventions
- Le moteur reste indépendant de l'API / la base : l'API convertit `VetementDB` → `Vetement` et appelle le moteur.
- Une ressource d'un autre utilisateur renvoie **404** (on ne révèle pas son existence).
- Les listes de couleurs de `mobile/src/constants/vetements.ts` doivent rester alignées avec `backend/src/garde_robe/couleurs.py`.
- Avant de commit : `pytest`, `ruff check .`, `ruff format --check .` (backend) ; `npx tsc --noEmit`, `npx expo lint`, `npm run format` (mobile).
- Sous Windows, ne pas éditer les fichiers via PowerShell 5.1 `Get-Content/Set-Content` (casse l'UTF-8 des accents).
- Ne pas lancer Metro avec `CI=1` : ce mode désactive la surveillance des fichiers (les modifs ne sont plus prises en compte).
- Commits en français, concis. Ne jamais versionner de données perso (`*.db`, `backend/medias/`, `data/perso/`, `.env`).

## Préparé pour plus tard (ne pas implémenter sans demande)
- Social : `Utilisateur.profil_public` existe déjà ; suivre des utilisateurs, voir leur garde-robe, liker des tenues.
- Détourage + détection couleur/catégorie depuis la photo, météo, vraie source produits, mot de passe oublié (nécessite l'envoi d'emails).
- Mise en ligne de l'API (Render/Railway/Fly + Postgres + stockage objet pour les photos + Alembic) et build EAS.

Voir `docs/VISION.md` et `docs/ROADMAP.md`.
