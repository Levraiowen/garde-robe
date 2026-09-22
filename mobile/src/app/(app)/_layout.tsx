import { Stack } from 'expo-router';

import { Palette as c, Polices } from '@/constants/theme';

export default function LayoutApp() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: c.texte,
        headerTitleStyle: { fontFamily: Polices.titre, fontSize: 20, color: c.texte },
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="vetement/nouveau"
        options={{ title: 'Nouveau vêtement', presentation: 'modal' }}
      />
      <Stack.Screen name="vetement/[id]" options={{ title: 'Modifier' }} />
    </Stack>
  );
}
