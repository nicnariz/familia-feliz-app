import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { account } from '../../src/data/account';
import { roleLabel } from '../../src/data/rules';
import { errorMessage } from '../../src/data/store';
import { colors, spacing } from '../../src/theme';
import { Banner, Button, Card, Field, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

type Preview = { familyName: string; role: 'GUARDIAN' | 'MEMBER'; code: string };

export default function Join() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(params.code ?? '');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async (value = code) => {
    setError(null);
    setBusy(true);
    try {
      setPreview(await account.previewInvitation(value));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  // Código vindo de um convite guardado: já mostra a prévia.
  useEffect(() => {
    if (params.code) void check(params.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accept = async () => {
    setError(null);
    setBusy(true);
    try {
      await account.acceptInvitation(preview!.code);
      router.replace('/ready?joined=1');
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen
      title="Entrar com convite"
      footer={
        preview ? (
          <>
            <Button testID="join-accept" label={`Entrar na ${preview.familyName}`} onPress={accept} loading={busy} />
            <Button label="Usar outro código" variant="ghost" small onPress={() => setPreview(null)} />
          </>
        ) : (
          <Button testID="join-check" label="Ver convite" onPress={() => check()} loading={busy} disabled={code.trim().length < 6} />
        )
      }
    >
      {!preview ? (
        <>
          <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
            <Txt v="title">Qual é o código?</Txt>
            <Txt v="body" color={colors.inkSoft}>
              São 8 letras e números, enviados por alguém da administração da família.
            </Txt>
          </View>
          <Field testID="join-code" label="Código do convite" value={code} onChangeText={setCode} autoCapitalize="characters" maxLength={16} placeholder="Ex.: K7M2Q9PX" />
          {busy ? <ActivityIndicator color={colors.teal} /> : null}
        </>
      ) : (
        <Card tone="teal" style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
          <Txt v="overline">CONVITE</Txt>
          <Txt v="title">{preview.familyName}</Txt>
          <Txt v="body">Você vai participar como {roleLabel[preview.role].toLowerCase()}.</Txt>
        </Card>
      )}
      {error ? <Banner tone="attention" text={error} /> : null}
    </Screen>
  );
}
