import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { account } from '../../src/data/account';
import { myMemberships } from '../../src/data/store';
import { firstName } from '../../src/data/util';
import { useSession } from '../../src/hooks';
import { colors, spacing } from '../../src/theme';
import { Button, Card, FeNote, Icon, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

export default function Start() {
  const { s, user } = useSession();
  const memberships = myMemberships(s);
  const pending = s.pendingInviteCode;

  return (
    <Screen back={false} footer={<Button label="Sair" variant="ghost" small onPress={() => account.logout()} />}>
      <View style={{ paddingTop: spacing.xl, gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Txt v="overline">PRIMEIROS PASSOS</Txt>
          <Txt v="display">Olá, {firstName(user?.name ?? '')}!</Txt>
          <Txt v="body" color={colors.inkSoft}>
            Vamos montar o cantinho da sua família. Você pode começar uma nova ou entrar numa que já existe.
          </Txt>
        </View>
        {pending ? (
          <Card tone="teal" style={{ gap: spacing.sm }}>
            <Txt v="bodyStrong">Você tem um convite guardado</Txt>
            <Txt v="small" color={colors.ink} numberOfLines={1}>Código {pending}</Txt>
            <Button label="Ver convite" onPress={() => router.push(`/join?code=${encodeURIComponent(pending)}`)} />
          </Card>
        ) : null}
        <Card onPress={() => router.push('/create-family')} accessibilityLabel="Criar uma família" style={{ gap: spacing.xs }}>
          <Icon name="home" size={24} color={colors.teal} />
          <Txt v="heading">Criar uma família</Txt>
          <Txt v="small">Você fica na administração e convida as outras pessoas depois.</Txt>
        </Card>
        <Card onPress={() => router.push('/join')} accessibilityLabel="Entrar com um convite" style={{ gap: spacing.xs }}>
          <Icon name="mail" size={24} color={colors.teal} />
          <Txt v="heading">Entrar com um convite</Txt>
          <Txt v="small">Alguém da sua família te enviou um código? Use aqui.</Txt>
        </Card>
        {memberships.length > 0 ? (
          <Button
            label="Voltar para a minha família"
            variant="secondary"
            onPress={async () => {
              await account.setActiveFamily(memberships[0].familyId).catch(() => undefined);
              router.replace('/');
            }}
          />
        ) : null}
        <FeNote mode="orientar">Não tem pressa. Dá para convidar as pessoas e criar tarefas aos poucos.</FeNote>
      </View>
    </Screen>
  );
}
