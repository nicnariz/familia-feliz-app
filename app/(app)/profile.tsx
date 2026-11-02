import React from 'react';
import { View } from 'react-native';
import { roleLabel } from '../../src/data/rules';
import { account } from '../../src/data/account';
import { formatShortDate } from '../../src/data/util';
import { useRun, useSession } from '../../src/hooks';
import { spacing } from '../../src/theme';
import { useFeedback } from '../../src/ui/Feedback';
import { Avatar, Banner, Button, Card, Row, Section, Txt } from '../../src/ui/primitives';
import { ListCard } from '../../src/ui/domain';
import { Screen } from '../../src/ui/Screen';

/**
 * Perfil. DEC-0021 (pendente): a API só permite que a administração edite membros,
 * inclusive o apelido. Aqui seguimos a regra do servidor.
 */
export default function Profile() {
  const { me, user, family, canManage } = useSession();
  const fb = useFeedback();
  const run = useRun();
  if (!me || !user) return null;
  const name = me.nickname || me.displayName;

  const nickname = async () => {
    const v = await fb.prompt({ title: 'Seu apelido', initial: me.nickname ?? '', placeholder: 'Deixe vazio para usar o nome', minLength: 0, confirmLabel: 'Salvar' });
    if (v !== null) await run(() => account.updateNickname(me.id, v), 'Apelido salvo');
  };

  return (
    <Screen title="Meu perfil">
      <View style={{ alignItems: 'center', gap: spacing.xs, marginBottom: spacing.lg }}>
        <Avatar name={name} tone={me.tone} size={80} />
        <Txt v="title">{name}</Txt>
        <Txt v="small">
          {roleLabel[me.role]} · {family?.name}
        </Txt>
      </View>
      <ListCard>
        <Row title="Nome" subtitle={me.displayName} />
        <Row title="E-mail" subtitle={user.email} />
        <Row title="Na família desde" subtitle={formatShortDate(me.joinedAt.slice(0, 10))} />
      </ListCard>
      <Section title="Apelido">
        <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Txt v="body" style={{ flex: 1 }}>
            {me.nickname || 'Sem apelido'}
          </Txt>
          {canManage ? <Button label="Alterar" variant="ghost" small onPress={nickname} /> : null}
        </Card>
        {!canManage ? (
          <View style={{ marginTop: spacing.xs }}>
            <Banner tone="info" text="Quer um apelido? Peça para alguém da administração da família alterar." />
          </View>
        ) : null}
      </Section>
      <Txt v="small" style={{ marginTop: spacing.lg }}>
        Nome, foto e data de nascimento ainda não podem ser editados nesta versão.
      </Txt>
    </Screen>
  );
}
