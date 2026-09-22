// Session utilisateur : connexion, inscription, déconnexion, restauration au démarrage.
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { api, configurerApi, ErreurApi } from './api';
import { ecrire, lire } from './stockage';
import type { Utilisateur } from './types';

const CLE_JETON = 'garde-robe.jeton';
const CLE_UTILISATEUR = 'garde-robe.utilisateur';

type ContexteSession = {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  connexion: (email: string, motDePasse: string) => Promise<void>;
  inscription: (email: string, pseudo: string, motDePasse: string) => Promise<void>;
  changerMotDePasse: (actuel: string, nouveau: string) => Promise<void>;
  deconnexion: () => Promise<void>;
  supprimerCompte: () => Promise<void>;
};

const Contexte = createContext<ContexteSession | null>(null);

export function useSession(): ContexteSession {
  const valeur = use(Contexte);
  if (!valeur) throw new Error('useSession doit être utilisé dans <SessionProvider>');
  return valeur;
}

function lireUtilisateur(brut: string | null): Utilisateur | null {
  try {
    return brut ? (JSON.parse(brut) as Utilisateur) : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  const deconnexion = useCallback(async () => {
    configurerApi(null, null);
    setUtilisateur(null);
    await Promise.all([ecrire(CLE_JETON, null), ecrire(CLE_UTILISATEUR, null)]);
  }, []);

  const ouvrir = useCallback(
    async (token: string, u: Utilisateur) => {
      configurerApi(token, () => void deconnexion());
      await Promise.all([ecrire(CLE_JETON, token), ecrire(CLE_UTILISATEUR, JSON.stringify(u))]);
      setUtilisateur(u);
    },
    [deconnexion],
  );

  // Au démarrage : on reprend la session mémorisée et on vérifie qu'elle est encore valide.
  useEffect(() => {
    (async () => {
      const [token, memorise] = await Promise.all([lire(CLE_JETON), lire(CLE_UTILISATEUR)]);
      if (token) {
        configurerApi(token, () => void deconnexion());
        try {
          const u = await api.moi();
          await ecrire(CLE_UTILISATEUR, JSON.stringify(u));
          setUtilisateur(u);
        } catch (e) {
          if (e instanceof ErreurApi && e.horsLigne && lireUtilisateur(memorise)) {
            // Serveur injoignable : on reste connecté, les écrans proposeront de réessayer.
            setUtilisateur(lireUtilisateur(memorise));
          } else {
            await deconnexion();
          }
        }
      }
      setChargement(false);
    })();
  }, [deconnexion]);

  const valeur: ContexteSession = {
    utilisateur,
    chargement,
    connexion: async (email, motDePasse) => {
      const s = await api.connexion(email.trim(), motDePasse);
      await ouvrir(s.token, s.utilisateur);
    },
    inscription: async (email, pseudo, motDePasse) => {
      const s = await api.inscription(email.trim(), pseudo.trim(), motDePasse);
      await ouvrir(s.token, s.utilisateur);
    },
    changerMotDePasse: async (actuel, nouveau) => {
      const s = await api.changerMotDePasse(actuel, nouveau);
      await ouvrir(s.token, s.utilisateur);
    },
    deconnexion,
    supprimerCompte: async () => {
      await api.supprimerCompte();
      await deconnexion();
    },
  };

  return <Contexte value={valeur}>{children}</Contexte>;
}
