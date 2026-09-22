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

type ContexteSession = {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  connexion: (email: string, motDePasse: string) => Promise<void>;
  inscription: (email: string, pseudo: string, motDePasse: string) => Promise<void>;
  deconnexion: () => Promise<void>;
  supprimerCompte: () => Promise<void>;
};

const Contexte = createContext<ContexteSession | null>(null);

export function useSession(): ContexteSession {
  const valeur = use(Contexte);
  if (!valeur) throw new Error('useSession doit être utilisé dans <SessionProvider>');
  return valeur;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  const deconnexion = useCallback(async () => {
    configurerApi(null, null);
    setUtilisateur(null);
    await ecrire(CLE_JETON, null);
  }, []);

  const ouvrir = useCallback(
    async (token: string, u: Utilisateur) => {
      configurerApi(token, () => void deconnexion());
      await ecrire(CLE_JETON, token);
      setUtilisateur(u);
    },
    [deconnexion],
  );

  // Au démarrage : on reprend le jeton mémorisé et on vérifie qu'il est encore valide.
  useEffect(() => {
    (async () => {
      const token = await lire(CLE_JETON);
      if (token) {
        configurerApi(token, () => void deconnexion());
        try {
          setUtilisateur(await api.moi());
        } catch (e) {
          // Jeton expiré → on oublie la session. Serveur injoignable → idem pour l'instant
          // (pas de mode hors-ligne) mais on garde le jeton pour le prochain lancement.
          if (e instanceof ErreurApi && e.statut === 401) await ecrire(CLE_JETON, null);
          configurerApi(null, null);
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
    deconnexion,
    supprimerCompte: async () => {
      await api.supprimerCompte();
      await deconnexion();
    },
  };

  return <Contexte value={valeur}>{children}</Contexte>;
}
