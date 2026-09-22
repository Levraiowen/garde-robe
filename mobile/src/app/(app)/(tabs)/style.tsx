import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { LigneVetement } from '@/components/carte-vetement';
import {
  Bouton,
  Carte,
  Chargement,
  EtatErreur,
  EtatVide,
  MessageErreur,
  PastilleCouleur,
  Section,
  Texte,
} from '@/components/ui';
import { Espace, LargeurMax, Palette as c } from '@/constants/theme';
import { api } from '@/lib/api';
import { useDonnees } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import type { Vetement } from '@/lib/types';

const JOURS_OUBLI = 30;

/**
 * Pièces pas portées depuis plus d'un mois (ou jamais), seulement si le compte a plus
 * d'un mois et qu'un historique existe — sinon l'information n'aurait pas de sens.
 */
function aRedecouvrir(vetements: Vetement[], compteCreeLe: string): Vetement[] {
  const limite = Date.now() - JOURS_OUBLI * 86_400_000;
  const compteAncien = new Date(compteCreeLe).getTime() < limite;
  if (!compteAncien || !vetements.some((v) => v.nb_ports > 0)) return [];
  return vetements
    .filter((v) => !v.dernier_port || new Date(v.dernier_port).getTime() < limite)
    .sort((a, b) => a.nb_ports - b.nb_ports)
    .slice(0, 5);
}

function couleursDominantes(vetements: Vetement[]): { couleur: string; part: number }[] {
  const compte = new Map<string, number>();
  for (const v of vetements) compte.set(v.couleur, (compte.get(v.couleur) ?? 0) + 1);
  return [...compte.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([couleur, n]) => ({ couleur, part: n / vetements.length }));
}

export default function MonStyle() {
  const { utilisateur } = useSession();
  const { donnees, erreur, chargement, recharger } = useDonnees(async () => {
    const [profil, suggestions, vetements] = await Promise.all([
      api.styles(),
      api.suggestions(),
      api.vetements(),
    ]);
    return { profil, suggestions, vetements };
  });

  if (!donnees && erreur) return <EtatErreur message={erreur} onReessayer={recharger} />;
  if (!donnees) return <Chargement />;

  const { profil, suggestions, vetements } = donnees;
  const oublies = utilisateur ? aRedecouvrir(vetements, utilisateur.cree_le) : [];
  const couleurs = couleursDominantes(vetements);

  return (
    <ScrollView
      style={{ backgroundColor: c.fond }}
      contentContainerStyle={styles.contenu}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={recharger} />}>
      <MessageErreur message={erreur} />

      {profil.length === 0 ? (
        <EtatVide
          icone="sparkles-outline"
          titre="Pas encore de profil"
          message="Indique le style de tes vêtements (casual, chic…) pour découvrir ton style dominant."
          action={
            vetements.length === 0 ? (
              <Bouton
                titre="Ajouter un vêtement"
                icone="add"
                onPress={() => router.push('/vetement/nouveau')}
              />
            ) : undefined
          }
        />
      ) : (
        <>
          <View style={{ gap: Espace.s }}>
            <Texte variante="label">Ton style</Texte>
            <Texte variante="titre" style={{ textTransform: 'capitalize' }}>
              {profil[0].style}
            </Texte>
            {profil.length > 1 && (
              <Texte variante="doux">
                avec une touche{' '}
                {profil
                  .slice(1, 3)
                  .map((p) => p.style)
                  .join(' & ')}
              </Texte>
            )}
          </View>

          <Section titre="Répartition">
            <View style={{ gap: Espace.m }}>
              {profil.map(({ style, part }) => (
                <View key={style} style={{ gap: 6 }}>
                  <View style={styles.ligne}>
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
        </>
      )}

      {couleurs.length > 0 && (
        <Section titre="Tes couleurs">
          <View style={styles.palette}>
            {couleurs.map(({ couleur, part }) => (
              <View key={couleur} style={styles.couleur}>
                <PastilleCouleur couleur={couleur} taille={40} />
                <Texte variante="petit" style={{ textTransform: 'capitalize' }}>
                  {couleur}
                </Texte>
                <Texte variante="marque">{Math.round(part * 100)} %</Texte>
              </View>
            ))}
          </View>
        </Section>
      )}

      {oublies.length > 0 && (
        <Section titre="À redécouvrir">
          <Texte variante="doux">
            Des pièces que tu n’as pas portées depuis plus d’un mois, voire jamais. Pense à elles !
          </Texte>
          <Carte>
            {oublies.map((v) => (
              <LigneVetement
                key={v.id}
                vetement={v}
                onPress={() => router.push({ pathname: '/vetement/[id]', params: { id: v.id } })}
              />
            ))}
          </Carte>
        </Section>
      )}

      {suggestions.length > 0 && (
        <Section titre="Pour compléter ta garde-robe">
          {suggestions.map((s) => (
            <Carte key={`${s.style}-${s.categorie}`}>
              <Texte variante="marque">{s.style}</Texte>
              <Texte>{s.raison}</Texte>
              <View style={styles.liens}>
                {Object.entries(s.liens).map(([site, url]) => (
                  <Bouton
                    key={site}
                    titre={site}
                    variante="secondaire"
                    icone="open-outline"
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
  contenu: {
    padding: Espace.m,
    gap: Espace.xl,
    paddingBottom: Espace.xl,
    width: '100%',
    maxWidth: LargeurMax,
    alignSelf: 'center',
  },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  barre: { height: 3, backgroundColor: c.accentDoux, borderRadius: 2, overflow: 'hidden' },
  remplissage: { height: '100%', backgroundColor: c.accent },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: Espace.m },
  couleur: { alignItems: 'center', gap: 4, width: 64 },
  liens: { flexDirection: 'row', flexWrap: 'wrap', gap: Espace.s },
  lien: { minHeight: 38, paddingHorizontal: Espace.m, flexGrow: 1 },
});
