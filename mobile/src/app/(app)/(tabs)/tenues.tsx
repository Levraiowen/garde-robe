import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { CarteTenue } from '@/components/carte-tenue';
import { useToast } from '@/components/toast';
import {
  Bouton,
  Chargement,
  EtatErreur,
  EtatVide,
  GroupePuces,
  MessageErreur,
  Onglets,
  Puce,
  Texte,
} from '@/components/ui';
import { Espace, LargeurMax, Palette as c } from '@/constants/theme';
import { FORMALITES, SAISONS } from '@/constants/vetements';
import { api } from '@/lib/api';
import { dateRelative, saisonActuelle } from '@/lib/dates';
import { messageDe, useDonnees, vibrer } from '@/lib/hooks';
import { enumerer } from '@/lib/texte';
import type { Saison, Tenue, Vetement } from '@/lib/types';

type Vue = 'pour-toi' | 'favoris';
const EN_COURS = 'en-cours';

export default function Tenues() {
  const [vue, setVue] = useState<Vue>('pour-toi');
  return (
    <View style={{ flex: 1, backgroundColor: c.fond }}>
      <Onglets
        options={[
          { valeur: 'pour-toi', libelle: 'Pour toi' },
          { valeur: 'favoris', libelle: 'Favoris' },
        ]}
        valeur={vue}
        onChange={setVue}
      />
      {vue === 'pour-toi' ? <PourToi /> : <Favoris />}
    </View>
  );
}

const ids = (pieces: Vetement[]) => pieces.map((p) => p.id);

/** « Je la porte aujourd'hui » avec possibilité d'annuler. */
function usePorter() {
  const toast = useToast();
  const [enCours, setEnCours] = useState<string | null>(null);
  return {
    enCours,
    porter: async (cle: string, pieces: Vetement[]) => {
      setEnCours(cle);
      try {
        const port = await api.porter(ids(pieces));
        vibrer('succes');
        toast('Bonne journée ! Tenue ajoutée à ton historique.', {
          libelle: 'Annuler',
          onPress: () => void api.annulerPort(port.id).catch(() => {}),
        });
      } catch (e) {
        toast(messageDe(e));
      } finally {
        setEnCours(null);
      }
    },
  };
}

/** Ce qu'il manque pour composer au moins une tenue. */
function manquants(vetements: Vetement[]): string[] {
  const a = (cat: string) => vetements.some((v) => v.categorie === cat);
  const liste: string[] = [];
  if (!a('chaussures')) liste.push('des chaussures');
  if (!a('robe')) {
    if (!a('haut')) liste.push('un haut');
    if (!a('bas')) liste.push('un bas');
  }
  return liste;
}

