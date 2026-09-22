// Messages de confirmation éphémères en bas de l'écran, avec action facultative (« Annuler »).
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Espace, Palette as c, Rayon } from '@/constants/theme';

type Action = { libelle: string; onPress: () => void };
type Toast = { id: number; message: string; action?: Action };
type Afficher = (message: string, action?: Action) => void;

const Contexte = createContext<Afficher>(() => {});

export function useToast(): Afficher {
  return use(Contexte);
}

const DUREE = 3500;

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<Toast | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout>>(undefined);
  const insets = useSafeAreaInsets();

  const afficher = useCallback<Afficher>((message, action) => {
    clearTimeout(minuteur.current);
    setToast({ id: Date.now(), message, action });
    minuteur.current = setTimeout(() => setToast(null), DUREE);
  }, []);

  useEffect(() => () => clearTimeout(minuteur.current), []);

  return (
    <Contexte value={afficher}>
      {children}
      {toast && (
        <View
          key={toast.id}
          pointerEvents="box-none"
          style={[styles.conteneur, { bottom: insets.bottom + 72 }]}>
          <View role="status" aria-live="polite" style={styles.toast}>
            <Text style={styles.message}>{toast.message}</Text>
            {toast.action && (
              <Pressable
                role="button"
                aria-label={toast.action.libelle}
                hitSlop={10}
                onPress={() => {
                  toast.action?.onPress();
                  setToast(null);
                }}>
                <Text style={styles.action}>{toast.action.libelle}</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </Contexte>
  );
}

const styles = StyleSheet.create({
  conteneur: { position: 'absolute', left: 0, right: 0, alignItems: 'center', padding: Espace.m },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    maxWidth: 520,
    width: '100%',
    backgroundColor: c.encre,
    borderRadius: Rayon.m,
    paddingVertical: 14,
    paddingHorizontal: Espace.m,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  message: { flex: 1, color: c.surEncre, fontSize: 14, lineHeight: 20 },
  action: { color: '#E8C9A8', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
});
