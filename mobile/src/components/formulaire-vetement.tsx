import { useState } from 'react';

import {
  Bouton,
  Champ,
  Ecran,
  GroupePuces,
  MessageErreur,
  PastilleCouleur,
  Puce,
  Section,
} from '@/components/ui';
import { CATEGORIES, COULEURS, FORMALITES, SAISONS, STYLES_PROPOSES } from '@/constants/vetements';
import { messageDe } from '@/lib/hooks';
import type { Categorie, Saison, VetementSaisie } from '@/lib/types';

const basculer = <T,>(liste: T[], valeur: T) =>
  liste.includes(valeur) ? liste.filter((x) => x !== valeur) : [...liste, valeur];

export function FormulaireVetement({
  initial,
  titreBouton,
  onValider,
  children,
}: {
  initial?: VetementSaisie;
  titreBouton: string;
  onValider: (v: VetementSaisie) => Promise<void>;
  children?: React.ReactNode;
}) {
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [categorie, setCategorie] = useState<Categorie | null>(initial?.categorie ?? null);
  const [couleur, setCouleur] = useState<string | null>(initial?.couleur ?? null);
  const [styles, setStyles] = useState<string[]>(initial?.styles ?? []);
  const [styleLibre, setStyleLibre] = useState('');
  const [saisons, setSaisons] = useState<Saison[]>(
    initial?.saisons ?? SAISONS.map((s) => s.valeur),
  );
  const [formalite, setFormalite] = useState(initial?.formalite ?? 2);
  const [marque, setMarque] = useState(initial?.marque ?? '');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // Styles proposés + styles déjà présents sur le vêtement (s'ils sont personnalisés)
  const stylesAffiches = [...new Set([...STYLES_PROPOSES, ...styles])];

  const ajouterStyleLibre = () => {
    const s = styleLibre.trim().toLowerCase();
    if (s && !styles.includes(s)) setStyles([...styles, s]);
    setStyleLibre('');
  };

  const valider = async () => {
    if (!nom.trim() || !categorie || !couleur) {
      setErreur('Indique au moins un nom, une catégorie et une couleur');
      return;
    }
    if (saisons.length === 0) {
      setErreur('Choisis au moins une saison');
      return;
    }
    setErreur(null);
    setEnvoi(true);
    try {
      await onValider({
        nom: nom.trim(),
        categorie,
        couleur,
        styles,
        saisons,
        formalite,
        marque: marque.trim() || null,
      });
    } catch (e) {
      setErreur(messageDe(e));
      setEnvoi(false);
    }
  };

  return (
    <Ecran>
      <Champ label="Nom" value={nom} onChangeText={setNom} placeholder="Chemise oxford bleue" />

      <Section titre="Catégorie">
        <GroupePuces>
          {CATEGORIES.map((c) => (
            <Puce
              key={c.valeur}
              libelle={c.libelle}
              selectionnee={categorie === c.valeur}
              onPress={() => setCategorie(c.valeur)}
            />
          ))}
        </GroupePuces>
      </Section>

      <Section titre="Couleur principale">
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
          {stylesAffiches.map((s) => (
            <Puce
              key={s}
              libelle={s}
              selectionnee={styles.includes(s)}
              onPress={() => setStyles(basculer(styles, s))}
            />
          ))}
        </GroupePuces>
        <Champ
          label="Autre style"
          value={styleLibre}
          onChangeText={setStyleLibre}
          onSubmitEditing={ajouterStyleLibre}
          onBlur={ajouterStyleLibre}
          placeholder="ex. : y2k, gorpcore…"
          autoCapitalize="none"
        />
      </Section>

      <Section titre="Saisons">
        <GroupePuces>
          {SAISONS.map((s) => (
            <Puce
              key={s.valeur}
              libelle={s.libelle}
              selectionnee={saisons.includes(s.valeur)}
              onPress={() => setSaisons(basculer(saisons, s.valeur))}
            />
          ))}
        </GroupePuces>
      </Section>

      <Section titre="Niveau d'habillé">
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

      <Champ label="Marque (optionnel)" value={marque} onChangeText={setMarque} />

      <MessageErreur message={erreur} />
      <Bouton titre={titreBouton} onPress={valider} chargement={envoi} />
      {children}
    </Ecran>
  );
}
