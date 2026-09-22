import { router } from 'expo-router';

import { FormulaireVetement } from '@/components/formulaire-vetement';
import { api } from '@/lib/api';

export default function NouveauVetement() {
  return (
    <FormulaireVetement
      titreBouton="Ajouter à ma garde-robe"
      onValider={async (v) => {
        await api.ajouterVetement(v);
        router.back();
      }}
    />
  );
}
