import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { FormulaireVetement } from '@/components/formulaire-vetement';
import { Bouton, Chargement, Ecran, MessageErreur } from '@/components/ui';
import { api } from '@/lib/api';
import { confirmer, messageDe, useDonnees } from '@/lib/hooks';

export default function ModifierVetement() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donnees: vetement, erreur } = useDonnees(() => api.vetement(id));
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);

  if (erreur) {
    return (
      <Ecran>
        <MessageErreur message={erreur} />
      </Ecran>
    );
  }
  if (!vetement) return <Chargement />;

  const supprimer = async () => {
    const ok = await confirmer(
      'Supprimer ce vêtement ?',
      `« ${vetement.nom} » sera retiré de ta garde-robe.`,
      'Supprimer',
    );
    if (!ok) return;
    try {
      await api.supprimerVetement(vetement.id);
      router.back();
    } catch (e) {
      setErreurSuppression(messageDe(e));
    }
  };

  return (
    <FormulaireVetement
      // key : réinitialise le formulaire si on arrive sur un autre vêtement
      key={vetement.id}
      initial={vetement}
      titreBouton="Enregistrer"
      onValider={async (v) => {
        await api.modifierVetement(vetement.id, v);
        router.back();
      }}>
      <MessageErreur message={erreurSuppression} />
      <Bouton titre="Supprimer ce vêtement" variante="danger" onPress={supprimer} />
    </FormulaireVetement>
  );
}
