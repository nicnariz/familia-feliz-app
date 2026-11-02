import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { useSession } from '../../src/hooks';
import { colors } from '../../src/theme';

export default function AuthLayout() {
  const { s, me } = useSession();
  if (s.session && me) return <Redirect href="/" />;
  if (s.session && !me) return <Redirect href="/start" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.linen } }} />;
}
