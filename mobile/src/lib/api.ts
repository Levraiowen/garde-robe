// Client HTTP de l'API Garde-Robe.
import Constants from 'expo-constants';

import type {
  PartStyle,
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

export class ErreurApi extends Error {
  constructor(
    message: string,
    public statut: number,
  ) {
    super(message);
  }
}

let jeton: string | null = null;
let surNonAutorise: (() => void) | null = null;

/** Appelé par la session : jeton courant + action si le serveur répond 401. */
export function configurerApi(token: string | null, onNonAutorise: (() => void) | null) {
  jeton = token;
  surNonAutorise = onNonAutorise;
}

function messageErreur(corps: unknown, statut: number): string {
  const detail = (corps as { detail?: unknown })?.detail;
  if (typeof detail === 'string') return detail;
  // Erreurs de validation FastAPI : liste de { loc, msg }
  if (Array.isArray(detail) && detail.length > 0) {
    const champ = detail[0].loc?.at(-1);
    return champ ? `${champ} : ${detail[0].msg}` : detail[0].msg;
  }
  return `Erreur serveur (${statut})`;
}

async function requete<T>(chemin: string, options: RequestInit = {}): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(`${URL_API}${chemin}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ErreurApi(`Impossible de joindre le serveur (${URL_API})`, 0);
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

export const api = {
  inscription: (email: string, pseudo: string, mot_de_passe: string) =>
    requete<Session>('/auth/inscription', json('POST', { email, pseudo, mot_de_passe })),
  connexion: (email: string, mot_de_passe: string) =>
    requete<Session>('/auth/connexion', json('POST', { email, mot_de_passe })),
  moi: () => requete<Utilisateur>('/auth/moi'),
  supprimerCompte: () => requete<void>('/auth/moi', { method: 'DELETE' }),

  vetements: () => requete<Vetement[]>('/vetements'),
  vetement: (id: string) => requete<Vetement>(`/vetements/${id}`),
  ajouterVetement: (v: VetementSaisie) => requete<Vetement>('/vetements', json('POST', v)),
  modifierVetement: (id: string, v: Partial<VetementSaisie>) =>
    requete<Vetement>(`/vetements/${id}`, json('PATCH', v)),
  supprimerVetement: (id: string) => requete<void>(`/vetements/${id}`, { method: 'DELETE' }),

  tenues: (filtres: { saison?: Saison; formalite?: number; nombre?: number } = {}) =>
    requete<Tenue[]>(`/tenues${query(filtres)}`),
  styles: () => requete<PartStyle[]>('/styles'),
  suggestions: () => requete<Suggestion[]>('/suggestions'),
};
