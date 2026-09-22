import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';

import { useToast } from '@/components/toast';
import { Bouton, Champ, Ecran, MessageErreur, Texte } from '@/components/ui';
import { messageDe, vibrer } from '@/lib/hooks';
import { useSession } from '@/lib/session';

export default function MotDePasse() {
  const { changerMotDePasse } = useSession();
  const toast = useToast();
  const [actuel, setActuel] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const refNouveau = useRef<TextInput>(null);
  const refConfirmation = useRef<TextInput>(null);

  const valider = async () => {
    if (nouveau.length < 8)
      return setErreur('Le nouveau mot de passe doit faire au moins 8 caractères.');
    if (nouveau !== confirmation) return setErreur('Les deux mots de passe ne correspondent pas.');
    setErreur(null);
    setEnvoi(true);
    try {
      await changerMotDePasse(actuel, nouveau);
      vibrer('succes');
      toast('Mot de passe modifié');
      router.back();
    } catch (e) {
      setErreur(messageDe(e));
      setEnvoi(false);
    }
  };

  return (
    <Ecran>
      <Texte variante="doux">Pour ta sécurité, tes autres appareils seront déconnectés.</Texte>
      <Champ
        label="Mot de passe actuel"
        value={actuel}
        onChangeText={setActuel}
        secret
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="next"
        onSubmitEditing={() => refNouveau.current?.focus()}
      />
      <Champ
        ref={refNouveau}
        label="Nouveau mot de passe"
        aide="8 caractères minimum."
        value={nouveau}
        onChangeText={setNouveau}
        secret
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => refConfirmation.current?.focus()}
      />
      <Champ
        ref={refConfirmation}
        label="Confirmer le nouveau mot de passe"
        value={confirmation}
        onChangeText={setConfirmation}
        secret
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={valider}
      />
      <MessageErreur message={erreur} />
      <Bouton
        titre="Changer le mot de passe"
        onPress={valider}
        chargement={envoi}
        desactive={!actuel || !nouveau || !confirmation}
      />
    </Ecran>
  );
}
