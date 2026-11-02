import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { account } from '../src/data/account';
import { hydrate, isHydrated } from '../src/data/store';
import { colors, spacing } from '../src/theme';
import { FeedbackProvider } from '../src/ui/Feedback';
import { Button, FeNote, Txt } from '../src/ui/primitives';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Poppins_500Medium, Poppins_600SemiBold });
  const [ready, setReady] = useState(isHydrated());

  useEffect(() => {
    if (!ready)
      hydrate().then(() => {
        setReady(true);
        // Confere a sessão no servidor em segundo plano; sem internet, o app segue com o que está salvo.
        void account.resume();
      });
  }, [ready]);

  if (!fontsLoaded || !ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.linen, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.teal} accessibilityLabel="Carregando" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <FeedbackProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.linen }, animation: 'fade' }} />
      </FeedbackProvider>
    </SafeAreaProvider>
  );
}

/** Situações especiais: falha inesperada com caminho de retomada, sem culpa. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.linen, justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
      <Txt v="title">Algo saiu do lugar</Txt>
      <Txt v="body" color={colors.inkSoft}>
        Nada do que você fez foi perdido. Vamos recarregar esta tela.
      </Txt>
      <FeNote mode="tranquilizar">Vamos tentar de novo? Às vezes é só um tropeço.</FeNote>
      <Button label="Tentar de novo" icon="refresh-cw" onPress={retry} />
    </View>
  );
}
