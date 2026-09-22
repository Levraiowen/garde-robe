// Composants d'interface réutilisables — style épuré blanc / marron.
import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Espace, Palette as c, Polices, Rayon } from '@/constants/theme';
import { COULEURS } from '@/constants/vetements';

// --- Mise en page --------------------------------------------------------------

export function Ecran({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <ScrollView
      style={{ backgroundColor: c.fond }}
      contentContainerStyle={[styles.ecran, style]}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Carte({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.carte, style]}>{children}</View>;
}

export function Separateur() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.bordure }} />;
}

// --- Texte ---------------------------------------------------------------------

type VarianteTexte = 'titre' | 'sousTitre' | 'normal' | 'doux' | 'petit' | 'label' | 'marque';

export function Texte({
  children,
  variante = 'normal',
  style,
  lignes,
}: PropsWithChildren<{ variante?: VarianteTexte; style?: StyleProp<TextStyle>; lignes?: number }>) {
  return (
    <Text numberOfLines={lignes} style={[styles[variante], style]}>
      {children}
    </Text>
  );
}

export function MessageErreur({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Text role="alert" style={[styles.petit, { color: c.erreur }]}>
      {message}
    </Text>
  );
}

// --- Actions -------------------------------------------------------------------

type VarianteBouton = 'primaire' | 'secondaire' | 'danger' | 'discret';

const STYLE_BOUTON: Record<VarianteBouton, { fond: string; texte: string; bordure?: string }> = {
  primaire: { fond: c.encre, texte: c.surEncre },
  secondaire: { fond: 'transparent', texte: c.texte, bordure: c.texte },
  danger: { fond: 'transparent', texte: c.erreur },
  discret: { fond: 'transparent', texte: c.accent },
};

export function Bouton({
  titre,
  onPress,
  variante = 'primaire',
  chargement = false,
  desactive = false,
  style,
}: {
  titre: string;
  onPress: () => void;
  variante?: VarianteBouton;
  chargement?: boolean;
  desactive?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = STYLE_BOUTON[variante];
  const inactif = desactive || chargement;

  return (
    <Pressable
      role="button"
      aria-label={titre}
      aria-disabled={inactif}
      aria-busy={chargement}
      disabled={inactif}
      onPress={onPress}
      style={({ pressed }) => [
        styles.bouton,
        { backgroundColor: v.fond, opacity: inactif ? 0.4 : pressed ? 0.75 : 1 },
        v.bordure && { borderWidth: 1, borderColor: v.bordure },
        style,
      ]}>
      {chargement ? (
        <ActivityIndicator color={v.texte} />
      ) : (
        <Text style={[styles.texteBouton, { color: v.texte }]}>{titre}</Text>
      )}
    </Pressable>
  );
}

export function Puce({
  libelle,
  selectionnee,
  onPress,
  prefixe,
}: {
  libelle: string;
  selectionnee: boolean;
  onPress: () => void;
  prefixe?: ReactNode;
}) {
  return (
    <Pressable
      role="button"
      aria-label={libelle}
      aria-selected={selectionnee}
      onPress={onPress}
      style={[
        styles.puce,
        {
          backgroundColor: selectionnee ? c.encre : c.fond,
          borderColor: selectionnee ? c.encre : c.bordure,
        },
      ]}>
      {prefixe}
      <Text style={[styles.textePuce, { color: selectionnee ? c.surEncre : c.texte }]}>
        {libelle}
      </Text>
    </Pressable>
  );
}

export function GroupePuces({ children }: PropsWithChildren) {
  return <View style={styles.groupePuces}>{children}</View>;
}

/** Onglets soulignés défilants (filtres : Tout, Hauts, Bas…). */
export function Onglets<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: { valeur: T; libelle: string }[];
  valeur: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.barreOnglets}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map((o) => {
          const actif = o.valeur === valeur;
          return (
            <Pressable
              key={o.valeur}
              role="tab"
              aria-selected={actif}
              aria-label={o.libelle}
              onPress={() => onChange(o.valeur)}
              style={[styles.onglet, actif && { borderBottomColor: c.encre }]}>
              <Text
                style={[
                  styles.texteOnglet,
                  { color: actif ? c.texte : c.texteDoux, fontWeight: actif ? '600' : '400' },
                ]}>
                {o.libelle}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// --- Formulaires ---------------------------------------------------------------

export function Champ({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.champ}>
      <Texte variante="label">{label}</Texte>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.texteDoux}
        style={styles.saisie}
        {...props}
      />
    </View>
  );
}

export function Section({ titre, children }: PropsWithChildren<{ titre: string }>) {
  return (
    <View style={styles.champ}>
      <Texte variante="label">{titre}</Texte>
      {children}
    </View>
  );
}

// --- Divers --------------------------------------------------------------------

export function PastilleCouleur({ couleur, taille = 14 }: { couleur: string; taille?: number }) {
  return (
    <View
      style={{
        width: taille,
        height: taille,
        borderRadius: taille / 2,
        backgroundColor: COULEURS[couleur] ?? c.surfaceAlt,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#00000022',
      }}
    />
  );
}

export function EtatVide({
  titre,
  message,
  action,
}: {
  titre: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.vide}>
      <Texte variante="sousTitre" style={{ textAlign: 'center' }}>
        {titre}
      </Texte>
      <Texte variante="doux" style={{ textAlign: 'center', maxWidth: 300 }}>
        {message}
      </Texte>
      {action && <View style={{ marginTop: Espace.m, alignSelf: 'stretch' }}>{action}</View>}
    </View>
  );
}

export function Chargement() {
  return (
    <View style={[styles.vide, { backgroundColor: c.fond, flex: 1 }]}>
      <ActivityIndicator color={c.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { padding: Espace.m, gap: Espace.l, flexGrow: 1, backgroundColor: c.fond },
  carte: {
    borderRadius: Rayon.m,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.bordure,
    backgroundColor: c.surface,
    padding: Espace.m,
    gap: Espace.m,
  },
  titre: { fontFamily: Polices.titre, fontSize: 30, lineHeight: 36, color: c.texte },
  sousTitre: { fontFamily: Polices.titre, fontSize: 20, lineHeight: 26, color: c.texte },
  normal: { fontSize: 15, lineHeight: 21, color: c.texte },
  doux: { fontSize: 14, lineHeight: 20, color: c.texteDoux },
  petit: { fontSize: 12, lineHeight: 17, color: c.texteDoux },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: c.texteDoux,
  },
  marque: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: c.texteDoux,
  },
  bouton: {
    minHeight: 50,
    borderRadius: Rayon.rond,
    paddingHorizontal: Espace.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texteBouton: { fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
  puce: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: Rayon.rond,
    borderWidth: 1,
  },
  textePuce: { fontSize: 13 },
  groupePuces: { flexDirection: 'row', flexWrap: 'wrap', gap: Espace.s },
  barreOnglets: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.bordure,
  },
  onglet: {
    paddingHorizontal: Espace.m,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  texteOnglet: { fontSize: 15 },
  champ: { gap: Espace.s },
  saisie: {
    minHeight: 50,
    borderRadius: Rayon.m,
    paddingHorizontal: Espace.m,
    fontSize: 16,
    backgroundColor: c.surfaceAlt,
    color: c.texte,
  },
  vide: { alignItems: 'center', justifyContent: 'center', gap: Espace.s, padding: Espace.l },
});
