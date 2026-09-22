import { router, useLocalSearchParams } from 'expo-router';

import { FormulaireVetement } from '@/components/formulaire-vetement';
import { useToast } from '@/components/toast';
import { Chargement, EtatErreur } from '@/components/ui';
import { api } from '@/lib/api';
import { messageDe, useDonnees, vibrer } from '@/lib/hooks';
import type { Vetement } from '@/lib/types';

export default function NouveauVetement() {
  // ?copie=<id> : pré-remplit le formulaire à partir d'un vêtement existant (« Dupliquer »)
  const { copie } = useLocalSearchParams<{ copie?: string }>();
  const toast = useToast();
  const {
    donnees: modele,
    erreur,
    recharger,
  } = useDonnees<Vetement | null>(() => (copie ? api.vetement(copie) : Promise.resolve(null)));

  if (copie && erreur) return <EtatErreur message={erreur} onReessayer={recharger} />;
  if (copie && !modele) return <Chargement />;

  const initial = modele ? { ...modele, nom: `${modele.nom} (copie)`, image: null } : undefined;

  return (
    <FormulaireVetement
      key={modele?.id ?? 'nouveau'}
      initial={initial}
      titreBouton="Ajouter à ma garde-robe"
      onValider={async (saisie, photo) => {
        const cree = await api.ajouterVetement(saisie);
        let message = `« ${cree.nom} » ajouté`;
        if (photo.action === 'nouvelle') {
          try {
            await api.envoyerPhoto(cree.id, photo.photo);
          } catch (e) {
            // Le vêtement est créé : on ne bloque pas, on prévient simplement.
            message = `Vêtement ajouté, mais la photo n'a pas pu être envoyée (${messageDe(e)})`;
          }
        }
        vibrer('succes');
        toast(message);
        router.back();
      }}
    />
  );
}
