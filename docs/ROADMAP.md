# Roadmap

## v0.1 — Moteur (✅ fait)
- [x] Modèle de données + JSON
- [x] Harmonie des couleurs
- [x] Génération et notation des tenues, diversité
- [x] Profil / styles dominants
- [x] Suggestions basiques (catégories manquantes + liens de recherche)
- [x] CLI, tests, CI

## v0.2 — App mobile + comptes (✅ fait)
- [x] API FastAPI (SQLite), comptes : inscription, connexion (JWT), suppression du compte
- [x] Mots de passe hachés (argon2), garde-robes isolées par utilisateur
- [x] App Expo : connexion / inscription, session mémorisée (SecureStore)
- [x] Garde-robe : grille, filtres par catégorie, ajout / modification / suppression
- [x] Tenues filtrables (saison, occasion), profil de style, suggestions
- [x] Design épuré blanc / marron

## v0.3 — Garde-robe plus riche
- [ ] Photos des vêtements (appareil photo / galerie), stockage des images
- [ ] Détourage automatique + détection de la couleur dominante
- [ ] Favoris / « j'ai porté cette tenue » (historique), ne pas reproposer une tenue récente
- [ ] Accessoires dans les tenues
- [ ] Mot de passe oublié (email), modification du profil

## v0.4 — Moteur plus intelligent
- [ ] Météo du jour → saison / couches automatiquement
- [ ] Apprentissage des préférences (tenues likées / rejetées)
- [ ] Couleurs plus fines (hex, motifs, matières)

## v0.5 — Social
- [ ] Profil public / privé (champ `profil_public` déjà en base)
- [ ] Suivre des utilisateurs dont on aime le style ; découvrir des profils proches du sien
- [ ] Voir la garde-robe et les tenues des autres, liker des tenues

## v0.6 — Mise en ligne
- [ ] Héberger l'API (Render / Railway / Fly) + PostgreSQL
- [ ] Build de l'app avec EAS (TestFlight / Play Store interne)
- [ ] Vraie source de produits pour les suggestions (API marchandes / affiliation / seconde main)
