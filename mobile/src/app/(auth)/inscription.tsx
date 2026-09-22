import { router } from 'expo-router';
import { useState } from 'react';

import { FormulaireAuth } from '@/components/formulaire-auth';
import { Bouton, Champ, MessageErreur, Texte } from '@/components/ui';
import { messageDe } from '@/lib/hooks';
import { useSession } from '@/lib/session';

const PSEUDO_VALIDE = /^[a-zA-Z0-9_.-]{3,30}$/;

export default function Inscription() {
  const { inscription } = useSession();
  const [email, setEmail] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const valider = async () => {
    if (!PSEUDO_VALIDE.test(pseudo)) {
      setErreur('Pseudo : 3 à 30 caractères, lettres, chiffres, « . », « _ » ou « - »');
      return;
    }
    if (motDePasse.length < 8) {
      setErreur('Le mot de passe doit faire au moins 8 caractères');
      return;
    }
    setErreur(null);
    setEnvoi(true);
    try {
      await inscription(email, pseudo, motDePasse);
    } catch (e) {
      setErreur(messageDe(e));
      setEnvoi(false);
    }
  };

  return (
    <FormulaireAuth
      titre="Crée ta garde-robe"
      sousTitre="Un compte pour retrouver tes vêtements et tes tenues sur tous tes appareils.">
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
        label="Pseudo"
        value={pseudo}
        onChangeText={setPseudo}
        autoCapitalize="none"
        autoComplete="username"
        textContentType="username"
        placeholder="owen"
      />
      <Champ
        label="Mot de passe"
        value={motDePasse}
        onChangeText={setMotDePasse}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={valider}
      />
      <Texte variante="petit">8 caractères minimum.</Texte>
      <MessageErreur message={erreur} />
      <Bouton
        titre="Créer mon compte"
        onPress={valider}
        chargement={envoi}
        desactive={!email || !pseudo || !motDePasse}
      />
      <Bouton
        titre="Déjà un compte ? Connecte-toi"
        variante="discret"
        onPress={() => router.replace('/connexion')}
      />
    </FormulaireAuth>
  );
}
