import { router } from 'expo-router';
import { useState } from 'react';

import { FormulaireAuth } from '@/components/formulaire-auth';
import { Bouton, Champ, MessageErreur } from '@/components/ui';
import { messageDe } from '@/lib/hooks';
import { useSession } from '@/lib/session';

export default function Connexion() {
  const { connexion } = useSession();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const valider = async () => {
    setErreur(null);
    setEnvoi(true);
    try {
      await connexion(email, motDePasse);
      // La navigation bascule automatiquement vers l'app (Stack.Protected).
    } catch (e) {
      setErreur(messageDe(e));
      setEnvoi(false);
    }
  };

  return (
    <FormulaireAuth
      titre="Content de te revoir"
      sousTitre="Connecte-toi pour retrouver ta garde-robe.">
      <Champ
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="toi@exemple.fr"
      />
      <Champ
        label="Mot de passe"
        value={motDePasse}
        onChangeText={setMotDePasse}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={valider}
      />
      <MessageErreur message={erreur} />
      <Bouton
        titre="Se connecter"
        onPress={valider}
        chargement={envoi}
        desactive={!email || !motDePasse}
      />
      <Bouton
        titre="Pas encore de compte ? Inscris-toi"
        variante="discret"
        onPress={() => router.replace('/inscription')}
      />
    </FormulaireAuth>
  );
}
