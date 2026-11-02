import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { DONE_STATUSES } from '../../../src/data/rules';
import { actions, memberName } from '../../../src/data/store';
import { dayKey, pts } from '../../../src/data/util';
import { useRun, useSession } from '../../../src/hooks';
import { colors, spacing } from '../../../src/theme';
import { AssignmentRow, ListCard, recurrenceText } from '../../../src/ui/domain';
import { useFeedback } from '../../../src/ui/Feedback';
import { Button, Card, Empty, Pill, Section, Txt } from '../../../src/ui/primitives';
import { Screen } from '../../../src/ui/Screen';

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { s, family, canApprove } = useSession();
  const fb = useFeedback();
  const run = useRun();
  const t = s.tasks.find((x) => x.id === id && x.familyId === family?.id);
  if (!t) return <Screen title="Tarefa"><Empty icon="search" title="Tarefa não encontrada" /></Screen>;
  const value = s.values.find((v) => v.id === t.valueId);
  const today = dayKey();
  const upcoming = s.assignments.filter((a) => a.taskId === t.id && a.date >= today && a.status !== 'CANCELED').sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 8);
  const doneCount = s.assignments.filter((a) => a.taskId === t.id && DONE_STATUSES.includes(a.status)).length;

  const cancel = async () => {
    const ok = await fb.confirm({
      title: 'Encerrar este combinado?',
      message: 'As próximas ocorrências em aberto serão canceladas. O que já foi feito continua no histórico.',
      confirmLabel: 'Encerrar',
      destructive: true,
    });
    if (ok && await run(() => actions.cancelTask(t.id), 'Combinado encerrado')) router.back();
  };

  return (
    <Screen
      title={t.title}
      right={canApprove && t.status === 'ACTIVE' ? { icon: 'edit-2', label: 'Editar tarefa', onPress: () => router.push(`/task-edit?id=${t.id}`) } : undefined}
    >
      <Card style={{ gap: spacing.xs }}>
        {t.description ? <Txt v="body">{t.description}</Txt> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          <Pill label={recurrenceText(t)} icon="repeat" />
          <Pill label={`até ${t.dueTime}`} icon="clock" />
          <Pill label={pts(t.points)} icon="star" tone="teal" />
          {t.requiresApproval ? <Pill label="Com revisão" tone="lavender" icon="eye" /> : null}
          {t.requiresEvidence ? <Pill label="Com registro" icon="camera" /> : null}
          {t.essential ? <Pill label="Essencial" tone="success" icon="home" /> : null}
          {value ? <Pill label={value.title} icon="heart" /> : null}
          {t.status === 'CANCELED' ? <Pill label="Encerrado" tone="attention" /> : null}
        </View>
        <Txt v="small" color={colors.ink}>
          Com: {t.assigneeIds.map((m) => memberName(s, m)).join(', ')} · {doneCount} vezes concluída
        </Txt>
      </Card>
      <Section title="Próximas vezes">
        {upcoming.length ? (
          <ListCard>
            {upcoming.map((a) => (
              <AssignmentRow key={a.id} s={s} a={a} showPerson showDate />
            ))}
          </ListCard>
        ) : (
          <Empty icon="calendar" title="Nada programado" />
        )}
      </Section>
      {canApprove && t.status === 'ACTIVE' ? (
        <Button label="Encerrar combinado" variant="danger" icon="x-circle" style={{ marginTop: spacing.xl }} onPress={cancel} />
      ) : null}
    </Screen>
  );
}
