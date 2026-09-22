import { router, Stack } from 'expo-router';

import { BoutonIcone } from '@/components/ui';
import { Palette as c, Polices } from '@/constants/theme';

/** Ferme la fenêtre (ou revient à l'accueil si on y est arrivé directement, ex. lien web). */
function BoutonFermer() {
  return (
    <BoutonIcone
      icone="close"
      libelle="Fermer"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
    />
  );
}

export default function LayoutApp() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: c.texte,
        headerStyle: { backgroundColor: c.fond },
        headerTitleStyle: { fontFamily: Polices.titre, fontSize: 20, color: c.texte },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: c.fond },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="vetement/nouveau"
        options={{
          title: 'Nouveau vêtement',
          presentation: 'modal',
          headerLeft: () => <BoutonFermer />,
        }}
      />
      <Stack.Screen name="vetement/[id]" options={{ title: 'Modifier' }} />
      <Stack.Screen name="historique" options={{ title: 'Historique' }} />
      <Stack.Screen name="compte/mot-de-passe" options={{ title: 'Mot de passe' }} />
    </Stack>
  );
}
