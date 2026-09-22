import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { LigneVetement, Visuel } from '@/components/carte-vetement';
import {
  Carte,
  Chargement,
  EtatVide,
  GroupePuces,
  MessageErreur,
  Onglets,
  Puce,
  Separateur,
  Texte,
} from '@/components/ui';
import { Espace, Palette as c } from '@/constants/theme';
import { FORMALITES, SAISONS } from '@/constants/vetements';
import { api } from '@/lib/api';
import { useDonnees } from '@/lib/hooks';
import type { Saison } from '@/lib/types';

type FiltreSaison = Saison | 'toutes';

export default function Tenues() {
  const [saison, setSaison] = useState<FiltreSaison>('toutes');
  const [formalite, setFormalite] = useState<number | undefined>();
  const {
    donnees: tenues,
    erreur,
    chargement,
    recharger,
  } = useDonnees(() =>
    api.tenues({ saison: saison === 'toutes' ? undefined : saison, formalite, nombre: 15 }),
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.fond }}>
      <Onglets
        options={[{ valeur: 'toutes', libelle: 'Toutes saisons' }, ...SAISONS]}
        valeur={saison}
        onChange={setSaison}
      />
      <ScrollView
        contentContainerStyle={styles.contenu}
        refreshControl={<RefreshControl refreshing={chargement} onRefresh={recharger} />}>
        <GroupePuces>
          <Puce
            libelle="Toutes occasions"
            selectionnee={!formalite}
            onPress={() => setFormalite(undefined)}
          />
          {FORMALITES.map((f) => (
            <Puce
              key={f.valeur}
              libelle={f.libelle}
              selectionnee={formalite === f.valeur}
              onPress={() => setFormalite(f.valeur)}
            />
          ))}
        </GroupePuces>

        <MessageErreur message={erreur} />
        {!tenues && chargement && <Chargement />}
        {tenues?.length === 0 && (
          <EtatVide
            titre="Aucune tenue possible"
            message="Il faut au moins un haut, un bas et des chaussures (ou une robe et des chaussures) adaptés à ces filtres."
          />
        )}

        {tenues?.map((tenue, i) => (
          <Carte key={tenue.pieces.map((p) => p.id).join('-')}>
            <View style={styles.entete}>
              <Texte variante="sousTitre">Tenue {i + 1}</Texte>
              <Texte variante="label" style={{ color: c.accent }}>
                Harmonie {Math.round(tenue.score * 100)} %
              </Texte>
            </View>
            {/* Aperçu « à plat » des pièces */}
            <View style={styles.apercu}>
              {tenue.pieces.map((p) => (
                <View key={p.id} style={{ flex: 1 }}>
                  <Visuel vetement={p} taille={72} />
                </View>
              ))}
            </View>
            <Separateur />
            {tenue.pieces.map((p) => (
              <LigneVetement key={p.id} vetement={p} />
            ))}
            <Texte variante="petit">{tenue.raisons.join('  ·  ')}</Texte>
          </Carte>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: Espace.m, gap: Espace.m, paddingBottom: Espace.xl },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  apercu: { flexDirection: 'row', gap: Espace.s },
});
