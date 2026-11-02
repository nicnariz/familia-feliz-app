import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { walletAvailable } from '../../../src/data/rules';
import { pts } from '../../../src/data/util';
import { useSession } from '../../../src/hooks';
import { colors, spacing } from '../../../src/theme';
import { ListCard } from '../../../src/ui/domain';
import { Button, Card, Empty, Icon, Pill, Row, Section, Txt } from '../../../src/ui/primitives';
import { Screen } from '../../../src/ui/Screen';

export default function Rewards() {
  const { s, me, family, canManage, canApprove } = useSession();
  if (!me || !family) return null;
  const available = walletAvailable(s, me.id);
  const catalog = s.rewards.filter((r) => r.familyId === family.id && r.status === 'ACTIVE').sort((a, b) => a.cost - b.cost);
  const pending = s.redemptions.filter((r) => r.familyId === family.id && (r.status === 'RESERVED' || r.status === 'APPROVED'));
  const isParticipant = me.role === 'MEMBER';

  return (
    <Screen tab back={false} title="Recompensas" right={canManage ? { icon: 'plus', label: 'Nova recompensa', onPress: () => router.push('/reward-edit') } : undefined}>
      <Card tone="teal" onPress={() => router.push('/wallet')} accessibilityLabel="Abrir carteira" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Icon name="star" size={26} color={colors.teal} />
        <View style={{ flex: 1 }}>
          <Txt v="overline">SUA CARTEIRA</Txt>
          <Txt v="title">{pts(available)}</Txt>
          <Txt v="small" color={colors.ink}>
            disponíveis para usar · cofrinhos e histórico
          </Txt>
        </View>
        <Icon name="chevron-right" color={colors.ink} />
      </Card>

      {canApprove ? (
        <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md, flexWrap: 'wrap' }}>
          <Button
            label={pending.length ? `Pedidos (${pending.length})` : 'Pedidos'}
            icon="inbox"
            variant="secondary"
            small
            onPress={() => router.push('/redemptions')}
          />
          {canManage ? <Button label="Mesada" icon="dollar-sign" variant="secondary" small onPress={() => router.push('/allowance')} /> : null}
        </View>
      ) : null}

      <Section title="Catálogo da família">
        {catalog.length ? (
          <ListCard>
            {catalog.map((r) => {
              const enough = available >= r.cost;
              const out = r.stock !== null && r.stock <= 0;
              return (
                <Row
                  key={r.id}
                  testID={`reward-${r.id}`}
                  title={r.title}
                  subtitle={[pts(r.cost), r.stock !== null ? (out ? 'esgotada' : `${r.stock} disponíveis`) : null].filter(Boolean).join(' · ')}
                  onPress={() => router.push(`/reward/${r.id}`)}
                  right={
                    out ? (
                      <Pill label="Esgotada" />
                    ) : isParticipant ? (
                      enough ? <Pill label="Dá para escolher" tone="success" icon="check" /> : <Pill label={`Faltam ${r.cost - available}`} />
                    ) : undefined
                  }
                />
              );
            })}
          </ListCard>
        ) : (
          <Empty
            fe
            icon="gift"
            title="Nenhuma recompensa ainda"
            text={canManage ? 'Pense em momentos juntos, pequenos privilégios ou experiências.' : 'A administração da família ainda vai montar o catálogo.'}
            action={canManage ? 'Criar recompensa' : undefined}
            onAction={canManage ? () => router.push('/reward-edit') : undefined}
          />
        )}
      </Section>
      <Txt v="small" style={{ marginTop: spacing.md }}>
        Usar pontos não apaga o que você conquistou: o histórico de pontos continua na sua evolução.
      </Txt>
    </Screen>
  );
}
