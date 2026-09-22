import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { CarteTenue } from '@/components/carte-tenue';
import { useToast } from '@/components/toast';
import { Bouton, Chargement, EtatErreur, EtatVide, MessageErreur } from '@/components/ui';
import { Espace, LargeurMax, Palette as c } from '@/constants/theme';
import { api } from '@/lib/api';
import { dateRelative } from '@/lib/dates';
import { confirmer, messageDe, useDonnees } from '@/lib/hooks';

export default function Historique() {
  const toast = useToast();
  const {
    donnees: ports,
    setDonnees,
    erreur,
    chargement,
    recharger,
  } = useDonnees(() => api.historique(100));

  if (!ports && erreur) return <EtatErreur message={erreur} onReessayer={recharger} />;
  if (!ports) return <Chargement />;

  const retirer = async (id: string) => {
    if (
      !(await confirmer('Retirer de l’historique ?', 'Cette entrée sera supprimée.', 'Retirer'))
    ) {
      return;
    }
    setDonnees((p) => p?.filter((x) => x.id !== id) ?? p);
    try {
      await api.annulerPort(id);
    } catch (e) {
      toast(messageDe(e));
      recharger();
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.fond }}
      contentContainerStyle={styles.contenu}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={recharger} />}>
      <MessageErreur message={erreur} />
      {ports.length === 0 && (
        <EtatVide
          icone="time-outline"
          titre="Aucune tenue portée"
          message="Dans l'onglet Tenues, touche « Je la porte aujourd'hui » : l'app évitera ensuite de te reproposer les mêmes pièces trop souvent."
        />
      )}
      {ports.map((port) => (
        <CarteTenue
          key={port.id}
          titre={dateRelative(port.porte_le).replace(/^./, (l) => l.toUpperCase())}
          pieces={port.pieces}
          detail={
            <Bouton
              titre="Retirer de l'historique"
              variante="danger"
              onPress={() => retirer(port.id)}
            />
          }
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenu: {
    padding: Espace.m,
    gap: Espace.m,
    paddingBottom: Espace.xl,
    width: '100%',
    maxWidth: LargeurMax,
    alignSelf: 'center',
  },
});
