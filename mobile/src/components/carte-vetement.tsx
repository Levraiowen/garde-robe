// Affichage d'un vêtement : vignette de grille (garde-robe) ou ligne compacte (tenues).
import { Pressable, StyleSheet, View } from 'react-native';

import { PastilleCouleur, Texte } from '@/components/ui';
import { Espace, Palette as c } from '@/constants/theme';
import { libelleCategorie } from '@/constants/vetements';
import type { Vetement } from '@/lib/types';

/** Visuel du vêtement. En attendant les photos : grande pastille de sa couleur sur fond crème. */
export function Visuel({ vetement, taille }: { vetement: Vetement; taille: number }) {
  return (
    <View style={[styles.visuel, { height: taille }]}>
      <PastilleCouleur couleur={vetement.couleur} taille={taille * 0.38} />
    </View>
  );
}

export function VignetteVetement({
  vetement,
  onPress,
}: {
  vetement: Vetement;
  onPress: () => void;
}) {
  return (
    <Pressable
      role="button"
      aria-label={`${vetement.nom}, ${libelleCategorie(vetement.categorie)}, ${vetement.couleur}`}
      onPress={onPress}
      style={({ pressed }) => [styles.vignette, pressed && { opacity: 0.7 }]}>
      <Visuel vetement={vetement} taille={150} />
      <View style={styles.legende}>
        <Texte variante="marque" lignes={1}>
          {vetement.marque || libelleCategorie(vetement.categorie)}
        </Texte>
        <Texte lignes={1}>{vetement.nom}</Texte>
      </View>
    </Pressable>
  );
}

export function LigneVetement({ vetement }: { vetement: Vetement }) {
  return (
    <View style={styles.ligne}>
      <View style={styles.miniature}>
        <PastilleCouleur couleur={vetement.couleur} taille={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Texte variante="marque">{vetement.marque || libelleCategorie(vetement.categorie)}</Texte>
        <Texte lignes={1}>{vetement.nom}</Texte>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  visuel: {
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  vignette: { width: '50%', padding: Espace.s, gap: Espace.s },
  legende: { gap: 2, paddingHorizontal: 2 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: Espace.m },
  miniature: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
