import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { DONE_STATUSES, goalProgress, isPastDue, piggySaved, streakDays, walletAvailable } from '../../../src/data/rules';
import { unreadCount } from '../../../src/data/store';
import { addDays, dayKey, firstName, pts } from '../../../src/data/util';
import { useSession } from '../../../src/hooks';
import { colors, spacing } from '../../../src/theme';
import { AssignmentRow, ListCard } from '../../../src/ui/domain';
import { Avatar, Button, Card, Empty, FeNote, Icon, ProgressBar, Section, Stat, Txt, type IconName } from '../../../src/ui/primitives';
import { Screen } from '../../../src/ui/Screen';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function Home() {
  const { s, me, family, members, canApprove, canManage } = useSession();
  if (!me || !family) return null;
  const today = dayKey();
  const name = me.nickname || firstName(me.displayName);
  const unread = unreadCount(s, me.id);

  const famToday = s.assignments.filter((a) => a.familyId === family.id && a.date === today && a.status !== 'CANCELED');
  const famDone = famToday.filter((a) => DONE_STATUSES.includes(a.status)).length;
  const mineOpen = s.assignments
    .filter((a) => a.memberId === me.id && a.status !== 'CANCELED' && (a.date === today || (isPastDue(a) && a.date >= addDays(today, -3))))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const mineTodo = mineOpen.filter((a) => !DONE_STATUSES.includes(a.status) && a.status !== 'WAITING_APPROVAL');
  const waiting = s.assignments.filter((a) => a.familyId === family.id && a.status === 'WAITING_APPROVAL' && a.memberId !== me.id);
  const pendingRedemptions = s.redemptions.filter((r) => r.familyId === family.id && r.status === 'RESERVED' && r.memberId !== me.id);
  const goal = s.goals.find((g) => g.familyId === family.id && g.status === 'ACTIVE' && g.scope === 'FAMILY' && today >= g.startDate && today <= g.endDate);
  const goalP = goal ? goalProgress(s, goal.id) : null;
  const streak = streakDays(s, me.id);
  const available = walletAvailable(s, me.id);
  const saved = piggySaved(s, me.id);

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
      <Avatar name={me.nickname || me.displayName} tone={me.tone} size={44} />
      <View style={{ flex: 1 }}>
        <Txt v="small">{family.name}</Txt>
        <Txt v="title">
          {greeting()}, {name}
        </Txt>
      </View>
    </View>
  );

  const bell = { icon: 'bell' as const, label: unread ? `Notificações, ${unread} novas` : 'Notificações', onPress: () => router.push('/notifications'), badge: unread };

  // ---------- Responsáveis
  if (canApprove) {
    const focus =
      waiting.length > 0
        ? { tone: 'lavender' as const, icon: 'eye' as IconName, title: waiting.length === 1 ? '1 tarefa esperando o seu olhar' : `${waiting.length} tarefas esperando o seu olhar`, text: 'Revise com calma. Um comentário gentil faz diferença.', cta: 'Revisar agora', go: '/approvals' }
        : pendingRedemptions.length > 0
          ? { tone: 'sand' as const, icon: 'gift' as IconName, title: pendingRedemptions.length === 1 ? 'Um pedido de recompensa' : `${pendingRedemptions.length} pedidos de recompensa`, text: 'Alguém escolheu como usar os pontos.', cta: 'Ver pedidos', go: '/redemptions' }
          : null;

    return (
      <Screen tab back={false} right={bell}>
        {header}
        {focus ? (
          <Card tone={focus.tone} style={{ gap: spacing.xs }}>
            <Icon name={focus.icon} size={22} color={colors.ink} />
            <Txt v="heading">{focus.title}</Txt>
            <Txt v="small" color={colors.ink}>
              {focus.text}
            </Txt>
            <Button testID="home-focus" label={focus.cta} small style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={() => router.push(focus.go)} />
          </Card>
        ) : (
          <FeNote mode="orientar">Nada esperando por você agora. Um bom momento para um café.</FeNote>
        )}

        <Section title="Hoje em família" action="Ver tarefas" onAction={() => router.push('/tasks')}>
          <Card style={{ gap: spacing.sm }}>
            {famToday.length ? (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt v="bodyStrong">
                    {famDone} de {famToday.length} combinados concluídos
                  </Txt>
                  <Txt v="small">{Math.round((famDone / famToday.length) * 100)}%</Txt>
                </View>
                <ProgressBar percent={(famDone / famToday.length) * 100} label="Combinados concluídos hoje" />
              </>
            ) : (
              <Txt v="body">Nenhum combinado para hoje.</Txt>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
              {members.map((m) => (
                <View key={m.id} style={{ alignItems: 'center', width: 64 }} accessibilityLabel={m.nickname || m.displayName}>
                  <Avatar name={m.nickname || m.displayName} tone={m.tone} size={40} />
                  <Txt v="small" numberOfLines={1}>
                    {m.nickname || firstName(m.displayName)}
                  </Txt>
                </View>
              ))}
            </View>
          </Card>
        </Section>

        {goal && goalP ? (
          <Section title="Meta da família" action="Evolução" onAction={() => router.push('/progress')}>
            <Card tone="sage" style={{ gap: spacing.xs }}>
              <Txt v="bodyStrong">{goal.title}</Txt>
              <ProgressBar percent={goalP.percent} color={colors.sage} label={`Meta ${goal.title}`} />
              <Txt v="small" color={colors.ink}>
                {goalP.current} de {pts(goal.targetPoints)} juntos esta semana
              </Txt>
            </Card>
          </Section>
        ) : null}

        {mineOpen.length ? (
          <Section title="Suas tarefas de hoje">
            <ListCard>
              {mineOpen.map((a) => (
                <AssignmentRow key={a.id} s={s} a={a} />
              ))}
            </ListCard>
          </Section>
        ) : null}

        <Section title="Atalhos">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            <Button label="Nova tarefa" icon="plus" variant="secondary" small onPress={() => router.push('/task-edit')} />
            {canManage ? <Button label="Convidar" icon="user-plus" variant="secondary" small onPress={() => router.push('/invitations')} /> : null}
            {canManage ? <Button label="Mesada" icon="dollar-sign" variant="secondary" small onPress={() => router.push('/allowance')} /> : null}
            <Button label="Evolução" icon="trending-up" variant="secondary" small onPress={() => router.push('/progress')} />
          </View>
        </Section>
      </Screen>
    );
  }

  // ---------- Participantes
  const next = mineTodo[0];
  const nextTask = next ? s.tasks.find((t) => t.id === next.taskId) : undefined;
  const doneToday = mineOpen.filter((a) => DONE_STATUSES.includes(a.status) || a.status === 'WAITING_APPROVAL').length;

  return (
    <Screen tab back={false} right={bell}>
      {header}
      {next && nextTask ? (
        <Card tone="teal" style={{ gap: spacing.xs }}>
          <Txt v="overline">PRÓXIMO PASSO</Txt>
          <Txt v="title">{nextTask.title}</Txt>
          {nextTask.description ? (
            <Txt v="small" color={colors.ink}>
              {nextTask.description}
            </Txt>
          ) : null}
          <Button testID="home-next" label="Abrir tarefa" small style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={() => router.push(`/assignment/${next.id}`)} />
        </Card>
      ) : mineOpen.length ? (
        <FeNote mode="celebrar">Você fez tudo o que estava combinado para hoje. Que orgulho sereno!</FeNote>
      ) : (
        <FeNote mode="orientar">Hoje não tem combinado para você. Aproveite o dia!</FeNote>
      )}

      <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg }}>
        <Stat icon="check" label="feitas hoje" value={`${doneToday}/${mineOpen.length}`} />
        <Stat icon="star" label="pontos para usar" value={String(available)} />
        <Stat icon="sun" label={streak === 1 ? 'dia seguido' : 'dias seguidos'} value={String(streak)} />
      </View>

      <Section title="Suas tarefas de hoje" action="Ver todas" onAction={() => router.push('/tasks')}>
        {mineOpen.length ? (
          <ListCard>
            {mineOpen.map((a) => (
              <AssignmentRow key={a.id} s={s} a={a} />
            ))}
          </ListCard>
        ) : (
          <Empty fe icon="sun" title="Dia livre" text="Quando alguém combinar uma tarefa com você, ela aparece aqui." />
        )}
      </Section>

      {goal && goalP ? (
        <Section title="Meta da família">
          <Card tone="sage" style={{ gap: spacing.xs }}>
            <Txt v="bodyStrong">{goal.title}</Txt>
            <ProgressBar percent={goalP.percent} color={colors.sage} label={`Meta ${goal.title}`} />
            <Txt v="small" color={colors.ink}>
              Todo mundo junto: {goalP.current} de {pts(goal.targetPoints)}
            </Txt>
          </Card>
        </Section>
      ) : null}

      <Section title="Sua carteira" action="Abrir" onAction={() => router.push('/wallet')}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }} onPress={() => router.push('/wallet')} accessibilityLabel="Abrir carteira">
          <Icon name="star" size={24} color={colors.teal} />
          <View style={{ flex: 1 }}>
            <Txt v="heading">{pts(available)} para usar</Txt>
            <Txt v="small">{saved ? `${pts(saved)} guardados em cofrinhos` : 'Você pode guardar pontos num cofrinho'}</Txt>
          </View>
        </Card>
      </Section>
    </Screen>
  );
}
