import { SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ToastProvider } from '@/components/toast';
import { useThemeNavigation } from '@/constants/theme';
import { SessionProvider, useSession } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

export default function Racine() {
  return (
    <ThemeProvider value={useThemeNavigation()}>
      <SessionProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Navigation />
        </ToastProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

function Navigation() {
  const { utilisateur, chargement } = useSession();

  // On garde l'écran de démarrage tant qu'on ne sait pas si l'utilisateur est connecté.
  if (chargement) return null;
  SplashScreen.hide();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!utilisateur}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!utilisateur}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
