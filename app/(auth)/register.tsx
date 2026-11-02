import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { account } from '../../src/data/account';
import { actions, errorMessage } from '../../src/data/store';
import { colors, spacing } from '../../src/theme';
import { Banner, Button, Field, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

export default function Register() {
  const params = useLocalSearchParams<{ invite?: string }>();
  const withInvite = params.invite === '1';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (withInvite) {
        if (code.trim().length < 6) throw new Error('Digite o código do convite que você recebeu.');
        await account.previewInvitation(code); // valida antes de criar a conta
        actions.setPendingInvite(code);
      }
      await account.register(name, email, password);
      // O layout leva para os primeiros passos.
    } catch (e) {
      setError(e instanceof Error && !('code' in e) ? e.message : errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen
      title="Criar conta"
      footer={
        <>
          <Button testID="register-submit" label="Criar conta" onPress={submit} loading={busy} />
          <Button label="Já tenho conta" variant="ghost" small onPress={() => router.replace(withInvite ? '/login?invite=1' : '/login')} />
        </>
      }
    >
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <Txt v="title">Que bom ter você aqui</Txt>
        <Txt v="body" color={colors.inkSoft}>
          Leva menos de um minuto. Depois você cria a sua família ou entra com um convite.
        </Txt>
      </View>
      {withInvite ? (
        <Field
          testID="register-code"
          label="Código do convite"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          placeholder="Ex.: K7M2Q9PX"
          maxLength={16}
        />
      ) : null}
      <Field testID="register-name" label="Como você gosta de ser chamado" value={name} onChangeText={setName} autoComplete="name" placeholder="Seu nome" />
      <Field testID="register-email" label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="voce@email.com" />
      <Field testID="register-password" label="Senha" value={password} onChangeText={setPassword} secure autoCapitalize="none" autoComplete="new-password" hint="Pelo menos 8 caracteres." />
      {error ? <Banner tone="attention" icon="info" text={error} /> : null}
      <Txt v="small" style={{ marginTop: spacing.md }}>
        Sua conta e a sua família ficam no servidor do Família Feliz. Tarefas, recompensas e mesada, por enquanto, ficam neste aparelho.
      </Txt>
    </Screen>
  );
}
