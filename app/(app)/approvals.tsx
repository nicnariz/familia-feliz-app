import React from 'react';
import { useSession } from '../../src/hooks';
import { AssignmentRow, ListCard } from '../../src/ui/domain';
import { Empty, FeNote } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';
import { spacing } from '../../src/theme';
import { View } from 'react-native';

export default function Approvals() {
  const { s, me, family } = useSession();
  const waiting = s.assignments
    .filter((a) => a.familyId === family?.id && a.status === 'WAITING_APPROVAL' && a.memberId !== me?.id)
    .sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''));
  return (
    <Screen title="Para revisar" subtitle={waiting.length ? `${waiting.length} aguardando` : undefined}>
      {waiting.length ? (
        <>
          <ListCard>
            {waiting.map((a) => (
              <AssignmentRow key={a.id} s={s} a={a} showPerson showDate />
            ))}
          </ListCard>
          <View style={{ marginTop: spacing.lg }}>
            <FeNote mode="orientar">Ao pedir um ajuste, diga o que falta de forma concreta. Ninguém erra de propósito.</FeNote>
          </View>
        </>
      ) : (
        <Empty icon="check-circle" title="Tudo revisado" text="Quando alguém concluir uma tarefa com revisão, ela aparece aqui." />
      )}
    </Screen>
  );
}
