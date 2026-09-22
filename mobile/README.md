# Garde-Robe — app mobile

App Expo (React Native + TypeScript + Expo Router, SDK 57). Voir le [README principal](../README.md) pour lancer tout le projet.

## Structure

```
src/
├── app/                      # écrans (Expo Router : 1 fichier = 1 écran)
│   ├── _layout.tsx           # racine : session + routes protégées
│   ├── (auth)/               # connexion, inscription (visibles déconnecté)
│   └── (app)/                # visibles connecté
│       ├── (tabs)/           # Garde-robe, Tenues, Mon style, Profil
│       └── vetement/         # ajout (nouveau) et modification ([id])
├── components/               # UI réutilisable (ui.tsx, formulaires, vignettes)
├── constants/                # thème (palette blanc/marron) et listes de valeurs
└── lib/                      # client API, session, stockage du jeton, hooks
```

## Commandes

```bash
npm install
npx expo start          # QR code à scanner avec Expo Go
npx expo start --web    # version navigateur (pratique pour développer)
npx tsc --noEmit        # typage
npx expo lint           # lint
npx prettier --write "src/**/*.{ts,tsx}"
```

Toujours installer les paquets avec `npx expo install <paquet>` (versions compatibles SDK).
