// Choix d'une photo : appareil photo ou galerie.
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

import type { PhotoLocale } from './types';

const OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  allowsEditing: true,
  aspect: [3, 4],
  quality: 0.7, // compresse en JPEG : plus léger à envoyer
};

async function depuis(source: 'camera' | 'galerie'): Promise<PhotoLocale | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Accès à l’appareil photo refusé',
        'Autorise l’accès dans les réglages du téléphone pour photographier tes vêtements.',
      );
      return null;
    }
  }
  const resultat =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(OPTIONS);
  if (resultat.canceled || !resultat.assets[0]) return null;
  const { uri, mimeType, fileName } = resultat.assets[0];
  return { uri, mimeType, fileName };
}

/** Propose l'appareil photo ou la galerie ; renvoie null si annulé. */
export function choisirPhoto(): Promise<PhotoLocale | null> {
  // Sur le web, pas d'appareil photo : on ouvre directement le sélecteur de fichiers.
  if (Platform.OS === 'web') return depuis('galerie');

  return new Promise((resolve) => {
    Alert.alert('Photo du vêtement', undefined, [
      { text: 'Prendre une photo', onPress: () => depuis('camera').then(resolve) },
      { text: 'Choisir dans la galerie', onPress: () => depuis('galerie').then(resolve) },
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}
