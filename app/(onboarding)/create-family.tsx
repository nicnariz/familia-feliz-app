import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { account } from '../../src/data/account';
import { errorMessage } from '../../src/data/store';
import { useSession } from '../../src/hooks';
import { colors, spacing } from '../../src/theme';
import { Banner, Button, Field, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

export default function CreateFamily() {
  const { user } = useSession();
  const [name, setName] = useState('');
  const [display, setDisplay] = useState(user?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await account.createFamily(name, display);
      router.replace('/invite?first=1');
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen title="Criar família" footer={<Button testID="create-family-submit" label="Criar família" onPress={submit} loading={busy} />}>
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <Txt v="title">Como a sua família se chama?</Txt>
        <Txt v="body" color={colors.inkSoft}>
          Pode ser o sobrenome, um apelido carinhoso ou o nome da casa.
        </Txt>
      </View>
      <Field testID="family-name" label="Nome da família" value={name} onChangeText={setName} placeholder="Ex.: Família Souza" maxLength={60} />
      {account.isDemo() ? (
        <Field label="Seu nome na família" value={display} onChangeText={setDisplay} hint="É assim que as outras pessoas vão ver você." maxLength={60} />
      ) : null}
      {error ? <Banner tone="attention" text={error} /> : null}
    </Screen>
  );
}
