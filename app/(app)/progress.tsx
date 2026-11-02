import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { ACHIEVEMENTS, DONE_STATUSES, goalProgress, memberStats, scoreTotal } from '../../src/data/rules';
import { actions, memberName } from '../../src/data/store';
import { addDays, dayKey, formatDateTime, formatShortDate, pts } from '../../src/data/util';
import { useRun, useSession } from '../../src/hooks';
import { colors, spacing } from '../../src/theme';
import { ListCard } from '../../src/ui/domain';
import { useFeedback } from '../../src/ui/Feedback';
import { Button, Card, Chip, Empty, Icon, Pill, ProgressBar, Row, Section, Segmented, Stat, Txt, type IconName } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

const typeLabel: Record<string, string> = {
  TASK_APPROVAL: 'Tarefa aprovada',
  TASK_AUTO_COMPLETION: 'Tarefa concluída',
  MANUAL_BONUS: 'Reconhecimento',
  GOAL_COMPLETION_BONUS: 'Bônus de meta',
  REVERSAL: 'Correção',
};

export default function Progress() {
  const { s, me, family, members, canApprove, canManage } = useSession();
  const fb = useFeedback();
  const run = useRun();
  const [who, setWho] = useState<string | undefined>(me?.role === 'MEMBER' ? me.id : members.find((m) => m.role === 'MEMBER')?.id ?? me?.id);
  const [tab, setTab] = useState<'person' | 'family'>('person');
  if (!me || !family) return null;
  const today = dayKey();
  const viewable = canApprove ? members : members.filter((m) => m.id === me.id);
  const target = viewable.find((m) => m.id === who) ?? me;
  const stats = memberStats(s, target.id);
  const total = scoreTotal(s, target.id);
  const unlocked = new Set(s.achievements.filter((a) => a.memberId === target.id).map((a) => a.code));
  const history = s.score.filter((t) => t.memberId === target.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 25);
  const reversed = new Set(s.score.filter((t) => t.reversesId).map((t) => t.reversesId));
  const goals = s.goals.filter((g) => g.familyId === family.id && g.status !== 'ARCHIVED').sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const bonus = async () => {
    const reason = await fb.prompt({ title: `Reconhecer ${memberName(s, target.id)}`, message: 'Por qual atitude? Ex.: ajudou o irmão sem ninguém pedir.', confirmLabel: 'Continuar', minLength: 3 });
    if (!reason) return;
    const amount = await fb.prompt({ title: 'Quantos pontos?', placeholder: 'Ex.: 10', keyboardType: 'number-pad', confirmLabel: 'Reconhecer' });
    if (amount) run(() => actions.manualBonus(target.id, Number(amount), reason), 'Reconhecimento registrado');
  };

  const reverse = async (txId: string) => {
    const reason = await fb.prompt({
      title: 'Corrigir lançamento',
      message: 'O histórico não é apagado: um lançamento de correção compensa o valor.',
      placeholder: 'Motivo da correção',
      confirmLabel: 'Corrigir',
      minLength: 3,
    });
    if (reason) run(() => actions.reverseScore(txId, reason), 'Correção registrada');
  };

  // Insights da família: agregados, sem ranking.
  const insight = (days: number) => {
    const from = addDays(today, -days + 1);
    const items = s.assignments.filter((a) => a.familyId === family.id && a.date >= from && a.date <= today && a.status !== 'CANCELED');
    const done = items.filter((a) => DONE_STATUSES.includes(a.status));
    const onTime = done.filter((a) => !a.completedLate).length;
    const essentials = items.filter((a) => s.tasks.find((t) => t.id === a.taskId)?.essential);
    const essDone = essentials.filter((a) => DONE_STATUSES.includes(a.status)).length;
    return {
      done: done.length,
      total: items.length,
      onTime: done.length ? Math.round((onTime / done.length) * 100) : 0,
      essential: essentials.length ? Math.round((essDone / essentials.length) * 100) : 0,
    };
  };

  return (
    <Screen title="Evolução" subtitle="Reconhecer o caminho, sem comparar ninguém">
      {canApprove ? (
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'person', label: 'Por pessoa' },
            { value: 'family', label: 'Família' },
          ]}
        />
      ) : null}

      {tab === 'person' ? (
        <>
          {canApprove ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md }}>
              {viewable.map((m) => (
                <Chip key={m.id} label={memberName(s, m.id)} selected={m.id === target.id} onPress={() => setWho(m.id)} />
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Stat icon="star" label="pontos no histórico" value={String(total)} />
            <Stat icon="check" label="concluídas" value={String(stats.done)} />
            <Stat icon="sun" label="dias seguidos" value={String(stats.streak)} />
          </View>

          <Section title="Conquistas">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {ACHIEVEMENTS.map((a) => {
                const on = unlocked.has(a.code);
                return (
                  <Card key={a.code} tone={on ? 'sage' : 'linen'} style={{ width: '48%', flexGrow: 1, gap: 4, opacity: on ? 1 : 0.7 }}>
                    <Icon name={a.icon as IconName} size={20} color={on ? colors.success : colors.inkMuted} />
                    <Txt v="bodyStrong">{a.title}</Txt>
                    <Txt v="small" color={on ? colors.ink : undefined}>
                      {a.description}
                    </Txt>
                    {!on ? <Txt v="small">Ainda pela frente</Txt> : null}
                  </Card>
                );
              })}
            </View>
          </Section>

          <Section title="Histórico de pontos" action={canApprove && target.id !== me.id ? 'Reconhecer' : undefined} onAction={bonus}>
            {history.length ? (
              <ListCard>
                {history.map((t) => (
                  <Row
                    key={t.id}
                    title={`${t.amount > 0 ? '+' : ''}${pts(t.amount)} · ${typeLabel[t.type] ?? t.type}`}
                    subtitle={`${t.reason ?? ''}${t.reason ? ' · ' : ''}${formatDateTime(t.createdAt)}`}
                    right={
                      reversed.has(t.id) ? (
                        <Pill label="Corrigido" />
                      ) : canManage && t.type !== 'REVERSAL' && t.memberId !== me.id ? (
                        <Button label="Corrigir" variant="ghost" small onPress={() => reverse(t.id)} />
                      ) : undefined
                    }
                  />
                ))}
              </ListCard>
            ) : (
              <Empty icon="star" title="Os primeiros pontos vêm com a primeira tarefa" />
            )}
          </Section>
        </>
      ) : (
        <>
          {[7, 30].map((d) => {
            const i = insight(d);
            return (
              <Card key={d} style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
                <Txt v="overline">ÚLTIMOS {d} DIAS · FAMÍLIA</Txt>
                <Txt v="heading">
                  {i.done} de {i.total} combinados concluídos
                </Txt>
                <ProgressBar percent={i.total ? (i.done / i.total) * 100 : 0} label={`Concluídos em ${d} dias`} />
                <Txt v="small">
                  {i.onTime}% no horário combinado · {i.essential}% das tarefas essenciais
                </Txt>
              </Card>
            );
          })}
          <Txt v="small">Os números da família são sempre agregados: servem para ajustar a rotina, não para comparar pessoas.</Txt>
        </>
      )}

      <Section title="Metas" action={canManage ? 'Nova meta' : undefined} onAction={() => router.push('/goal-edit')}>
        {goals.length ? (
          <View style={{ gap: spacing.xs }}>
            {goals.map((g) => {
              const p = goalProgress(s, g.id);
              const active = g.status === 'ACTIVE' && today <= g.endDate;
              return (
                <Card key={g.id} tone={g.status === 'COMPLETED' ? 'sage' : 'surface'} style={{ gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <Txt v="bodyStrong" style={{ flex: 1 }}>
                      {g.title}
                    </Txt>
                    {g.status === 'COMPLETED' ? <Pill label="Alcançada" tone="success" icon="check" /> : !active ? <Pill label="Encerrada" /> : null}
                  </View>
                  <ProgressBar percent={g.status === 'COMPLETED' ? 100 : p.percent} color={colors.sage} label={`Meta ${g.title}`} />
                  <Txt v="small">
                    {g.scope === 'FAMILY' ? 'Meta da família' : `Meta de ${memberName(s, g.memberId)}`} · {p.current}/{g.targetPoints} pontos ·{' '}
                    {formatShortDate(g.startDate)} a {formatShortDate(g.endDate)}
                    {g.bonusPoints ? ` · bônus de ${pts(g.bonusPoints)}` : ''}
                  </Txt>
                  {canManage && g.status === 'ACTIVE' ? (
                    <Button label="Arquivar" variant="ghost" small style={{ alignSelf: 'flex-start' }} onPress={() => run(() => actions.archiveGoal(g.id), 'Meta arquivada')} />
                  ) : null}
                </Card>
              );
            })}
          </View>
        ) : (
          <Empty icon="target" title="Nenhuma meta ainda" text="Uma meta da família une todo mundo no mesmo objetivo." />
        )}
      </Section>
    </Screen>
  );
}
