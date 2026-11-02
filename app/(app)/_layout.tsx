import { Redirect, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { account } from '../../src/data/account';
import { refreshHorizon } from '../../src/data/store';
import { useSession } from '../../src/hooks';
import { colors } from '../../src/theme';
import { BottomBar } from '../../src/ui/BottomBar';
import { InTabs } from '../../src/ui/Screen';

const POLL_MS = 10_000;

/** Área logada: pilha de telas com a barra inferior sempre visível embaixo. */
export default function AppLayout() {
  const { s, me } = useSession();
  useEffect(() => {
    refreshHorizon();
  }, []);

  // Vários aparelhos na mesma família: busca o estado oficial ao voltar para o app e a cada 10 segundos.
  const remote = !!s.session?.remote;
  const familyId = s.session?.activeFamilyId;
  useEffect(() => {
    if (!remote || !familyId) return;
    void account.poll();
    let active = AppState.currentState !== 'background';
    const timer = setInterval(() => {
      if (active) void account.poll();
    }, POLL_MS);
    const sub = AppState.addEventListener('change', (next) => {
      const wasActive = active;
      active = next === 'active';
      if (active && !wasActive) void account.poll();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [remote, familyId]);
  if (!s.session) return <Redirect href="/welcome" />;
  if (!me) return <Redirect href="/start" />;
  return (
    <InTabs.Provider value={true}>
      <View style={{ flex: 1, backgroundColor: colors.linen }}>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.linen } }} />
        </View>
        <BottomBar />
      </View>
    </InTabs.Provider>
  );
}
