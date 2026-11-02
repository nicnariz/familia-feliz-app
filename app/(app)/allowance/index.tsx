import { router } from 'expo-router';
import React from 'react';
import { allowanceStatusText } from '../../../src/data/rules';
import { memberName } from '../../../src/data/store';
import { money } from '../../../src/data/util';
import { useSession } from '../../../src/hooks';
import { spacing } from '../../../src/theme';
import { ListCard } from '../../../src/ui/domain';
import { Avatar, Empty, FeNote, Pill, Row, Txt } from '../../../src/ui/primitives';
import { Screen } from '../../../src/ui/Screen';
import { View } from 'react-native';

export default function AllowanceIndex() {
  const { s, me, members, canManage } = useSession();
  if (!canManage) return <Screen title="Mesada"><Empty icon="lock" title="Somente a administração da família gerencia a mesada" /></Screen>;
  const people = members.filter((m) => m.id !== me?.id);
  return (
    <Screen title="Mesada" subtitle="Educação financeira com transparência">
      <FeNote mode="orientar">A mesada acompanha os combinados do período. O pagamento é registrado à mão: o app não movimenta dinheiro.</FeNote>
      <View style={{ height: spacing.lg }} />
      {people.length ? (
        <ListCard>
          {people.map((m) => {
            const cfg = s.allowanceConfigs.find((c) => c.memberId === m.id);
            const current = s.allowancePeriods
              .filter((p) => p.memberId === m.id && p.status !== 'CANCELLED')
              .sort((a, b) => b.start.localeCompare(a.start))[0];
            return (
              <Row
                key={m.id}
                testID={`allowance-${m.id}`}
                title={memberName(s, m.id)}
                subtitle={cfg ? `${money(cfg.baseAmount)} por ${cfg.frequency === 'WEEKLY' ? 'semana' : 'mês'}${cfg.active ? '' : ' · pausada'}` : 'Ainda sem mesada configurada'}
                left={<Avatar name={m.nickname || m.displayName} tone={m.tone} />}
                right={current ? <Pill label={allowanceStatusText[current.status]} tone={current.status === 'PAID' ? 'success' : current.status === 'OPEN' ? 'teal' : 'lavender'} /> : undefined}
                onPress={() => router.push(`/allowance/${m.id}`)}
              />
            );
          })}
        </ListCard>
      ) : (
        <Empty icon="users" title="Convide alguém primeiro" text="A mesada é configurada para cada pessoa da família." />
      )}
      <Txt v="small" style={{ marginTop: spacing.md }}>
        Você não pode aprovar a própria mesada: outra pessoa da administração precisa fazer isso.
      </Txt>
    </Screen>
  );
}
