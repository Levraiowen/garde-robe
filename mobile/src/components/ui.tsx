// Composants d'interface réutilisables — style épuré blanc / marron.
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  useState,
  type ComponentProps,
  type PropsWithChildren,
  type ReactNode,
  type Ref,
} from 'react';
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

import { Espace, LargeurMax, Palette as c, Polices, Rayon } from '@/constants/theme';
import { COULEURS } from '@/constants/vetements';

export type NomIcone = ComponentProps<typeof Ionicons>['name'];

// --- Mise en page --------------------------------------------------------------

/** Écran défilant, centré et limité en largeur sur tablette / web. */
export function Ecran({
  children,
  style,
  pied,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; pied?: ReactNode }>) {
  return (
    <View style={{ flex: 1, backgroundColor: c.fond }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.ecran, style]}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {pied && <View style={styles.pied}>{pied}</View>}
    </View>
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
    <View role="alert" style={styles.erreur}>
      <Ionicons name="alert-circle-outline" size={18} color={c.erreur} />
      <Text style={[styles.petit, { color: c.erreur, flex: 1 }]}>{message}</Text>
    </View>
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
  icone,
  chargement = false,
  desactive = false,
  style,
}: {
  titre: string;
  onPress: () => void;
  variante?: VarianteBouton;
  icone?: NomIcone;
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
        <>
          {icone && <Ionicons name={icone} size={18} color={v.texte} />}
          <Text style={[styles.texteBouton, { color: v.texte }]}>{titre}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Bouton rond avec une icône seule (le libellé sert aux lecteurs d'écran). */
export function BoutonIcone({
  icone,
  libelle,
  onPress,
  actif = false,
  taille = 22,
  couleur = c.texte,
}: {
  icone: NomIcone;
  libelle: string;
  onPress: () => void;
  actif?: boolean;
  taille?: number;
  couleur?: string;
}) {
  return (
    <Pressable
      role="button"
      aria-label={libelle}
      aria-pressed={actif}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.boutonIcone, pressed && { backgroundColor: c.surfaceAlt }]}>
      <Ionicons name={icone} size={taille} color={couleur} />
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

export function GroupePuces({
  children,
  defilant = false,
}: PropsWithChildren<{ defilant?: boolean }>) {
  if (defilant) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.groupePuces,
          { flexWrap: 'nowrap', paddingHorizontal: Espace.m },
        ]}
        style={{ marginHorizontal: -Espace.m, flexGrow: 0 }}>
        {children}
      </ScrollView>
    );
  }
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
    <View style={styles.barreOnglets} role="tablist">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Espace.s }}>
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

export function Champ({
  label,
  aide,
  secret = false,
  ref,
  ...props
}: TextInputProps & { label: string; aide?: string; secret?: boolean; ref?: Ref<TextInput> }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.champ}>
      <Texte variante="label">{label}</Texte>
      <View style={styles.saisie}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={c.texteDoux}
          secureTextEntry={secret && !visible}
          style={styles.texteSaisie}
          {...props}
        />
        {secret && (
          <BoutonIcone
            icone={visible ? 'eye-off-outline' : 'eye-outline'}
            libelle={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            onPress={() => setVisible(!visible)}
            taille={20}
            couleur={c.texteDoux}
          />
        )}
      </View>
      {aide && <Texte variante="petit">{aide}</Texte>}
    </View>
  );
}

export function Section({
  titre,
  children,
  action,
}: PropsWithChildren<{ titre: string; action?: ReactNode }>) {
  return (
    <View style={styles.champ}>
      <View style={styles.enteteSection}>
        <Texte variante="label">{titre}</Texte>
        {action}
      </View>
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
  icone,
  action,
}: {
  titre: string;
  message: string;
  icone?: NomIcone;
  action?: ReactNode;
}) {
  return (
    <View style={styles.vide}>
      {icone && (
        <View style={styles.iconeVide}>
          <Ionicons name={icone} size={28} color={c.accent} />
        </View>
      )}
      <Texte variante="sousTitre" style={{ textAlign: 'center' }}>
        {titre}
      </Texte>
      <Texte variante="doux" style={{ textAlign: 'center', maxWidth: 320 }}>
        {message}
      </Texte>
      {action && <View style={styles.actionVide}>{action}</View>}
    </View>
  );
}

/** Erreur de chargement plein écran avec bouton « Réessayer ». */
export function EtatErreur({ message, onReessayer }: { message: string; onReessayer: () => void }) {
  return (
    <View style={[styles.vide, { flex: 1, backgroundColor: c.fond }]}>
      <EtatVide
        icone="cloud-offline-outline"
        titre="Oups"
        message={message}
        action={<Bouton titre="Réessayer" variante="secondaire" onPress={onReessayer} />}
      />
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
  ecran: {
    padding: Espace.m,
    gap: Espace.l,
    flexGrow: 1,
    width: '100%',
    maxWidth: LargeurMax,
    alignSelf: 'center',
    paddingBottom: Espace.xl,
  },
  pied: {
    padding: Espace.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.bordure,
    backgroundColor: c.fond,
    alignItems: 'center',
  },
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
  erreur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.s,
    padding: Espace.s,
    borderRadius: Rayon.s,
    backgroundColor: '#FBEFEC',
  },
  bouton: {
    flexDirection: 'row',
    gap: Espace.s,
    minHeight: 50,
    borderRadius: Rayon.rond,
    paddingHorizontal: Espace.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texteBouton: { fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
  boutonIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puce: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: Rayon.rond,
    borderWidth: 1,
  },
  textePuce: { fontSize: 13 },
  groupePuces: { flexDirection: 'row', flexWrap: 'wrap', gap: Espace.s },
  barreOnglets: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.bordure,
    backgroundColor: c.fond,
  },
  onglet: {
    paddingHorizontal: Espace.m,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  texteOnglet: { fontSize: 15 },
  champ: { gap: Espace.s },
  enteteSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saisie: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: Rayon.m,
    backgroundColor: c.surfaceAlt,
    paddingRight: Espace.xs,
  },
  texteSaisie: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: Espace.m,
    fontSize: 16,
    color: c.texte,
  },
  vide: { alignItems: 'center', justifyContent: 'center', gap: Espace.s, padding: Espace.l },
  iconeVide: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: c.accentDoux,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Espace.s,
  },
  actionVide: { marginTop: Espace.m, alignSelf: 'stretch', maxWidth: 360, width: '100%' },
});
