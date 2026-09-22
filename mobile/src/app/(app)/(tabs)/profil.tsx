import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Bouton, Ecran, MessageErreur, Separateur, Texte } from '@/components/ui';
import { Espace, Palette as c, Polices } from '@/constants/theme';
import { URL_API } from '@/lib/api';
import { confirmer, messageDe } from '@/lib/hooks';
import { useSession } from '@/lib/session';

export default function Profil() {
  const { utilisateur, deconnexion, supprimerCompte } = useSession();
  const [erreur, setErreur] = useState<string | null>(null);

  if (!utilisateur) return null;

  const supprimer = async () => {
    const ok = await confirmer(
      'Supprimer ton compte ?',
      'Ton compte et toute ta garde-robe seront définitivement supprimés.',
      'Supprimer',
    );
    if (!ok) return;
    try {
      await supprimerCompte();
    } catch (e) {
      setErreur(messageDe(e));
    }
  };

  const depuis = new Date(utilisateur.cree_le).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Ecran>
      <View style={styles.entete}>
        <View style={styles.avatar}>
          <Texte style={styles.initiale}>{utilisateur.pseudo[0]?.toUpperCase()}</Texte>
        </View>
        <Texte variante="sousTitre">@{utilisateur.pseudo}</Texte>
        <Texte variante="doux">{utilisateur.email}</Texte>
        <Texte variante="label">Membre depuis {depuis}</Texte>
      </View>

      <Separateur />
      <Bouton titre="Se déconnecter" variante="secondaire" onPress={deconnexion} />
      <MessageErreur message={erreur} />
      <Bouton titre="Supprimer mon compte" variante="danger" onPress={supprimer} />

      <Texte variante="petit" style={{ textAlign: 'center', marginTop: 'auto' }}>
        Serveur : {URL_API}
      </Texte>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  entete: { alignItems: 'center', gap: Espace.s, paddingTop: Espace.l },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: c.accentDoux,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Espace.s,
  },
  initiale: { fontFamily: Polices.titre, fontSize: 36, lineHeight: 42, color: c.accent },
});
