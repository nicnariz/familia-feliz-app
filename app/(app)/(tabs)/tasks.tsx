import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { DONE_STATUSES, isPastDue } from '../../../src/data/rules';
import { memberName } from '../../../src/data/store';
import { addDays, dayKey, formatDay, pts } from '../../../src/data/util';
import { useSession } from '../../../src/hooks';
import { colors, spacing } from '../../../src/theme';
import { AssignmentRow, ListCard, recurrenceText } from '../../../src/ui/domain';
import { Button, Empty, Icon, Pill, Row, Section, Segmented, Txt } from '../../../src/ui/primitives';
import { Screen } from '../../../src/ui/Screen';

type ApproverTab = 'today' | 'review' | 'all';
type MemberTab = 'today' | 'next' | 'done';

export default function Tasks() {
  const { s, me, family, members, canApprove } = useSession();
  const [aTab, setATab] = useState<ApproverTab>('today');
  const [mTab, setMTab] = useState<MemberTab>('today');
  if (!me || !family) return null;
  const today = dayKey();
  const fam = s.assignments.filter((a) => a.familyId === family.id && a.status !== 'CANCELED');
  const recentPastDue = (a: (typeof fam)[number]) => isPastDue(a) && a.date >= addDays(today, -3) && a.date < today;

  if (canApprove) {
    const waiting = fam.filter((a) => a.status === 'WAITING_APPROVAL' && a.memberId !== me.id).sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''));
    const tasks = s.tasks.filter((t) => t.familyId === family.id && t.status === 'ACTIVE');
    return (
      <Screen tab back={false} title="Tarefas" right={{ icon: 'plus', label: 'Nova tarefa', onPress: () => router.push('/task-edit') }}>
        <Segmented<ApproverTab>
          value={aTab}
          onChange={setATab}
          options={[
            { value: 'today', label: 'Hoje' },
            { value: 'review', label: waiting.length ? `Revisar (${waiting.length})` : 'Revisar' },
            { value: 'all', label: 'Combinados' },
          ]}
        />
        {aTab === 'today'
          ? members.map((m) => {
              const items = fam
                .filter((a) => a.memberId === m.id && (a.date === today || recentPastDue(a)))
                .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
              if (!items.length) return null;
              return (
                <Section key={m.id} title={memberName(s, m.id)} style={{ marginTop: spacing.md }}>
                  <ListCard>
                    {items.map((a) => (
                      <AssignmentRow key={a.id} s={s} a={a} showDate={a.date !== today} />
                    ))}
                  </ListCard>
                </Section>
              );
            })
          : null}
        {aTab === 'today' && !fam.some((a) => a.date === today) ? (
          <Empty icon="sun" title="Nenhum combinado para hoje" text="Crie uma tarefa e escolha quem vai fazer." action="Nova tarefa" onAction={() => router.push('/task-edit')} />
        ) : null}

        {aTab === 'review' ? (
          waiting.length ? (
            <ListCard>
              {waiting.map((a) => (
                <AssignmentRow key={a.id} s={s} a={a} showPerson showDate />
              ))}
            </ListCard>
          ) : (
            <Empty icon="check-circle" title="Nada para revisar" text="Quando alguém concluir uma tarefa que pede revisão, ela aparece aqui." />
          )
        ) : null}

        {aTab === 'all' ? (
          tasks.length ? (
            <ListCard>
              {tasks.map((t) => (
                <Row
                  key={t.id}
                  title={t.title}
                  subtitle={`${recurrenceText(t)} · ${t.assigneeIds.map((id) => memberName(s, id)).join(', ')} · ${pts(t.points)}`}
                  onPress={() => router.push(`/task/${t.id}`)}
                  right={t.requiresApproval ? <Pill label="Revisão" tone="lavender" /> : undefined}
                />
              ))}
            </ListCard>
          ) : (
            <Empty fe icon="clipboard" title="Nenhum combinado ainda" text="Comece por algo simples, como arrumar a cama." action="Criar tarefa" onAction={() => router.push('/task-edit')} />
          )
        ) : null}
        <View style={{ height: spacing.xl }} />
        <Button label="Nova tarefa" icon="plus" onPress={() => router.push('/task-edit')} />
      </Screen>
    );
  }

  // Participante: só as próprias tarefas.
  const mine = fam.filter((a) => a.memberId === me.id);
  const todayItems = mine.filter((a) => a.date === today || recentPastDue(a)).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const nextItems = mine.filter((a) => a.date > today && a.date <= addDays(today, 7)).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const doneItems = mine
    .filter((a) => DONE_STATUSES.includes(a.status) || a.status === 'WAITING_APPROVAL')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, 30);
  const byDay = nextItems.reduce<Record<string, typeof nextItems>>((acc, a) => {
    (acc[a.date] ||= []).push(a);
    return acc;
  }, {});

  return (
    <Screen tab back={false} title="Minhas tarefas">
      <Segmented<MemberTab>
        value={mTab}
        onChange={setMTab}
        options={[
          { value: 'today', label: 'Hoje' },
          { value: 'next', label: 'Próximos dias' },
          { value: 'done', label: 'Feitas' },
        ]}
      />
      {mTab === 'today' ? (
        todayItems.length ? (
          <ListCard>
            {todayItems.map((a) => (
              <AssignmentRow key={a.id} s={s} a={a} showDate={a.date !== today} />
            ))}
          </ListCard>
        ) : (
          <Empty icon="sun" title="Dia livre" text="Nenhuma tarefa combinada para hoje." />
        )
      ) : null}
      {mTab === 'next'
        ? Object.keys(byDay).length
          ? Object.entries(byDay).map(([day, items]) => (
              <Section key={day} title={formatDay(day)} style={{ marginTop: spacing.md }}>
                <ListCard>
                  {items.map((a) => (
                    <AssignmentRow key={a.id} s={s} a={a} />
                  ))}
                </ListCard>
              </Section>
            ))
          : <Empty icon="calendar" title="Semana tranquila" text="Nada combinado para os próximos 7 dias." />
        : null}
      {mTab === 'done' ? (
        doneItems.length ? (
          <ListCard>
            {doneItems.map((a) => (
              <AssignmentRow key={a.id} s={s} a={a} showDate />
            ))}
          </ListCard>
        ) : (
          <Empty icon="check" title="Ainda nada por aqui" text="As tarefas que você concluir aparecem nesta lista." />
        )
      ) : null}
      {mTab === 'today' && todayItems.some((a) => isPastDue(a)) ? (
        <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center', marginTop: spacing.md }}>
          <Icon name="info" size={14} color={colors.inkMuted} />
          <Txt v="small" style={{ flex: 1 }}>
            Passou do horário? Tudo bem, ainda dá para concluir.
          </Txt>
        </View>
      ) : null}
    </Screen>
  );
}
