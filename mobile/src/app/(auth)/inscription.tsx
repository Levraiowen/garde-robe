import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';

import { FormulaireAuth } from '@/components/formulaire-auth';
import { Bouton, Champ, MessageErreur } from '@/components/ui';
import { messageDe } from '@/lib/hooks';
import { useSession } from '@/lib/session';

const PSEUDO_VALIDE = /^[a-zA-Z0-9_.-]{3,30}$/;
const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Inscription() {
  const { inscription } = useSession();
  const [email, setEmail] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const refPseudo = useRef<TextInput>(null);
  const refMotDePasse = useRef<TextInput>(null);

  const valider = async () => {
    if (envoi) return;
    if (!EMAIL_VALIDE.test(email.trim())) return setErreur('Adresse email invalide.');
    if (!PSEUDO_VALIDE.test(pseudo.trim())) {
      return setErreur('Pseudo : 3 à 30 caractères (lettres, chiffres, « . », « _ » ou « - »).');
    }
    if (motDePasse.length < 8)
      return setErreur('Le mot de passe doit faire au moins 8 caractères.');
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
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="toi@exemple.fr"
        returnKeyType="next"
        onSubmitEditing={() => refPseudo.current?.focus()}
      />
      <Champ
        ref={refPseudo}
        label="Pseudo"
        aide="Visible par les autres quand les fonctions sociales arriveront."
        value={pseudo}
        onChangeText={setPseudo}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        placeholder="ex. : owen"
        maxLength={30}
        returnKeyType="next"
        onSubmitEditing={() => refMotDePasse.current?.focus()}
      />
      <Champ
        ref={refMotDePasse}
        label="Mot de passe"
        aide="8 caractères minimum."
        value={motDePasse}
        onChangeText={setMotDePasse}
        secret
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={valider}
      />
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
