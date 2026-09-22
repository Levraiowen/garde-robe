import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Visuel } from '@/components/carte-vetement';
import {
  Bouton,
  Champ,
  Ecran,
  GroupePuces,
  MessageErreur,
  PastilleCouleur,
  Puce,
  Section,
  Texte,
} from '@/components/ui';
import { Espace, Palette as c } from '@/constants/theme';
import { CATEGORIES, COULEURS, FORMALITES, SAISONS, STYLES_PROPOSES } from '@/constants/vetements';
import { messageDe } from '@/lib/hooks';
import { choisirPhoto } from '@/lib/photo';
import { enumerer } from '@/lib/texte';
import type { Categorie, PhotoLocale, Saison, Vetement, VetementSaisie } from '@/lib/types';

export type ChangementPhoto =
  { action: 'garder' } | { action: 'nouvelle'; photo: PhotoLocale } | { action: 'retirer' };

const basculer = <T,>(liste: T[], valeur: T) =>
  liste.includes(valeur) ? liste.filter((x) => x !== valeur) : [...liste, valeur];

const TOUTES_SAISONS = SAISONS.map((s) => s.valeur);
export function FormulaireVetement({
  initial,
  titreBouton,
  onValider,
  children,
}: {
  initial?: Partial<Vetement>;
  titreBouton: string;
  onValider: (v: VetementSaisie, photo: ChangementPhoto) => Promise<void>;
  children?: ReactNode;
}) {
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [categorie, setCategorie] = useState<Categorie | null>(initial?.categorie ?? null);
  const [couleur, setCouleur] = useState<string | null>(initial?.couleur ?? null);
  const [styles, setStyles] = useState<string[]>(initial?.styles ?? []);
  const [styleLibre, setStyleLibre] = useState('');
  const [saisons, setSaisons] = useState<Saison[]>(initial?.saisons ?? TOUTES_SAISONS);
  const [formalite, setFormalite] = useState(initial?.formalite ?? 2);
  const [marque, setMarque] = useState(initial?.marque ?? '');
  const [photo, setPhoto] = useState<ChangementPhoto>({ action: 'garder' });
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // Styles proposés + styles personnalisés déjà présents
  const stylesAffiches = [...new Set([...STYLES_PROPOSES, ...styles])];
  const imageActuelle = photo.action === 'garder' ? (initial?.image ?? null) : null;
  const uriLocale = photo.action === 'nouvelle' ? photo.photo.uri : null;
  const aUnePhoto = !!(imageActuelle || uriLocale);

  const ajouterStyleLibre = () => {
    const s = styleLibre.trim().toLowerCase();
    if (s && !styles.includes(s)) setStyles([...styles, s]);
    setStyleLibre('');
  };

  const prendrePhoto = async () => {
    const choisie = await choisirPhoto();
    if (choisie) setPhoto({ action: 'nouvelle', photo: choisie });
  };

  const valider = async () => {
    const manquants = [
      !nom.trim() && 'un nom',
      !categorie && 'une catégorie',
      !couleur && 'une couleur',
    ].filter(Boolean);
    if (manquants.length) {
      setErreur(`Il manque ${enumerer(manquants as string[])}.`);
      return;
    }
    if (saisons.length === 0) {
      setErreur('Choisis au moins une saison.');
      return;
    }
    // Un style tapé mais pas encore ajouté est pris en compte quand même
    const enAttente = styleLibre.trim().toLowerCase();
    const stylesFinaux = enAttente && !styles.includes(enAttente) ? [...styles, enAttente] : styles;
    setErreur(null);
    setEnvoi(true);
    try {
      await onValider(
        {
          nom: nom.trim(),
          categorie: categorie!,
          couleur: couleur!,
          styles: stylesFinaux,
          saisons,
          formalite,
          marque: marque.trim() || null,
        },
        photo,
      );
    } catch (e) {
      setErreur(messageDe(e));
      setEnvoi(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <Ecran
        pied={
          <View style={{ width: '100%', maxWidth: 720, gap: Espace.s }}>
            <MessageErreur message={erreur} />
            <Bouton titre={titreBouton} onPress={valider} chargement={envoi} />
          </View>
        }>
        {/* Photo */}
        <View style={s.blocPhoto}>
          <Pressable
            role="button"
            aria-label={aUnePhoto ? 'Changer la photo' : 'Ajouter une photo'}
            onPress={prendrePhoto}
            style={({ pressed }) => [s.cadrePhoto, pressed && { opacity: 0.8 }]}>
            {aUnePhoto ? (
              <Visuel
                vetement={{ couleur: couleur ?? '', image: imageActuelle, nom }}
                uriLocale={uriLocale}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View style={s.videPhoto}>
                <Ionicons name="camera-outline" size={26} color={c.texte} />
                <Texte variante="petit" style={{ textAlign: 'center' }}>
                  Ajouter une photo
                </Texte>
              </View>
            )}
          </Pressable>
          {aUnePhoto && (
            <View style={s.actionsPhoto}>
              <Bouton titre="Changer" variante="discret" onPress={prendrePhoto} />
              <Bouton
                titre="Retirer"
                variante="discret"
                onPress={() => setPhoto({ action: 'retirer' })}
              />
            </View>
          )}
        </View>

        <Champ
          label="Nom *"
          value={nom}
          onChangeText={setNom}
          placeholder="ex. : Chemise oxford bleue"
          maxLength={100}
          returnKeyType="done"
        />

        <Section titre="Catégorie *">
          <GroupePuces>
            {CATEGORIES.map((cat) => (
              <Puce
                key={cat.valeur}
                libelle={cat.libelle}
                selectionnee={categorie === cat.valeur}
                onPress={() => setCategorie(cat.valeur)}
              />
            ))}
          </GroupePuces>
        </Section>

        <Section titre="Couleur principale *">
          <GroupePuces>
            {Object.keys(COULEURS).map((nomCouleur) => (
              <Puce
                key={nomCouleur}
                libelle={nomCouleur}
                selectionnee={couleur === nomCouleur}
                onPress={() => setCouleur(nomCouleur)}
                prefixe={<PastilleCouleur couleur={nomCouleur} />}
              />
            ))}
          </GroupePuces>
        </Section>

        <Section titre="Styles">
          <GroupePuces>
            {stylesAffiches.map((st) => (
              <Puce
                key={st}
                libelle={st}
                selectionnee={styles.includes(st)}
                onPress={() => setStyles(basculer(styles, st))}
              />
            ))}
          </GroupePuces>
          <View style={s.ligneStyle}>
            <View style={{ flex: 1 }}>
              <Champ
                label="Autre style"
                value={styleLibre}
                onChangeText={setStyleLibre}
                onSubmitEditing={ajouterStyleLibre}
                placeholder="ex. : y2k, gorpcore…"
                autoCapitalize="none"
                maxLength={30}
                returnKeyType="done"
              />
            </View>
            <Bouton
              titre="Ajouter"
              variante="secondaire"
              onPress={ajouterStyleLibre}
              desactive={!styleLibre.trim()}
              style={{ minHeight: 50 }}
            />
          </View>
        </Section>

        <Section
          titre="Saisons"
          action={
            saisons.length < TOUTES_SAISONS.length && (
              <Bouton
                titre="Toutes"
                variante="discret"
                onPress={() => setSaisons(TOUTES_SAISONS)}
                style={{ minHeight: 30, paddingHorizontal: 0 }}
              />
            )
          }>
          <GroupePuces>
            {SAISONS.map((saison) => (
              <Puce
                key={saison.valeur}
                libelle={saison.libelle}
                selectionnee={saisons.includes(saison.valeur)}
                onPress={() => setSaisons(basculer(saisons, saison.valeur))}
              />
            ))}
          </GroupePuces>
        </Section>

        <Section titre="Occasion">
          <GroupePuces>
            {FORMALITES.map((f) => (
              <Puce
                key={f.valeur}
                libelle={f.libelle}
                selectionnee={formalite === f.valeur}
                onPress={() => setFormalite(f.valeur)}
              />
            ))}
          </GroupePuces>
        </Section>

        <Champ
          label="Marque"
          value={marque}
          onChangeText={setMarque}
          placeholder="Facultatif"
          maxLength={60}
          returnKeyType="done"
        />

        {children}
      </Ecran>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  blocPhoto: { alignItems: 'center', gap: Espace.xs },
  cadrePhoto: {
    width: 180,
    aspectRatio: 3 / 4,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: c.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.bordure,
  },
  videPhoto: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Espace.xs },
  actionsPhoto: { flexDirection: 'row', gap: Espace.m },
  ligneStyle: { flexDirection: 'row', alignItems: 'flex-end', gap: Espace.s },
});