function PourToi() {
  const toast = useToast();
  const actuelle = saisonActuelle();
  const [saison, setSaison] = useState<Saison | 'toutes'>(actuelle);
  const [formalite, setFormalite] = useState<number | undefined>();
  const { porter, enCours } = usePorter();

  const { donnees, setDonnees, erreur, chargement, recharger } = useDonnees(async () => {
    const [tenues, vetements] = await Promise.all([
      api.tenues({ saison: saison === 'toutes' ? undefined : saison, formalite, nombre: 15 }),
      api.vetements(),
    ]);
    return { tenues, vetements };
  });

  if (!donnees && erreur) return <EtatErreur message={erreur} onReessayer={recharger} />;

  const basculerFavori = async (tenue: Tenue, index: number) => {
    if (tenue.favori_id === EN_COURS) return; // double appui pendant l'enregistrement
    const maj = (favori_id: string | null) =>
      setDonnees((d) =>
        d ? { ...d, tenues: d.tenues.map((t, i) => (i === index ? { ...t, favori_id } : t)) } : d,
      );
    vibrer();
    try {
      if (tenue.favori_id) {
        maj(null);
        await api.retirerFavori(tenue.favori_id);
        toast('Retirée des favoris');
      } else {
        maj(EN_COURS);
        const favori = await api.ajouterFavori(ids(tenue.pieces));
        maj(favori.id);
        toast('Ajoutée à tes favoris');
      }
    } catch (e) {
      maj(tenue.favori_id);
      toast(messageDe(e));
    }
  };

  const libelleSaison = SAISONS.find((s) => s.valeur === actuelle)?.libelle.toLowerCase();
  const tenues = donnees?.tenues ?? [];
  const aFiltres = saison !== actuelle || formalite !== undefined;

  return (
    <ScrollView
      contentContainerStyle={styles.contenu}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={recharger} />}>
      <GroupePuces defilant>
        {/* La saison actuelle en premier : c'est le filtre par défaut, il doit être visible */}
        {[
          ...SAISONS.filter((s) => s.valeur === actuelle),
          { valeur: 'toutes' as const, libelle: 'Toutes saisons' },
          ...SAISONS.filter((s) => s.valeur !== actuelle),
        ].map((s) => (
          <Puce
            key={s.valeur}
            libelle={s.valeur === actuelle ? `${s.libelle} · maintenant` : s.libelle}
            selectionnee={saison === s.valeur}
            onPress={() => setSaison(s.valeur)}
          />
        ))}
      </GroupePuces>
      <GroupePuces defilant>
        <Puce
          libelle="Toutes occasions"
          selectionnee={formalite === undefined}
          onPress={() => setFormalite(undefined)}
        />
        {FORMALITES.map((f) => (
          <Puce
            key={f.valeur}
            libelle={f.libelle}
            selectionnee={formalite === f.valeur}
            onPress={() => setFormalite(f.valeur)}
          />
        ))}
      </GroupePuces>

      <MessageErreur message={donnees ? erreur : null} />
      {!donnees && <Chargement />}

      {donnees && tenues.length === 0 && (
        <EtatVide
          icone="layers-outline"
          titre="Aucune tenue possible"
          message={
            manquants(donnees.vetements).length
              ? `Pour composer une tenue, il te manque ${enumerer(manquants(donnees.vetements))}.`
              : 'Aucune combinaison ne correspond à ces filtres. Essaie une autre saison ou occasion.'
          }
          action={
            manquants(donnees.vetements).length ? (
              <Bouton
                titre="Ajouter un vêtement"
                icone="add"
                onPress={() => router.push('/vetement/nouveau')}
              />
            ) : aFiltres ? (
              <Bouton
                titre="Réinitialiser les filtres"
                variante="secondaire"
                onPress={() => {
                  setSaison(actuelle);
                  setFormalite(undefined);
                }}
              />
            ) : undefined
          }
        />
      )}

      {tenues.map((tenue, i) => {
        const cle = ids(tenue.pieces).join('-');
        const duJour = i === 0 && saison === actuelle;
        return (
          <View key={cle} style={{ gap: Espace.s }}>
            {duJour && <Texte variante="label">Idée pour aujourd’hui · {libelleSaison}</Texte>}
            {i === 1 && <Texte variante="label">Autres idées</Texte>}
            <CarteTenue
              titre={duJour ? 'Tenue du jour' : `Tenue ${i + 1}`}
              sousTitre={`Harmonie ${Math.round(Math.max(tenue.score, 0) * 100)} %`}
              pieces={tenue.pieces}
              favori={!!tenue.favori_id}
              onFavori={() => basculerFavori(tenue, i)}
              onPorter={() => porter(cle, tenue.pieces)}
              enPorte={enCours === cle}
              vedette={duJour}
              detail={<Texte variante="petit">{tenue.raisons.join('  ·  ')}</Texte>}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

function Favoris() {
  const toast = useToast();
  const { porter, enCours } = usePorter();
  const { donnees: favoris, setDonnees, erreur, chargement, recharger } = useDonnees(api.favoris);

  if (!favoris && erreur) return <EtatErreur message={erreur} onReessayer={recharger} />;
  if (!favoris) return <Chargement />;

  const retirer = async (id: string, pieces: Vetement[]) => {
    vibrer();
    setDonnees((f) => f?.filter((x) => x.id !== id) ?? f);
    try {
      await api.retirerFavori(id);
      toast('Retirée des favoris', {
        libelle: 'Annuler',
        onPress: () => void api.ajouterFavori(ids(pieces)).then(recharger, () => {}),
      });
    } catch (e) {
      toast(messageDe(e));
      recharger();
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.contenu}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={recharger} />}>
      <MessageErreur message={erreur} />
      {favoris.length === 0 && (
        <EtatVide
          icone="heart-outline"
          titre="Pas encore de favoris"
          message="Touche le cœur d'une tenue pour la retrouver ici."
        />
      )}
      {favoris.map((f) => (
        <CarteTenue
          key={f.id}
          titre="Tenue favorite"
          sousTitre={`Enregistrée ${dateRelative(f.cree_le)}`}
          pieces={f.pieces}
          favori
          onFavori={() => retirer(f.id, f.pieces)}
          onPorter={() => porter(f.id, f.pieces)}
          enPorte={enCours === f.id}
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
