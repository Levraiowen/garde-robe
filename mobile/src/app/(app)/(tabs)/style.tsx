import * as WebBrowser from 'expo-web-browser';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Bouton, Carte, EtatVide, MessageErreur, Section, Texte } from '@/components/ui';
import { Espace, Palette as c } from '@/constants/theme';
import { api } from '@/lib/api';
import { useDonnees } from '@/lib/hooks';

export default function MonStyle() {
  const { donnees, erreur, chargement, recharger } = useDonnees(async () => {
    const [profil, suggestions] = await Promise.all([api.styles(), api.suggestions()]);
    return { profil, suggestions };
  });

  return (
    <ScrollView
      style={{ backgroundColor: c.fond }}
      contentContainerStyle={styles.contenu}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={recharger} />}>
      <MessageErreur message={erreur} />

      {donnees?.profil.length === 0 && (
        <EtatVide
          titre="Pas encore de profil"
          message="Ajoute des styles à tes vêtements (casual, chic…) pour découvrir tes styles dominants."
        />
      )}

      {!!donnees?.profil.length && (
        <View style={{ gap: Espace.s }}>
          <Texte variante="label">Ton style</Texte>
          <Texte variante="titre" style={{ textTransform: 'capitalize' }}>
            {donnees.profil[0].style}
          </Texte>
          {donnees.profil.length > 1 && (
            <Texte variante="doux">
              avec une touche{' '}
              {donnees.profil
                .slice(1, 3)
                .map((p) => p.style)
                .join(' & ')}
            </Texte>
          )}
        </View>
      )}

      {!!donnees?.profil.length && (
        <Section titre="Répartition">
          <View style={{ gap: Espace.m }}>
            {donnees.profil.map(({ style, part }) => (
              <View key={style} style={{ gap: 6 }}>
                <View style={styles.ligneStyle}>
                  <Texte style={{ textTransform: 'capitalize' }}>{style}</Texte>
                  <Texte variante="petit">{Math.round(part * 100)} %</Texte>
                </View>
                <View style={styles.barre}>
                  <View style={[styles.remplissage, { width: `${part * 100}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </Section>
      )}

      {!!donnees?.suggestions.length && (
        <Section titre="Pour compléter ta garde-robe">
          {donnees.suggestions.map((s) => (
            <Carte key={`${s.style}-${s.categorie}`}>
              <Texte variante="marque">{s.style}</Texte>
              <Texte>{s.raison}</Texte>
              <View style={styles.liens}>
                {Object.entries(s.liens).map(([site, url]) => (
                  <Bouton
                    key={site}
                    titre={site}
                    variante="secondaire"
                    onPress={() => WebBrowser.openBrowserAsync(url)}
                    style={styles.lien}
                  />
                ))}
              </View>
            </Carte>
          ))}
        </Section>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: Espace.m, gap: Espace.xl, paddingBottom: Espace.xl },
  ligneStyle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  barre: { height: 3, backgroundColor: c.accentDoux, borderRadius: 2, overflow: 'hidden' },
  remplissage: { height: '100%', backgroundColor: c.accent },
  liens: { flexDirection: 'row', flexWrap: 'wrap', gap: Espace.s },
  lien: { minHeight: 36, paddingHorizontal: Espace.m, flexGrow: 1 },
});
