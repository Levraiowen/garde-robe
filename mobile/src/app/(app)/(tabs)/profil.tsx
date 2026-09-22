import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Visuel } from '@/components/carte-vetement';
import { Ecran, MessageErreur, Separateur, Texte, type NomIcone } from '@/components/ui';
import { Espace, Palette as c, Polices } from '@/constants/theme';
import { api, URL_API } from '@/lib/api';
import { dateRelative } from '@/lib/dates';
import { confirmer, messageDe, useDonnees } from '@/lib/hooks';
import { useSession } from '@/lib/session';

function LigneMenu({
  icone,
  libelle,
  onPress,
  danger = false,
}: {
  icone: NomIcone;
  libelle: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const couleur = danger ? c.erreur : c.texte;
  return (
    <Pressable
      role="button"
      aria-label={libelle}
      onPress={onPress}
      style={({ pressed }) => [styles.ligneMenu, pressed && { backgroundColor: c.surfaceAlt }]}>
      <Ionicons name={icone} size={20} color={couleur} />
      <Texte style={{ flex: 1, color: couleur }}>{libelle}</Texte>
      {!danger && <Ionicons name="chevron-forward" size={18} color={c.texteDoux} />}
    </Pressable>
  );
}

function Stat({ valeur, libelle }: { valeur: number | string; libelle: string }) {
  return (
    <View style={styles.stat}>
      <Texte style={styles.valeurStat}>{valeur}</Texte>
      <Texte variante="label">{libelle}</Texte>
    </View>
  );
}

export default function Profil() {
  const { utilisateur, deconnexion, supprimerCompte } = useSession();
  const [erreur, setErreur] = useState<string | null>(null);
  const { donnees } = useDonnees(async () => {
    const [vetements, favoris, historique] = await Promise.all([
      api.vetements(),
      api.favoris(),
      api.historique(3),
    ]);
    return { vetements, favoris, historique };
  });

  if (!utilisateur) return null;

  const seDeconnecter = async () => {
    if (
      await confirmer(
        'Se déconnecter ?',
        'Tu pourras te reconnecter à tout moment.',
        'Se déconnecter',
      )
    ) {
      await deconnexion();
    }
  };

  const supprimer = async () => {
    const ok = await confirmer(
      'Supprimer ton compte ?',
      'Ton compte, ta garde-robe, tes photos et ton historique seront définitivement supprimés. Cette action est irréversible.',
      'Supprimer définitivement',
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
  const aller = (href: Href) => () => router.push(href);

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

      <View style={styles.stats}>
        <Stat valeur={donnees?.vetements.length ?? '–'} libelle="Pièces" />
        <View style={styles.separateurVertical} />
        <Stat valeur={donnees?.favoris.length ?? '–'} libelle="Favoris" />
        <View style={styles.separateurVertical} />
        <Stat
          valeur={donnees?.vetements.filter((v) => v.nb_ports > 0).length ?? '–'}
          libelle="Déjà portées"
        />
      </View>

      {!!donnees?.historique.length && (
        <View style={{ gap: Espace.m }}>
          <View style={styles.enteteSection}>
            <Texte variante="label">Dernières tenues portées</Texte>
            <Pressable role="link" onPress={aller('/historique')} hitSlop={8}>
              <Texte variante="petit" style={{ color: c.accent, fontWeight: '600' }}>
                Tout voir
              </Texte>
            </Pressable>
          </View>
          {donnees.historique.map((port) => (
            <View key={port.id} style={styles.port}>
              <View style={styles.miniatures}>
                {port.pieces.slice(0, 4).map((p) => (
                  <Visuel key={p.id} vetement={p} style={styles.miniature} />
                ))}
              </View>
              <Texte variante="petit">{dateRelative(port.porte_le)}</Texte>
            </View>
          ))}
        </View>
      )}

      <View>
        <Texte variante="label" style={{ marginBottom: Espace.s }}>
          Compte
        </Texte>
        <LigneMenu
          icone="time-outline"
          libelle="Historique des tenues"
          onPress={aller('/historique')}
        />
        <Separateur />
        <LigneMenu
          icone="lock-closed-outline"
          libelle="Changer le mot de passe"
          onPress={aller('/compte/mot-de-passe')}
        />
        <Separateur />
        <LigneMenu icone="log-out-outline" libelle="Se déconnecter" onPress={seDeconnecter} />
        <Separateur />
        <LigneMenu
          icone="trash-outline"
          libelle="Supprimer mon compte"
          onPress={supprimer}
          danger
        />
      </View>
      <MessageErreur message={erreur} />

      <Texte variante="petit" style={{ textAlign: 'center', marginTop: 'auto' }}>
        Garde-Robe {Constants.expoConfig?.version} · serveur {URL_API}
      </Texte>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  entete: { alignItems: 'center', gap: Espace.xs, paddingTop: Espace.m },
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
  stats: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: c.bordure,
    paddingVertical: Espace.m,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  valeurStat: { fontFamily: Polices.titre, fontSize: 24, lineHeight: 30 },
  separateurVertical: { width: StyleSheet.hairlineWidth, backgroundColor: c.bordure },
  enteteSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  port: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  miniatures: { flexDirection: 'row', gap: 6 },
  miniature: { width: 40, height: 52 },
  ligneMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    minHeight: 52,
    paddingHorizontal: Espace.xs,
  },
});
