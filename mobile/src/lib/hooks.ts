import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { ErreurApi } from './api';

/**
 * Charge des données depuis l'API quand l'écran prend le focus (ex. : retour sur
 * la garde-robe après un ajout) et quand `charger` change (ex. : un filtre).
 * Le React Compiler mémoïse `charger` selon les valeurs qu'il utilise.
 */
export function useDonnees<T>(charger: () => Promise<T>) {
  const [donnees, setDonnees] = useState<T | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  const recharger = useCallback(async () => {
    setChargement(true);
    try {
      setDonnees(await charger());
      setErreur(null);
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setChargement(false);
    }
  }, [charger]);

  useFocusEffect(
    useCallback(() => {
      recharger();
    }, [recharger]),
  );

  return { donnees, setDonnees, erreur, chargement, recharger };
}

export function messageDe(e: unknown): string {
  if (e instanceof ErreurApi) return e.message;
  return 'Une erreur inattendue est survenue';
}

/** Petite vibration de confirmation (ignorée sur le web). */
export function vibrer(type: 'succes' | 'leger' = 'leger') {
  if (Platform.OS === 'web') return;
  if (type === 'succes') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Demande de confirmation (Alert natif sur mobile, confirm() sur le web). */
export function confirmer(titre: string, message: string, libelleOk: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titre}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: libelleOk, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
