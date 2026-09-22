import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormulaireVetement } from '@/components/formulaire-vetement';
import { useToast } from '@/components/toast';
import { Bouton, Chargement, EtatErreur, MessageErreur, Separateur, Texte } from '@/components/ui';
import { Espace } from '@/constants/theme';
import { api } from '@/lib/api';
import { dateRelative } from '@/lib/dates';
import { confirmer, messageDe, useDonnees, vibrer } from '@/lib/hooks';

export default function ModifierVetement() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { donnees: vetement, erreur, recharger } = useDonnees(() => api.vetement(id));
  const [erreurAction, setErreurAction] = useState<string | null>(null);

  if (erreur && !vetement) return <EtatErreur message={erreur} onReessayer={recharger} />;
  if (!vetement) return <Chargement />;

  const supprimer = async () => {
    const ok = await confirmer(
      'Supprimer ce vêtement ?',
      `« ${vetement.nom} » sera retiré de ta garde-robe, ainsi que des tenues favorites qui le contiennent.`,
      'Supprimer',
    );
    if (!ok) return;
    try {
      await api.supprimerVetement(vetement.id);
      vibrer('succes');
      toast(`« ${vetement.nom} » supprimé`);
      router.back();
    } catch (e) {
      setErreurAction(messageDe(e));
    }
  };

  const usage =
    vetement.nb_ports > 0 && vetement.dernier_port
      ? `Porté ${vetement.nb_ports} fois · dernière fois ${dateRelative(vetement.dernier_port)}`
      : 'Pas encore porté';

  return (
    <FormulaireVetement
      // key : réinitialise le formulaire si on arrive sur un autre vêtement
      key={vetement.id}
      initial={vetement}
      titreBouton="Enregistrer"
      onValider={async (saisie, photo) => {
        await api.modifierVetement(vetement.id, saisie);
        if (photo.action === 'nouvelle') await api.envoyerPhoto(vetement.id, photo.photo);
        if (photo.action === 'retirer') await api.retirerPhoto(vetement.id);
        vibrer('succes');
        toast('Modifications enregistrées');
        router.back();
      }}>
      <Separateur />
      <View style={styles.zone}>
        <Texte variante="label">Utilisation</Texte>
        <Texte variante="doux">{usage}</Texte>
      </View>
      <MessageErreur message={erreurAction} />
      <View style={styles.actions}>
        <Bouton
          titre="Dupliquer"
          icone="copy-outline"
          variante="secondaire"
          onPress={() =>
            router.replace({ pathname: '/vetement/nouveau', params: { copie: vetement.id } })
          }
          style={{ flex: 1 }}
        />
        <Bouton
          titre="Supprimer"
          icone="trash-outline"
          variante="danger"
          onPress={supprimer}
          style={{ flex: 1 }}
        />
      </View>
    </FormulaireVetement>
  );
}

const styles = StyleSheet.create({
  zone: { gap: Espace.xs },
  actions: { flexDirection: 'row', gap: Espace.s },
});
