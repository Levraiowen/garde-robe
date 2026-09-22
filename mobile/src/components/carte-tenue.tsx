// Carte d'une tenue : aperçu « à plat » des pièces, détail, et actions (favori, je la porte).
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { LigneVetement, Visuel } from '@/components/carte-vetement';
import { Bouton, BoutonIcone, Carte, Separateur, Texte } from '@/components/ui';
import { Espace, Palette as c } from '@/constants/theme';
import type { Vetement } from '@/lib/types';

export function CarteTenue({
  titre,
  sousTitre,
  pieces,
  favori,
  onFavori,
  onPorter,
  enPorte = false,
  detail,
  vedette = false,
}: {
  titre: string;
  sousTitre?: string;
  pieces: Vetement[];
  favori?: boolean;
  onFavori?: () => void;
  onPorter?: () => void;
  enPorte?: boolean;
  detail?: ReactNode;
  vedette?: boolean;
}) {
  const ouvrir = (id: string) => router.push({ pathname: '/vetement/[id]', params: { id } });

  return (
    <Carte style={vedette && styles.vedette}>
      <View style={styles.entete}>
        <View style={{ flex: 1, gap: 2 }}>
          <Texte variante={vedette ? 'titre' : 'sousTitre'}>{titre}</Texte>
          {sousTitre && (
            <Texte variante="label" style={{ color: c.accent }}>
              {sousTitre}
            </Texte>
          )}
        </View>
        {onFavori && (
          <BoutonIcone
            icone={favori ? 'heart' : 'heart-outline'}
            libelle={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            actif={favori}
            couleur={favori ? c.accent : c.texte}
            onPress={onFavori}
          />
        )}
      </View>

      {/* Aperçu « à plat » */}
      <View style={styles.apercu}>
        {pieces.map((p) => (
          <View key={p.id} style={{ flex: 1 }}>
            <Visuel vetement={p} style={{ aspectRatio: 3 / 4 }} />
          </View>
        ))}
      </View>

      <Separateur />
      {pieces.map((p) => (
        <LigneVetement key={p.id} vetement={p} onPress={() => ouvrir(p.id)} />
      ))}
      {detail}
      {onPorter && (
        <Bouton
          titre="Je la porte aujourd'hui"
          icone="checkmark"
          variante={vedette ? 'primaire' : 'secondaire'}
          chargement={enPorte}
          onPress={onPorter}
        />
      )}
    </Carte>
  );
}

const styles = StyleSheet.create({
  vedette: { borderColor: c.accent, borderWidth: 1 },
  entete: { flexDirection: 'row', alignItems: 'flex-start', gap: Espace.s },
  apercu: { flexDirection: 'row', gap: Espace.s },
});
