// Identité visuelle : épurée, sobre, « luxe » — blanc cassé, marron, noir chaud.
import { DefaultTheme, type Theme } from 'expo-router';
import { Platform } from 'react-native';

export const Palette = {
  fond: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F6F2EC', // crème : vignettes, champs
  texte: '#1C1714', // noir chaud
  texteDoux: '#8C8078',
  bordure: '#ECE5DC',
  accent: '#6B4A36', // marron
  accentDoux: '#EFE6DC',
  encre: '#1C1714', // boutons principaux (pilule noire, comme les apps de mode)
  surEncre: '#FFFFFF',
  erreur: '#A23B2A',
} as const;

/** Thème unique (clair) pour l'instant : l'identité blanc/marron est au cœur du design. */
export function useThemeNavigation(): Theme {
  return {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: Palette.texte,
      background: Palette.fond,
      card: Palette.fond,
      text: Palette.texte,
      border: Palette.bordure,
    },
  };
}

export const Polices = {
  // Serif pour les titres : touche éditoriale / luxe, sans police à télécharger.
  titre: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia, "Times New Roman", serif',
  }),
};

export const Espace = { xs: 4, s: 8, m: 16, l: 24, xl: 32 } as const;
export const Rayon = { s: 6, m: 12, l: 20, rond: 999 } as const;
