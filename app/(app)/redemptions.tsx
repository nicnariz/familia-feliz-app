import React from 'react';
import { actions, memberName } from '../../src/data/store';
import { formatDateTime, pts } from '../../src/data/util';
import { useRun, useSession } from '../../src/hooks';
import { spacing } from '../../src/theme';
import { useFeedback } from '../../src/ui/Feedback';
import { Avatar, Button, Card, Empty, Pill, Section, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';
import { View } from 'react-native';

export default function Redemptions() {
  const { s, me, family } = useSession();
  const fb = useFeedback();
  const run = useRun();
  const all = s.redemptions.filter((r) => r.familyId === family?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reserved = all.filter((r) => r.status === 'RESERVED');
  const approved = all.filter((r) => r.status === 'APPROVED');
  const done = all.filter((r) => ['FULFILLED', 'REJECTED', 'CANCELLED'].includes(r.status)).slice(0, 15);

  const card = (r: (typeof all)[number]) => {
    const rw = s.rewards.find((x) => x.id === r.rewardId);
    const person = s.members.find((m) => m.id === r.memberId);
    const own = r.memberId === me?.id;
    return (
      <Card key={r.id} style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {person ? <Avatar name={person.nickname || person.displayName} tone={person.tone} size={36} /> : null}
          <View style={{ flex: 1 }}>
            <Txt v="bodyStrong">{rw?.title ?? 'Recompensa'}</Txt>
            <Txt v="small">
              {memberName(s, r.memberId)} · {pts(r.points)} · {formatDateTime(r.createdAt)}
            </Txt>
          </View>
        </View>
        {r.status === 'RESERVED' && !own ? (
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Button
              label="Agora não"
              variant="secondary"
              small
              style={{ flex: 1 }}
              onPress={async () => {
                const reason = await fb.prompt({ title: 'Por que agora não?', message: 'Os pontos voltam para a carteira.', placeholder: 'Ex.: vamos deixar para o fim de semana', minLength: 3, confirmLabel: 'Enviar' });
                if (reason) run(() => actions.rejectRedemption(r.id, reason), 'Resposta enviada');
              }}
            />
            <Button testID={`redemption-approve-${r.id}`} label="Aprovar" small style={{ flex: 1 }} onPress={() => run(() => actions.approveRedemption(r.id), 'Pedido aprovado')} />
          </View>
        ) : null}
        {r.status === 'APPROVED' ? <Button label="Registrar entrega" icon="check" small onPress={() => run(() => actions.fulfillRedemption(r.id), 'Entrega registrada')} /> : null}
        {['FULFILLED', 'REJECTED', 'CANCELLED'].includes(r.status) ? (
          <Pill label={r.status === 'FULFILLED' ? 'Entregue' : r.status === 'REJECTED' ? 'Ficou para depois' : 'Cancelado'} tone={r.status === 'FULFILLED' ? 'success' : 'neutral'} />
        ) : null}
      </Card>
    );
  };

  return (
    <Screen title="Pedidos de recompensa">
      {!all.length ? <Empty fe icon="inbox" title="Nenhum pedido ainda" text="Quando alguém escolher uma recompensa, o pedido aparece aqui." /> : null}
      {reserved.length ? (
        <Section title="Aguardando aprovação" style={{ marginTop: spacing.xs }}>
          <View style={{ gap: spacing.xs }}>{reserved.map(card)}</View>
        </Section>
      ) : null}
      {approved.length ? (
        <Section title="Aprovados · combinar entrega">
          <View style={{ gap: spacing.xs }}>{approved.map(card)}</View>
        </Section>
      ) : null}
      {done.length ? (
        <Section title="Histórico">
          <View style={{ gap: spacing.xs }}>{done.map(card)}</View>
        </Section>
      ) : null}
    </Screen>
  );
}
