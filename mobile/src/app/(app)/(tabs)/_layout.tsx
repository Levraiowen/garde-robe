import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type ColorValue } from 'react-native';

import { Espace, Palette as c, Polices } from '@/constants/theme';

type NomIcone = ComponentProps<typeof Ionicons>['name'];

function icone(nom: NomIcone) {
  return function IconeOnglet({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={nom} color={color} size={size - 2} />;
  };
}

function BoutonAjouter() {
  return (
    <Pressable
      role="button"
      aria-label="Ajouter un vêtement"
      onPress={() => router.push('/vetement/nouveau')}
      hitSlop={12}
      style={{ paddingHorizontal: Espace.m }}>
      <Ionicons name="add" size={28} color={c.texte} />
    </Pressable>
  );
}

export default function LayoutOnglets() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        headerTitleStyle: { fontFamily: Polices.titre, fontSize: 24, color: c.texte },
        tabBarActiveTintColor: c.texte,
        tabBarInactiveTintColor: c.texteDoux,
        tabBarLabelStyle: { fontSize: 11, letterSpacing: 0.3 },
        tabBarStyle: {
          backgroundColor: c.fond,
          borderTopColor: c.bordure,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Garde-robe',
          tabBarIcon: icone('shirt-outline'),
          headerRight: () => <BoutonAjouter />,
        }}
      />
      <Tabs.Screen
        name="tenues"
        options={{ title: 'Tenues', tabBarIcon: icone('layers-outline') }}
      />
      <Tabs.Screen
        name="style"
        options={{ title: 'Mon style', tabBarIcon: icone('sparkles-outline') }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: 'Profil', tabBarIcon: icone('person-outline') }}
      />
    </Tabs>
  );
}
