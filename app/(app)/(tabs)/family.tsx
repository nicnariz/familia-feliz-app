import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { account } from '../../../src/data/account';
import { roleLabel } from '../../../src/data/rules';
import { formatDateTime } from '../../../src/data/util';
import { useSession } from '../../../src/hooks';
import { colors, spacing } from '../../../src/theme';
import { ListCard } from '../../../src/ui/domain';
import { Avatar, Button, Card, Empty, Icon, Row, Section, Txt, type IconName } from '../../../src/ui/primitives';
import { Screen } from '../../../src/ui/Screen';

const kindIcon: Record<string, IconName> = {
  TASK_DONE: 'check-circle',
  ACHIEVEMENT: 'award',
  GOAL_COMPLETED: 'target',
  REWARD_FULFILLED: 'gift',
  MEMBER_JOINED: 'user-plus',
  PIGGY_COMPLETED: 'archive',
  FAMILY_CREATED: 'home',
};

export default function FamilyTab() {
  const { s, me, family, members, canManage } = useSession();
  // Atualiza quem está na família (silencioso; sem internet, mostra o que está salvo).
  useEffect(() => {
    void account.refresh().catch(() => undefined);
  }, []);
  if (!me || !family) return null;
  const values = s.values.filter((v) => v.familyId === family.id);
  const events = s.timeline.filter((t) => t.familyId === family.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  return (
    <Screen tab back={false} title={family.name} right={canManage ? { icon: 'edit-2', label: 'Editar família', onPress: () => router.push('/family-edit') } : undefined}>
      <Section title="Pessoas" style={{ marginTop: spacing.xs }} action={canManage ? 'Convidar' : undefined} onAction={() => router.push('/invitations')}>
        <ListCard>
          {members.map((m) => (
            <Row
              key={m.id}
              testID={`member-${m.id}`}
              title={`${m.nickname || m.displayName}${m.id === me.id ? ' (você)' : ''}`}
              subtitle={roleLabel[m.role]}
              left={<Avatar name={m.nickname || m.displayName} tone={m.tone} />}
              onPress={() => router.push(m.id === me.id ? '/profile' : `/member/${m.id}`)}
            />
          ))}
        </ListCard>
      </Section>

      <Section title="Nossos valores" action={canManage ? 'Editar' : undefined} onAction={() => router.push('/values')}>
        {values.length ? (
          <View style={{ gap: spacing.xs }}>
            {values.map((v) => (
              <Card key={v.id} tone="sand" style={{ gap: 2 }}>
                <Txt v="bodyStrong">{v.title}</Txt>
                {v.description ? (
                  <Txt v="small" color={colors.ink}>
                    {v.description}
                  </Txt>
                ) : null}
              </Card>
            ))}
          </View>
        ) : (
          <Empty
            icon="heart"
            title="Quais valores guiam a família?"
            text="Ex.: cuidado, cooperação, aprender sempre. As tarefas podem se ligar a eles."
            action={canManage ? 'Escrever valores' : undefined}
            onAction={canManage ? () => router.push('/values') : undefined}
          />
        )}
      </Section>

      <Section title="Momentos recentes" action="Evolução" onAction={() => router.push('/progress')}>
        {events.length ? (
          <ListCard>
            {events.map((e) => (
              <Row
                key={e.id}
                title={e.text}
                subtitle={formatDateTime(e.createdAt)}
                left={
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={kindIcon[e.kind] ?? 'feather'} size={16} color={colors.success} />
                  </View>
                }
              />
            ))}
          </ListCard>
        ) : (
          <Empty icon="clock" title="A história começa agora" text="Conquistas e momentos da família aparecem aqui." />
        )}
      </Section>

      {canManage ? (
        <View style={{ gap: spacing.xs, marginTop: spacing.xl }}>
          <Button label="Convites" icon="mail" variant="secondary" onPress={() => router.push('/invitations')} />
          <Button label="Mesada" icon="dollar-sign" variant="secondary" onPress={() => router.push('/allowance')} />
        </View>
      ) : null}
    </Screen>
  );
}
