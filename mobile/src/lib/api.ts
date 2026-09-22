// Client HTTP de l'API Garde-Robe.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type {
  Favori,
  PartStyle,
  PhotoLocale,
  Port,
  Saison,
  Session,
  Suggestion,
  Tenue,
  Utilisateur,
  Vetement,
  VetementSaisie,
} from './types';

/**
 * URL de l'API :
 * 1. EXPO_PUBLIC_API_URL si défini (fichier mobile/.env) ;
 * 2. sinon, même machine que le serveur Expo, port 8000 (pratique avec Expo Go en Wi-Fi) ;
 * 3. sinon localhost.
 */
function detecterUrlApi(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, '');
  const hote = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${hote || 'localhost'}:8000`;
}

export const URL_API = detecterUrlApi();

/** URL complète d'une photo renvoyée par l'API (/medias/…). */
export function urlMedia(chemin: string | null): string | null {
  if (!chemin) return null;
  return chemin.startsWith('http') ? chemin : `${URL_API}${chemin}`;
}

export class ErreurApi extends Error {
  constructor(
    message: string,
    public statut: number,
  ) {
    super(message);
  }

  /** Le serveur n'a pas pu être joint (réseau, serveur éteint…). */
  get horsLigne() {
    return this.statut === 0;
  }
}

let jeton: string | null = null;
let surNonAutorise: (() => void) | null = null;

/** Appelé par la session : jeton courant + action si le serveur répond 401. */
export function configurerApi(token: string | null, onNonAutorise: (() => void) | null) {
  jeton = token;
  surNonAutorise = onNonAutorise;
}

const LIBELLES_CHAMPS: Record<string, string> = {
  email: 'Email',
  pseudo: 'Pseudo',
  mot_de_passe: 'Mot de passe',
  nouveau: 'Nouveau mot de passe',
  nom: 'Nom',
  couleur: 'Couleur',
  saisons: 'Saisons',
};

function messageErreur(corps: unknown, statut: number): string {
  const detail = (corps as { detail?: unknown })?.detail;
  if (typeof detail === 'string') return detail;
  // Erreurs de validation FastAPI : liste de { loc, msg }
  if (Array.isArray(detail) && detail.length > 0) {
    const champ = String(detail[0].loc?.at(-1) ?? '');
    const libelle = LIBELLES_CHAMPS[champ];
    if (champ === 'email') return 'Adresse email invalide';
    return libelle ? `${libelle} : valeur invalide` : 'Certaines informations sont invalides';
  }
  if (statut >= 500) return 'Le serveur a rencontré un problème, réessaie dans un instant';
  return `Erreur (${statut})`;
}

async function requete<T>(chemin: string, options: RequestInit = {}): Promise<T> {
  const estJson = typeof options.body === 'string';
  let reponse: Response;
  try {
    reponse = await fetch(`${URL_API}${chemin}`, {
      ...options,
      headers: {
        ...(estJson ? { 'Content-Type': 'application/json' } : {}),
        ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ErreurApi('Serveur injoignable. Vérifie ta connexion.', 0);
  }

  if (reponse.status === 204) return undefined as T;
  const corps = await reponse.json().catch(() => null);
  if (!reponse.ok) {
    if (reponse.status === 401 && jeton) surNonAutorise?.();
    throw new ErreurApi(messageErreur(corps, reponse.status), reponse.status);
  }
  return corps as T;
}

const json = (methode: string, corps: unknown): RequestInit => ({
  method: methode,
  body: JSON.stringify(corps),
});

function query(params: Record<string, string | number | undefined>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
}

async function formulairePhoto(photo: PhotoLocale): Promise<FormData> {
  const form = new FormData();
  const nom = photo.fileName ?? 'photo.jpg';
  if (Platform.OS === 'web') {
    const blob = await (await fetch(photo.uri)).blob();
    form.append('fichier', blob, nom);
  } else {
    // React Native accepte cet objet { uri, name, type } comme fichier
    form.append('fichier', {
      uri: photo.uri,
      name: nom,
      type: photo.mimeType ?? 'image/jpeg',
    } as unknown as Blob);
  }
  return form;
}

export const api = {
  inscription: (email: string, pseudo: string, mot_de_passe: string) =>
    requete<Session>('/auth/inscription', json('POST', { email, pseudo, mot_de_passe })),
  connexion: (email: string, mot_de_passe: string) =>
    requete<Session>('/auth/connexion', json('POST', { email, mot_de_passe })),
  moi: () => requete<Utilisateur>('/auth/moi'),
  changerMotDePasse: (actuel: string, nouveau: string) =>
    requete<Session>('/auth/mot-de-passe', json('PUT', { actuel, nouveau })),
  supprimerCompte: () => requete<void>('/auth/moi', { method: 'DELETE' }),

  vetements: () => requete<Vetement[]>('/vetements'),
  vetement: (id: string) => requete<Vetement>(`/vetements/${id}`),
  ajouterVetement: (v: VetementSaisie) => requete<Vetement>('/vetements', json('POST', v)),
  modifierVetement: (id: string, v: Partial<VetementSaisie>) =>
    requete<Vetement>(`/vetements/${id}`, json('PATCH', v)),
  supprimerVetement: (id: string) => requete<void>(`/vetements/${id}`, { method: 'DELETE' }),
  envoyerPhoto: async (id: string, photo: PhotoLocale) =>
    requete<Vetement>(`/vetements/${id}/photo`, {
      method: 'PUT',
      body: await formulairePhoto(photo),
    }),
  retirerPhoto: (id: string) => requete<Vetement>(`/vetements/${id}/photo`, { method: 'DELETE' }),

  tenues: (filtres: { saison?: Saison; formalite?: number; nombre?: number } = {}) =>
    requete<Tenue[]>(`/tenues${query(filtres)}`),
  favoris: () => requete<Favori[]>('/favoris'),
  ajouterFavori: (vetement_ids: string[]) =>
    requete<Favori>('/favoris', json('POST', { vetement_ids })),
  retirerFavori: (id: string) => requete<void>(`/favoris/${id}`, { method: 'DELETE' }),
  historique: (limite?: number) => requete<Port[]>(`/portes${query({ limite })}`),
  porter: (vetement_ids: string[]) => requete<Port>('/portes', json('POST', { vetement_ids })),
  annulerPort: (id: string) => requete<void>(`/portes/${id}`, { method: 'DELETE' }),

  styles: () => requete<PartStyle[]>('/styles'),
  suggestions: () => requete<Suggestion[]>('/suggestions'),
};
