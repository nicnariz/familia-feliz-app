import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { account } from '../../src/data/account';
import { actions, errorMessage } from '../../src/data/store';
import { colors, spacing } from '../../src/theme';
import { Banner, Button, Field, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

export default function Login() {
  const params = useLocalSearchParams<{ invite?: string; email?: string }>();
  const withInvite = params.invite === '1';
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (withInvite && code.trim()) {
        await account.previewInvitation(code);
        actions.setPendingInvite(code);
      }
      await account.login(email, password);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen
      title="Entrar"
      footer={
        <>
          <Button testID="login-submit" label="Entrar" onPress={submit} loading={busy} />
          <Button label="Esqueci minha senha" variant="ghost" small onPress={() => router.push(`/recover?email=${encodeURIComponent(email)}`)} />
        </>
      }
    >
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <Txt v="title">Bem-vindo de volta</Txt>
        <Txt v="body" color={colors.inkSoft}>
          Entre para continuar de onde a família parou.
        </Txt>
      </View>
      {withInvite ? (
        <Field label="Código do convite (opcional)" value={code} onChangeText={setCode} autoCapitalize="characters" maxLength={16} />
      ) : null}
      <Field testID="login-email" label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Field testID="login-password" label="Senha" value={password} onChangeText={setPassword} secure autoCapitalize="none" autoComplete="password" />
      {error ? <Banner tone="attention" icon="info" text={error} /> : null}
    </Screen>
  );
}
