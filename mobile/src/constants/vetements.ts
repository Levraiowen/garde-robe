// Listes de valeurs proposées dans les formulaires.
// Les couleurs doivent rester alignées avec backend/src/garde_robe/couleurs.py.
import type { Categorie, Saison } from '@/lib/types';

export const CATEGORIES: { valeur: Categorie; libelle: string }[] = [
  { valeur: 'haut', libelle: 'Haut' },
  { valeur: 'bas', libelle: 'Bas' },
  { valeur: 'robe', libelle: 'Robe / combi' },
  { valeur: 'veste', libelle: 'Veste / manteau' },
  { valeur: 'chaussures', libelle: 'Chaussures' },
  { valeur: 'accessoire', libelle: 'Accessoire' },
];

export const SAISONS: { valeur: Saison; libelle: string }[] = [
  { valeur: 'printemps', libelle: 'Printemps' },
  { valeur: 'ete', libelle: 'Été' },
  { valeur: 'automne', libelle: 'Automne' },
  { valeur: 'hiver', libelle: 'Hiver' },
];

export const COULEURS: Record<string, string> = {
  noir: '#1A1A1A',
  blanc: '#FFFFFF',
  gris: '#9A9A9A',
  beige: '#D8C8A8',
  creme: '#F3EBD8',
  ecru: '#EDE6D2',
  marine: '#1F2A4A',
  denim: '#4A6A94',
  camel: '#C19A6B',
  marron: '#6B4430',
  kaki: '#78745A',
  taupe: '#8B7D72',
  rouge: '#C62828',
  bordeaux: '#6D1A2A',
  rose: '#E89AB0',
  orange: '#E67E22',
  moutarde: '#D4A017',
  jaune: '#F2D03B',
  vert: '#3E7D4A',
  turquoise: '#2BB3A6',
  bleu: '#2E6FD8',
  violet: '#7B4EA3',
};

export const STYLES_PROPOSES = [
  'casual',
  'chic',
  'streetwear',
  'minimaliste',
  'sport',
  'preppy',
  'bohème',
  'vintage',
  'rock',
  'workwear',
];

export const FORMALITES = [
  { valeur: 1, libelle: 'Très détente' },
  { valeur: 2, libelle: 'Décontracté' },
  { valeur: 3, libelle: 'Soigné' },
  { valeur: 4, libelle: 'Habillé' },
  { valeur: 5, libelle: 'Très habillé' },
];

export const libelleCategorie = (c: Categorie) =>
  CATEGORIES.find((x) => x.valeur === c)?.libelle ?? c;
