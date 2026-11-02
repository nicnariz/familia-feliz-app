import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { walletAvailable } from '../../../src/data/rules';
import { actions } from '../../../src/data/store';
import { pts } from '../../../src/data/util';
import { useRun, useSession } from '../../../src/hooks';
import { colors, spacing } from '../../../src/theme';
import { useFeedback } from '../../../src/ui/Feedback';
import { Button, Card, Empty, FeNote, Icon, Pill, ProgressBar, Txt } from '../../../src/ui/primitives';
import { Screen } from '../../../src/ui/Screen';

export default function RewardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { s, me, family, canManage } = useSession();
  const fb = useFeedback();
  const run = useRun();
  const r = s.rewards.find((x) => x.id === id && x.familyId === family?.id);
  if (!r || !me) return <Screen title="Recompensa"><Empty icon="gift" title="Recompensa não encontrada" /></Screen>;
  const available = walletAvailable(s, me.id);
  const enough = available >= r.cost;
  const out = r.stock !== null && r.stock <= 0;
  const open = s.redemptions.filter((x) => x.rewardId === r.id && x.memberId === me.id && (x.status === 'RESERVED' || x.status === 'APPROVED')).length;

  const redeem = async () => {
    const ok = await fb.confirm({
      title: `Escolher “${r.title}”?`,
      message: `${pts(r.cost)} ficam reservados até um responsável aprovar. Se não der certo, eles voltam para a sua carteira.`,
      confirmLabel: 'Escolher',
    });
    if (ok && await run(() => actions.redeem(r.id), 'Pedido enviado')) router.back();
  };

  const archive = async () => {
    const ok = await fb.confirm({ title: 'Tirar do catálogo?', message: 'Pedidos já feitos continuam valendo.', confirmLabel: 'Tirar do catálogo', destructive: true });
    if (ok && await run(() => actions.archiveReward(r.id), 'Recompensa arquivada')) router.back();
  };

  return (
    <Screen
      title={r.title}
      right={canManage ? { icon: 'edit-2', label: 'Editar recompensa', onPress: () => router.push(`/reward-edit?id=${r.id}`) } : undefined}
      footer={
        me.role === 'MEMBER' || !canManage ? (
          <Button testID="reward-redeem" label={out ? 'Esgotada por enquanto' : enough ? `Escolher por ${pts(r.cost)}` : `Faltam ${pts(r.cost - available)}`} disabled={!enough || out} onPress={redeem} />
        ) : (
          <Button label="Tirar do catálogo" variant="danger" onPress={archive} />
        )
      }
    >
      <Card tone="sand" style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl }}>
        <Icon name="gift" size={36} color={colors.terracotta} />
        <Txt v="title" center>
          {r.title}
        </Txt>
        <Pill label={pts(r.cost)} tone="teal" icon="star" />
      </Card>
      {r.description ? (
        <Txt v="body" style={{ marginTop: spacing.md }}>
          {r.description}
        </Txt>
      ) : null}
      <View style={{ marginTop: spacing.lg, gap: spacing.xs }}>
        <Txt v="smallStrong">Sua carteira</Txt>
        <ProgressBar percent={(available / r.cost) * 100} label="Pontos disponíveis para esta recompensa" />
        <Txt v="small">
          {pts(available)} disponíveis{r.stock !== null ? ` · ${r.stock} em estoque` : ''}
          {open ? ` · você já tem ${open} pedido${open > 1 ? 's' : ''} em andamento` : ''}
        </Txt>
      </View>
      {!enough && me.role === 'MEMBER' ? (
        <View style={{ marginTop: spacing.lg }}>
          <FeNote mode="orientar">Que tal criar um cofrinho para ela? Assim você vê o quanto falta.</FeNote>
        </View>
      ) : null}
    </Screen>
  );
}
