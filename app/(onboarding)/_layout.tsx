import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { useSession } from '../../src/hooks';
import { colors } from '../../src/theme';

export default function OnboardingLayout() {
  const { s } = useSession();
  if (!s.session) return <Redirect href="/welcome" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.linen } }} />;
}
