import { Tabs } from 'expo-router';
import React from 'react';
import { colors } from '../../../src/theme';

/** Os cinco destinos primários. A barra visível é a BottomBar do layout (app), presente em todas as telas. */
export default function TabsLayout() {
  return (
    <Tabs tabBar={() => null} backBehavior="history" screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.linen } }}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tarefas' }} />
      <Tabs.Screen name="rewards" options={{ title: 'Recompensas' }} />
      <Tabs.Screen name="family" options={{ title: 'Família' }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}
