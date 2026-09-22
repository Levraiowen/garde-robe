import type { Saison } from './types';

/** Saison actuelle (hémisphère nord). */
export function saisonActuelle(date = new Date()): Saison {
  const m = date.getMonth(); // 0 = janvier
  if (m >= 2 && m <= 4) return 'printemps';
  if (m >= 5 && m <= 7) return 'ete';
  if (m >= 8 && m <= 10) return 'automne';
  return 'hiver';
}

/** « aujourd'hui », « hier », « il y a 3 jours », « le 12 mars ». */
export function dateRelative(iso: string): string {
  const date = new Date(iso);
  const minuit = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const jours = Math.round((minuit(new Date()) - minuit(date)) / 86_400_000);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return 'hier';
  if (jours < 7) return `il y a ${jours} jours`;
  return `le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
}
