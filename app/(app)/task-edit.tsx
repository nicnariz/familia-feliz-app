import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { actions, errorMessage, memberName } from '../../src/data/store';
import type { Recurrence } from '../../src/data/types';
import { WEEKDAY_SHORT, dayKey } from '../../src/data/util';
import { useSession } from '../../src/hooks';
import { spacing } from '../../src/theme';
import { useFeedback } from '../../src/ui/Feedback';
import { Banner, Button, Chip, Field, Section, Segmented, ToggleRow, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

export default function TaskEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { s, me, members, family } = useSession();
  const fb = useFeedback();
  const existing = id ? s.tasks.find((t) => t.id === id) : undefined;
  const values = s.values.filter((v) => v.familyId === family?.id);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [points, setPoints] = useState(String(existing?.points ?? 10));
  const [recurrence, setRecurrence] = useState<Recurrence>(existing?.recurrence ?? 'DAILY');
  const [weekdays, setWeekdays] = useState<number[]>(existing?.weekdays ?? [1, 2, 3, 4, 5]);
  const [startDate, setStartDate] = useState(existing?.startDate ?? dayKey());
  const [endDate, setEndDate] = useState(existing?.endDate ?? '');
  const [dueTime, setDueTime] = useState(existing?.dueTime ?? '18:00');
  const defaultAssignees = members.filter((m) => m.role === 'MEMBER').map((m) => m.id);
  const [assignees, setAssignees] = useState<string[]>(existing?.assigneeIds ?? (defaultAssignees.length ? defaultAssignees : [me!.id]));
  const [requiresApproval, setRequiresApproval] = useState(existing?.requiresApproval ?? true);
  const [requiresEvidence, setRequiresEvidence] = useState(existing?.requiresEvidence ?? false);
  const [essential, setEssential] = useState(existing?.essential ?? false);
  const [valueId, setValueId] = useState<string | undefined>(existing?.valueId);
  const [error, setError] = useState<string | null>(null);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const save = () => {
    setError(null);
    try {
      actions.saveTask(
        {
          title,
          description: description || undefined,
          points: Number(points),
          recurrence,
          weekdays: recurrence === 'WEEKLY' ? weekdays : [],
          startDate,
          endDate: endDate || undefined,
          dueTime,
          assigneeIds: assignees,
          requiresApproval,
          requiresEvidence,
          essential,
          valueId,
        },
        existing?.id,
      );
      fb.toast(existing ? 'Tarefa atualizada' : 'Combinado criado');
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <Screen
      title={existing ? 'Editar tarefa' : 'Nova tarefa'}
      footer={
        <>
          {error ? <Banner tone="attention" text={error} /> : null}
          <Button testID="task-save" label={existing ? 'Salvar alterações' : 'Criar tarefa'} onPress={save} />
        </>
      }
    >
      <Field testID="task-title" label="O que precisa ser feito" value={title} onChangeText={setTitle} placeholder="Ex.: Arrumar a cama" maxLength={80} />
      <Field label="Detalhes (opcional)" value={description} onChangeText={setDescription} multiline placeholder="Como fica bem feito?" maxLength={280} />
      <Field testID="task-points" label="Pontos" value={points} onChangeText={(v) => setPoints(v.replace(/\D/g, ''))} keyboardType="number-pad" hint="Reconhecem o esforço; não medem o valor de ninguém." maxLength={4} />

      <Section title="Quem vai fazer" style={{ marginTop: spacing.sm }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {members.map((m) => (
            <Chip key={m.id} label={memberName(s, m.id)} selected={assignees.includes(m.id)} onPress={() => setAssignees(toggle(assignees, m.id))} />
          ))}
        </View>
      </Section>

      <Section title="Quando">
        <Segmented<Recurrence>
          value={recurrence}
          onChange={setRecurrence}
          options={[
            { value: 'NONE', label: 'Uma vez' },
            { value: 'DAILY', label: 'Todo dia' },
            { value: 'WEEKLY', label: 'Dias da semana' },
          ]}
        />
        {recurrence === 'WEEKLY' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md }}>
            {WEEKDAY_SHORT.map((d, i) => (
              <Chip key={d} label={d} selected={weekdays.includes(i)} onPress={() => setWeekdays(toggle(weekdays, i))} />
            ))}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Field label={recurrence === 'NONE' ? 'Dia' : 'Começa em'} value={startDate} onChangeText={setStartDate} placeholder="AAAA-MM-DD" maxLength={10} autoCapitalize="none" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Até que horas" value={dueTime} onChangeText={setDueTime} placeholder="HH:MM" maxLength={5} autoCapitalize="none" />
          </View>
        </View>
        {recurrence !== 'NONE' ? (
          <Field label="Termina em (opcional)" value={endDate} onChangeText={setEndDate} placeholder="AAAA-MM-DD" maxLength={10} autoCapitalize="none" hint="Sem data final, os próximos 30 dias ficam sempre programados." />
        ) : null}
      </Section>

      <Section title="Como acompanhar">
        <ToggleRow label="Pedir revisão" hint="Um responsável confere antes de reconhecer os pontos." value={requiresApproval} onChange={setRequiresApproval} />
        <ToggleRow label="Pedir um registro" hint="Quem fizer conta como ficou ou cola o link de uma foto." value={requiresEvidence} onChange={setRequiresEvidence} />
        <ToggleRow label="Essencial" hint="Faz parte da base da rotina da casa." value={essential} onChange={setEssential} />
      </Section>

      {values.length ? (
        <Section title="Ligada a um valor (opcional)">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {values.map((v) => (
              <Chip key={v.id} label={v.title} selected={valueId === v.id} onPress={() => setValueId(valueId === v.id ? undefined : v.id)} />
            ))}
          </View>
        </Section>
      ) : null}
      {existing ? (
        <Txt v="small" style={{ marginTop: spacing.lg }}>
          As mudanças valem para as próximas ocorrências em aberto. O que já foi feito continua no histórico.
        </Txt>
      ) : null}
    </Screen>
  );
}
