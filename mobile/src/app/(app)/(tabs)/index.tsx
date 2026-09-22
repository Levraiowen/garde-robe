import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { VignetteVetement } from '@/components/carte-vetement';
import {
  Bouton,
  BoutonIcone,
  Chargement,
  EtatErreur,
  EtatVide,
  MessageErreur,
  Onglets,
  Texte,
} from '@/components/ui';
import { Espace, Palette as c, Rayon } from '@/constants/theme';
import { CATEGORIES, libelleCategorie } from '@/constants/vetements';
import { api } from '@/lib/api';
import { useDonnees } from '@/lib/hooks';
import type { Categorie, Vetement } from '@/lib/types';

type Filtre = Categorie | 'tout';

function correspond(v: Vetement, recherche: string): boolean {
  if (!recherche) return true;
  const texte = [v.nom, v.marque, v.couleur, libelleCategorie(v.categorie), ...v.styles]
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  return recherche
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .split(/\s+/)
    .every((mot) => texte.includes(mot));
}

export default function GardeRobe() {
  const { width } = useWindowDimensions();
  const { donnees: vetements, erreur, chargement, recharger } = useDonnees(api.vetements);
  const [filtre, setFiltre] = useState<Filtre>('tout');
  const [recherche, setRecherche] = useState('');

  if (!vetements && erreur) return <EtatErreur message={erreur} onReessayer={recharger} />;
  if (!vetements) return <Chargement />;

  if (vetements.length === 0) {
    return (
      <View style={styles.plein}>
        <EtatVide
          icone="shirt-outline"
          titre="Ta garde-robe est vide"
          message="Ajoute quelques pièces (un haut, un bas et des chaussures suffisent) pour que l'app compose tes premières tenues."
          action={
            <Bouton
              titre="Ajouter un vêtement"
              icone="add"
              onPress={() => router.push('/vetement/nouveau')}
            />
          }
        />
      </View>
    );
  }

  const colonnes = width >= 1000 ? 5 : width >= 700 ? 4 : width >= 480 ? 3 : 2;
  const largeur = `${100 / colonnes}%` as const;
  const onglets: { valeur: Filtre; libelle: string }[] = [
    { valeur: 'tout', libelle: 'Tout' },
    ...CATEGORIES.filter((cat) => vetements.some((v) => v.categorie === cat.valeur)),
  ];
  // Si la catégorie filtrée n'existe plus (dernier vêtement supprimé), on revient sur « Tout »
  const filtreActif = onglets.some((o) => o.valeur === filtre) ? filtre : 'tout';
  const affiches = vetements.filter(
    (v) => (filtreActif === 'tout' || v.categorie === filtreActif) && correspond(v, recherche),
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.fond }}>
      <Onglets options={onglets} valeur={filtreActif} onChange={setFiltre} />
      <ScrollView
        contentContainerStyle={styles.contenu}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={chargement} onRefresh={recharger} />}>
        <MessageErreur message={erreur} />
        {vetements.length > 6 && (
          <View style={styles.recherche}>
            <Ionicons name="search" size={18} color={c.texteDoux} />
            <TextInput
              value={recherche}
              onChangeText={setRecherche}
              placeholder="Rechercher (nom, marque, couleur, style…)"
              placeholderTextColor={c.texteDoux}
              accessibilityLabel="Rechercher un vêtement"
              style={styles.champRecherche}
              returnKeyType="search"
              autoCorrect={false}
            />
            {!!recherche && (
              <BoutonIcone
                icone="close-circle"
                libelle="Effacer la recherche"
                taille={18}
                couleur={c.texteDoux}
                onPress={() => setRecherche('')}
              />
            )}
          </View>
        )}
        <Texte variante="label" style={styles.compteur}>
          {affiches.length} pièce{affiches.length > 1 ? 's' : ''}
        </Texte>
        {affiches.length === 0 ? (
          <EtatVide
            icone="search"
            titre="Aucun résultat"
            message="Aucun vêtement ne correspond à ta recherche."
            action={
              <Bouton
                titre="Effacer les filtres"
                variante="secondaire"
                onPress={() => {
                  setRecherche('');
                  setFiltre('tout');
                }}
              />
            }
          />
        ) : (
          <View style={styles.grille}>
            {affiches.map((v) => (
              <VignetteVetement
                key={v.id}
                vetement={v}
                largeur={largeur}
                onPress={() => router.push({ pathname: '/vetement/[id]', params: { id: v.id } })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  plein: { flex: 1, justifyContent: 'center', backgroundColor: c.fond, padding: Espace.m },
  contenu: {
    padding: Espace.s,
    paddingBottom: Espace.xl,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  recherche: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.s,
    marginHorizontal: Espace.s,
    marginTop: Espace.s,
    paddingLeft: Espace.m,
    borderRadius: Rayon.rond,
    backgroundColor: c.surfaceAlt,
  },
  champRecherche: { flex: 1, minHeight: 44, fontSize: 15, color: c.texte },
  compteur: { paddingHorizontal: Espace.s, paddingVertical: Espace.s },
  grille: { flexDirection: 'row', flexWrap: 'wrap' },
});
