import { router } from 'expo-router';
import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { DELETE_ACCOUNT_URL, PRIVACY_URL } from '../../src/api/config';
import { account } from '../../src/data/account';
import { errorMessage } from '../../src/data/store';
import { useSession } from '../../src/hooks';
import { spacing } from '../../src/theme';
import { useFeedback } from '../../src/ui/Feedback';
import { Banner, Button, Card, Field, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

/** Exclusão de conta (exigência da Google Play e direito previsto na LGPD). */
export default function DeleteAccount() {
  const { s, me, family } = useSession();
  const fb = useFeedback();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!me) return null;

  const others = family ? s.members.filter((m) => m.familyId === family.id && m.status === 'ACTIVE' && m.id !== me.id) : [];
  const soleAdmin = me.role === 'ADMIN' && !others.some((m) => m.role === 'ADMIN');
  const guardian = others.find((m) => m.role === 'GUARDIAN');

  const submit = async () => {
    setError('');
    const ok = await fb.confirm({
      title: 'Excluir sua conta?',
      message: 'Seu nome, e-mail e dados pessoais serão apagados agora. Isso não pode ser desfeito.',
      confirmLabel: 'Excluir conta',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await account.deleteAccount(password);
      fb.toast(res.closedFamilies ? 'Conta e família excluídas.' : 'Conta excluída.');
      router.replace('/welcome');
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen title="Excluir minha conta">
      <Card style={{ gap: spacing.xs }}>
        <Txt v="bodyStrong">O que acontece</Txt>
        <Txt v="body">• Seu nome, e-mail, senha, apelidos, notificações, preferências, linha do tempo e configurações de mesada são apagados na hora.</Txt>
        {others.length === 0 ? (
          <Txt v="body">• Você é a única pessoa em {family?.name}: a família e todos os registros dela também serão apagados.</Txt>
        ) : (
          <Txt v="body">
            • Em {family?.name}, os lançamentos já feitos (pontos, pedidos, mesada) ficam no histórico como “Conta excluída”, para as contas das outras
            pessoas continuarem certas.
          </Txt>
        )}
        <Txt v="body">• Não dá para desfazer.</Txt>
      </Card>

      {others.length > 0 && soleAdmin ? (
        <View style={{ marginTop: spacing.md }}>
          {guardian ? (
            <Banner tone="info" icon="info" text={`Você é a única pessoa na administração. ${guardian.nickname || guardian.displayName.split(' ')[0]} passará a administrar a família.`} />
          ) : (
            <Banner
              tone="attention"
              icon="alert-triangle"
              text="Você é a única pessoa adulta na administração. Antes de excluir, promova alguém a responsável ou administrador (Família → pessoa)."
            />
          )}
        </View>
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        <Field
          testID="delete-password"
          label="Confirme com a sua senha"
          value={password}
          onChangeText={setPassword}
          secure
          autoCapitalize="none"
          autoComplete="current-password"
        />
      </View>
      {error ? <Banner tone="attention" icon="info" text={error} /> : null}

      <View style={{ marginTop: spacing.lg, gap: spacing.xs }}>
        <Button
          testID="delete-submit"
          label={busy ? 'Excluindo…' : 'Excluir minha conta'}
          variant="danger"
          icon="trash-2"
          onPress={submit}
          disabled={busy || password.length === 0}
        />
        <Button label="Cancelar" variant="secondary" onPress={() => router.back()} disabled={busy} />
      </View>

      <Txt v="small" style={{ marginTop: spacing.lg }}>
        Também dá para excluir pela web, em {DELETE_ACCOUNT_URL.replace(/^https?:\/\//, '')}. Saiba mais na{' '}
        <Txt v="small" style={{ textDecorationLine: 'underline' }} onPress={() => Linking.openURL(PRIVACY_URL)}>
          política de privacidade
        </Txt>
        .
      </Txt>
    </Screen>
  );
}
