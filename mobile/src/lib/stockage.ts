// Stockage du jeton de session : SecureStore sur mobile (chiffré), localStorage sur le web.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function lire(cle: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(cle);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(cle);
}

export async function ecrire(cle: string, valeur: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (valeur === null) localStorage.removeItem(cle);
      else localStorage.setItem(cle, valeur);
    } catch {
      // stockage indisponible (navigation privée…) : la session ne sera pas mémorisée
    }
    return;
  }
  if (valeur === null) await SecureStore.deleteItemAsync(cle);
  else await SecureStore.setItemAsync(cle, valeur);
}
