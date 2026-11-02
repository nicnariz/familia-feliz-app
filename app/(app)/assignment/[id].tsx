import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { OPEN_STATUSES, isPastDue } from '../../../src/data/rules';
import { actions, errorMessage, memberName } from '../../../src/data/store';
import { formatDateTime, formatDay, formatTime, pts } from '../../../src/data/util';
import { useSession } from '../../../src/hooks';
import { colors, spacing } from '../../../src/theme';
import { AssignmentStatus } from '../../../src/ui/domain';
import { useFeedback } from '../../../src/ui/Feedback';
import { Avatar, Banner, Button, Card, Empty, FeNote, Field, Pill, Txt } from '../../../src/ui/primitives';
import { Screen } from '../../../src/ui/Screen';

export default function AssignmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { s, me, family, canApprove } = useSession();
  const fb = useFeedback();
  const [note, setNote] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<'review' | 'done' | 'approved' | null>(null);

  const a = s.assignments.find((x) => x.id === id && x.familyId === family?.id);
  if (!a || !me) return <Screen title="Tarefa"><Empty icon="search" title="Tarefa não encontrada" text="Pode ter sido encerrada." /></Screen>;
  const task = s.tasks.find((t) => t.id === a.taskId)!;
  const person = s.members.find((m) => m.id === a.memberId);
  const value = s.values.find((v) => v.id === task.valueId);
  const mine = a.memberId === me.id;
  const open = OPEN_STATUSES.includes(a.status);
  const canReview = canApprove && !mine && a.status === 'WAITING_APPROVAL';

  const attempt = (fn: () => void) => {
    setError(null);
    try {
      fn();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const complete = () =>
    attempt(() => {
      const result = actions.completeAssignment(a.id, note);
      setCelebrate(result);
      setNote('');
    });

  const reject = async () => {
    const reason = await fb.prompt({
      title: 'O que falta ajustar?',
      message: 'Explique com carinho e de forma concreta. A pessoa pode concluir de novo depois.',
      placeholder: 'Ex.: faltou guardar os sapatos',
      confirmLabel: 'Enviar',
      minLength: 3,
    });
    if (reason) attempt(() => {
      actions.rejectAssignment(a.id, reason);
      fb.toast('Pedido de ajuste enviado');
      router.back();
    });
  };

  const approve = () =>
    attempt(() => {
      actions.approveAssignment(a.id, comment);
      setCelebrate('approved');
    });

  const footer = (() => {
    if (celebrate) return <Button label="Voltar" onPress={() => router.back()} />;
    if (mine && open)
      return (
        <>
          {error ? <Banner tone="attention" text={error} /> : null}
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {a.status === 'PENDING' ? (
              <Button label="Começar" variant="secondary" style={{ flex: 1 }} onPress={() => attempt(() => actions.startAssignment(a.id))} />
            ) : null}
            <Button testID="assignment-complete" label={a.status === 'REJECTED' ? 'Concluir de novo' : 'Concluir'} icon="check" style={{ flex: 2 }} onPress={complete} />
          </View>
        </>
      );
    if (canReview)
      return (
        <>
          {error ? <Banner tone="attention" text={error} /> : null}
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Button testID="assignment-reject" label="Pedir ajuste" variant="secondary" style={{ flex: 1 }} onPress={reject} />
            <Button testID="assignment-approve" label="Aprovar" icon="check" style={{ flex: 1 }} onPress={approve} />
          </View>
        </>
      );
    return undefined;
  })();

  return (
    <Screen title={task.title} footer={footer}>
      {celebrate ? (
        <View style={{ marginBottom: spacing.md }}>
          {celebrate === 'done' ? (
            <FeNote mode="celebrar">{`Feito! +${pts(a.expectedPoints)} na sua carteira.`}</FeNote>
          ) : celebrate === 'review' ? (
            <FeNote mode="orientar">Enviado! Agora um responsável vai dar uma olhada.</FeNote>
          ) : (
            <FeNote mode="celebrar">{`Reconhecido. ${memberName(s, a.memberId)} recebeu +${pts(a.expectedPoints)}.`}</FeNote>
          )}
        </View>
      ) : null}

      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {person ? <Avatar name={person.nickname || person.displayName} tone={person.tone} /> : null}
          <View style={{ flex: 1 }}>
            <Txt v="bodyStrong">{mine ? 'Com você' : memberName(s, a.memberId)}</Txt>
            <Txt v="small">
              {formatDay(a.date)} · até {formatTime(a.dueAt)}
            </Txt>
          </View>
          <AssignmentStatus a={a} />
        </View>
        {task.description ? <Txt v="body">{task.description}</Txt> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {a.expectedPoints ? <Pill label={pts(a.expectedPoints)} icon="star" tone="teal" /> : null}
          {task.requiresApproval ? <Pill label="Com revisão" icon="eye" tone="lavender" /> : null}
          {task.requiresEvidence ? <Pill label="Pede registro" icon="camera" /> : null}
          {value ? <Pill label={value.title} icon="heart" /> : null}
        </View>
      </Card>

      {isPastDue(a) && mine ? (
        <View style={{ marginTop: spacing.md }}>
          <FeNote mode="atencao">Passou do horário combinado, mas ainda dá para concluir. Sem pressa.</FeNote>
        </View>
      ) : null}

      {a.status === 'REJECTED' && a.reviewComment ? (
        <Card tone="sand" style={{ marginTop: spacing.md, gap: 4 }}>
          <Txt v="overline">O QUE AJUSTAR</Txt>
          <Txt v="body">{a.reviewComment}</Txt>
          <Txt v="small" color={colors.ink}>
            {memberName(s, a.reviewedBy)} · {a.reviewedAt ? formatDateTime(a.reviewedAt) : ''}
          </Txt>
        </Card>
      ) : null}

      {a.evidenceNote ? (
        <Card tone="mist" style={{ marginTop: spacing.md, gap: 4 }}>
          <Txt v="overline">REGISTRO</Txt>
          <Txt v="body">{a.evidenceNote}</Txt>
        </Card>
      ) : null}

      {a.completedAt && !open ? (
        <Txt v="small" style={{ marginTop: spacing.md }}>
          Concluída {formatDateTime(a.completedAt)}
          {a.completedLate ? ' · depois do horário combinado' : ''}
        </Txt>
      ) : null}

      {(a.status === 'APPROVED' || a.status === 'COMPLETED') && a.reviewComment ? (
        <Card tone="sage" style={{ marginTop: spacing.md, gap: 4 }}>
          <Txt v="overline">RECADO DE {memberName(s, a.reviewedBy).toUpperCase()}</Txt>
          <Txt v="body">{a.reviewComment}</Txt>
        </Card>
      ) : null}

      {mine && open && !celebrate ? (
        <View style={{ marginTop: spacing.lg }}>
          <Field
            testID="assignment-note"
            label={task.requiresEvidence ? 'Registro (obrigatório)' : 'Quer contar como foi? (opcional)'}
            value={note}
            onChangeText={setNote}
            multiline
            placeholder={task.requiresEvidence ? 'Conte como ficou ou cole o link de uma foto' : 'Um recado para quem vai ver'}
            maxLength={280}
          />
        </View>
      ) : null}

      {canReview && !celebrate ? (
        <View style={{ marginTop: spacing.lg }}>
          <Field
            testID="assignment-comment"
            label="Recado de reconhecimento (opcional)"
            value={comment}
            onChangeText={setComment}
            multiline
            placeholder="Ex.: Ficou caprichado, obrigada!"
            maxLength={200}
          />
          <Txt v="small">Os pontos combinados são reconhecidos integralmente, mesmo se concluída depois do horário.</Txt>
        </View>
      ) : null}

      {a.status === 'WAITING_APPROVAL' && mine ? (
        <View style={{ marginTop: spacing.md }}>
          <FeNote mode="orientar">Você já concluiu! Agora é só aguardar a revisão.</FeNote>
        </View>
      ) : null}
    </Screen>
  );
}
