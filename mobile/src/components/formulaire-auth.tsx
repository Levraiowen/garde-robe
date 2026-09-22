// Mise en page commune aux écrans de connexion et d'inscription.
import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ecran, Texte } from '@/components/ui';
import { Espace, Palette as c, Polices } from '@/constants/theme';

export function FormulaireAuth({
  titre,
  sousTitre,
  children,
}: PropsWithChildren<{ titre: string; sousTitre: string }>) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.fond }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Ecran style={styles.centre}>
          <View style={styles.entete}>
            <Texte style={styles.logo}>GARDE — ROBE</Texte>
            <Texte variante="titre">{titre}</Texte>
            <Texte variante="doux">{sousTitre}</Texte>
          </View>
          {children}
        </Ecran>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centre: { justifyContent: 'center', maxWidth: 480, width: '100%', alignSelf: 'center' },
  entete: { gap: Espace.s, marginBottom: Espace.l },
  logo: {
    fontFamily: Polices.titre,
    fontSize: 13,
    letterSpacing: 4,
    color: c.accent,
    marginBottom: Espace.l,
  },
});
