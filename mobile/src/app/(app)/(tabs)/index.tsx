import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { VignetteVetement } from '@/components/carte-vetement';
import { Bouton, Chargement, EtatVide, MessageErreur, Onglets, Texte } from '@/components/ui';
import { Espace, Palette as c } from '@/constants/theme';
import { CATEGORIES } from '@/constants/vetements';
import { api } from '@/lib/api';
import { useDonnees } from '@/lib/hooks';
import type { Categorie } from '@/lib/types';

type Filtre = Categorie | 'tout';

export default function GardeRobe() {
  const { donnees: vetements, erreur, chargement, recharger } = useDonnees(api.vetements);
  const [filtre, setFiltre] = useState<Filtre>('tout');

  if (chargement && !vetements && !erreur) return <Chargement />;

  if (vetements?.length === 0) {
    return (
      <View style={styles.plein}>
        <EtatVide
          titre="Ta garde-robe est vide"
          message="Ajoute tes vêtements pour que l'app compose tes tenues."
          action={
            <Bouton titre="Ajouter un vêtement" onPress={() => router.push('/vetement/nouveau')} />
          }
        />
      </View>
    );
  }

  const liste = vetements ?? [];
  const onglets: { valeur: Filtre; libelle: string }[] = [
    { valeur: 'tout', libelle: 'Tout' },
    ...CATEGORIES.filter((cat) => liste.some((v) => v.categorie === cat.valeur)),
  ];
  const affiches = liste.filter((v) => filtre === 'tout' || v.categorie === filtre);

  return (
    <View style={{ flex: 1, backgroundColor: c.fond }}>
      <Onglets options={onglets} valeur={filtre} onChange={setFiltre} />
      <ScrollView
        contentContainerStyle={styles.contenu}
        refreshControl={<RefreshControl refreshing={chargement} onRefresh={recharger} />}>
        <MessageErreur message={erreur} />
        <Texte variante="label" style={styles.compteur}>
          {affiches.length} pièce{affiches.length > 1 ? 's' : ''}
        </Texte>
        <View style={styles.grille}>
          {affiches.map((v) => (
            <VignetteVetement
              key={v.id}
              vetement={v}
              onPress={() => router.push({ pathname: '/vetement/[id]', params: { id: v.id } })}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  plein: { flex: 1, justifyContent: 'center', backgroundColor: c.fond, padding: Espace.m },
  contenu: { padding: Espace.s, paddingBottom: Espace.xl },
  compteur: { paddingHorizontal: Espace.s, paddingVertical: Espace.s },
  grille: { flexDirection: 'row', flexWrap: 'wrap' },
});
