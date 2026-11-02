// Componentes de domínio compartilhados entre telas.
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { assignmentView, isPastDue, statusText } from '../data/rules';
import { memberName } from '../data/store';
import type { AppState, Assignment, Task } from '../data/types';
import { WEEKDAY_SHORT, formatDay, formatTime, formatShortDate, pts } from '../data/util';
import { colors, spacing } from '../theme';
import { Avatar, Icon, Pill, Row, type IconName } from './primitives';

export function recurrenceText(t: Task): string {
  if (t.recurrence === 'NONE') return `Uma vez · ${formatShortDate(t.startDate)}`;
  if (t.recurrence === 'DAILY') return 'Todos os dias';
  const days = [...t.weekdays].sort();
  if (days.join() === '1,2,3,4,5') return 'Dias de semana';
  if (days.join() === '0,6') return 'Fins de semana';
  return days.map((d) => WEEKDAY_SHORT[d]).join(', ');
}

const viewIcon: Record<ReturnType<typeof assignmentView>, IconName> = {
  todo: 'circle',
  doing: 'play-circle',
  review: 'eye',
  adjust: 'edit-3',
  done: 'check-circle',
  canceled: 'slash',
};

export function AssignmentStatus({ a }: { a: Assignment }) {
  const v = assignmentView(a);
  if (isPastDue(a)) return <Pill tone="attention" icon="clock" label="Passou do horário" />;
  const tone = v === 'done' ? 'success' : v === 'review' ? 'lavender' : v === 'adjust' ? 'attention' : v === 'doing' ? 'teal' : 'neutral';
  return <Pill tone={tone} icon={viewIcon[v]} label={statusText[v]} />;
}

export function AssignmentRow({
  s,
  a,
  showPerson,
  showDate,
}: {
  s: AppState;
  a: Assignment;
  showPerson?: boolean;
  showDate?: boolean;
}) {
  const task = s.tasks.find((t) => t.id === a.taskId);
  const member = s.members.find((m) => m.id === a.memberId);
  const when = showDate ? `${formatDay(a.date)} · até ${formatTime(a.dueAt)}` : `até ${formatTime(a.dueAt)}`;
  const parts = [showPerson ? memberName(s, a.memberId) : null, when, a.expectedPoints ? pts(a.expectedPoints) : null].filter(Boolean);
  return (
    <Row
      testID={`asg-${a.id}`}
      title={task?.title ?? 'Tarefa'}
      subtitle={parts.join(' · ')}
      onPress={() => router.push(`/assignment/${a.id}`)}
      left={
        showPerson && member ? (
          <Avatar name={member.nickname || member.displayName} tone={member.tone} size={36} />
        ) : (
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={task?.essential ? 'home' : 'check-square'} size={16} color={colors.teal} />
          </View>
        )
      }
      meta={<AssignmentStatus a={a} />}
    />
  );
}

export function ListCard({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden' }}>
      {items.map((c, i) => (
        <View key={i}>
          {i > 0 ? <View style={{ height: 1, backgroundColor: colors.lineSoft, marginLeft: spacing.md }} /> : null}
          {c}
        </View>
      ))}
    </View>
  );
}
