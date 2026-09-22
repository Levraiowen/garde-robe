// Affichage d'un vêtement : visuel (photo ou couleur), vignette de grille, ligne compacte.
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { PastilleCouleur, Texte } from '@/components/ui';
import { Espace, Palette as c } from '@/constants/theme';
import { libelleCategorie } from '@/constants/vetements';
import { urlMedia } from '@/lib/api';
import type { Vetement } from '@/lib/types';

/** Photo du vêtement, ou grande pastille de sa couleur sur fond crème s'il n'en a pas. */
export function Visuel({
  vetement,
  style,
  uriLocale,
}: {
  vetement: Pick<Vetement, 'couleur' | 'image' | 'nom'>;
  style?: StyleProp<ViewStyle>;
  uriLocale?: string | null;
}) {
  const source = uriLocale ?? urlMedia(vetement.image);
  return (
    <View style={[styles.visuel, style]}>
      {source ? (
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          accessibilityLabel={`Photo : ${vetement.nom}`}
        />
      ) : (
        <View style={styles.pastille}>
          <PastilleCouleur couleur={vetement.couleur} taille={40} />
        </View>
      )}
    </View>
  );
}

export function sousTitreVetement(v: Vetement): string {
  return v.marque || libelleCategorie(v.categorie);
}

export function VignetteVetement({
  vetement,
  onPress,
  largeur,
}: {
  vetement: Vetement;
  onPress: () => void;
  largeur: `${number}%`;
}) {
  return (
    <Pressable
      role="button"
      aria-label={`${vetement.nom}, ${libelleCategorie(vetement.categorie)}, ${vetement.couleur}`}
      onPress={onPress}
      style={({ pressed }) => [styles.vignette, { width: largeur }, pressed && { opacity: 0.7 }]}>
      <Visuel vetement={vetement} style={{ aspectRatio: 3 / 4 }} />
      <View style={styles.legende}>
        <Texte variante="marque" lignes={1}>
          {sousTitreVetement(vetement)}
        </Texte>
        <Texte lignes={1}>{vetement.nom}</Texte>
      </View>
    </Pressable>
  );
}

export function LigneVetement({ vetement, onPress }: { vetement: Vetement; onPress?: () => void }) {
  return (
    <Pressable
      role={onPress ? 'button' : undefined}
      aria-label={onPress ? `Voir ${vetement.nom}` : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.ligne, pressed && { opacity: 0.6 }]}>
      <Visuel vetement={vetement} style={styles.miniature} />
      <View style={{ flex: 1 }}>
        <Texte variante="marque">{sousTitreVetement(vetement)}</Texte>
        <Texte lignes={1}>{vetement.nom}</Texte>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  visuel: {
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    overflow: 'hidden',
  },
  pastille: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vignette: { padding: Espace.s, gap: Espace.s },
  legende: { gap: 2, paddingHorizontal: 2 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: Espace.m },
  miniature: { width: 48, height: 60 },
});
