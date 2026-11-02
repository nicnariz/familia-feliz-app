import React from 'react';
import { View } from 'react-native';
import { allowanceProgress, allowanceStatusText, calculateAllowance, piggySaved, scoreTotal, walletAvailable, walletReserved } from '../../src/data/rules';
import { actions } from '../../src/data/store';
import { formatDateTime, formatShortDate, money, pts } from '../../src/data/util';
import { useRun, useSession } from '../../src/hooks';
import { colors, spacing } from '../../src/theme';
import { ListCard } from '../../src/ui/domain';
import { useFeedback } from '../../src/ui/Feedback';
import { Button, Card, Empty, Pill, ProgressBar, Row, Section, Stat, Txt } from '../../src/ui/primitives';
import { Screen } from '../../src/ui/Screen';

const redemptionText = { RESERVED: 'Aguardando aprovação', APPROVED: 'Aprovado · combinar entrega', FULFILLED: 'Entregue', REJECTED: 'Ficou para outro momento', CANCELLED: 'Cancelado' };
const movementText: Record<string, string> = {
  ELIGIBLE_CREDIT: 'Pontos recebidos',
  REWARD_POINTS_RESERVED: 'Reservado para recompensa',
  REWARD_POINTS_RELEASED: 'Pontos devolvidos',
  PIGGY_BANK_CONTRIBUTION: 'Guardado no cofrinho',
  PIGGY_BANK_WITHDRAWAL: 'Retirado do cofrinho',
  REVERSAL: 'Correção',
};

export default function Wallet() {
  const { s, me } = useSession();
  const fb = useFeedback();
  const run = useRun();
  if (!me) return null;
  const available = walletAvailable(s, me.id);
  const reserved = walletReserved(s, me.id);
  const saved = piggySaved(s, me.id);
  const history = scoreTotal(s, me.id);
  const piggies = s.piggyBanks.filter((p) => p.memberId === me.id && p.status !== 'ARCHIVED');
  const orders = s.redemptions.filter((r) => r.memberId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
  const periods = s.allowancePeriods.filter((p) => p.memberId === me.id && p.status !== 'CANCELLED').sort((a, b) => b.start.localeCompare(a.start)).slice(0, 6);
  const cfg = s.allowanceConfigs.find((c) => c.memberId === me.id && c.active);
  const moves = s.wallet.filter((w) => w.memberId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12);

  const newPiggy = async () => {
    const title = await fb.prompt({ title: 'Novo cofrinho', message: 'Para que você quer juntar pontos?', placeholder: 'Ex.: Passeio no parque', confirmLabel: 'Continuar', minLength: 2 });
    if (!title) return;
    const target = await fb.prompt({ title: 'Quantos pontos juntar?', placeholder: 'Ex.: 150', keyboardType: 'number-pad', confirmLabel: 'Criar cofrinho' });
    if (target) run(() => actions.createPiggy(title, Number(target)), 'Cofrinho criado');
  };

  const move = async (id: string, kind: 'in' | 'out') => {
    const v = await fb.prompt({
      title: kind === 'in' ? 'Guardar pontos' : 'Retirar pontos',
      message: kind === 'in' ? `Você tem ${pts(available)} disponíveis.` : undefined,
      placeholder: 'Quantidade',
      keyboardType: 'number-pad',
      confirmLabel: kind === 'in' ? 'Guardar' : 'Retirar',
    });
    if (!v) return;
    if (kind === 'in') run(() => actions.contributePiggy(id, Number(v)), 'Pontos guardados');
    else run(() => actions.withdrawPiggy(id, Number(v)), 'Pontos de volta na carteira');
  };

  return (
    <Screen title="Carteira">
      <Card tone="teal" style={{ gap: 4 }}>
        <Txt v="overline">DISPONÍVEL PARA USAR</Txt>
        <Txt v="display">{pts(available)}</Txt>
      </Card>
      <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm }}>
        <Stat label="em pedidos" value={String(reserved)} icon="inbox" />
        <Stat label="em cofrinhos" value={String(saved)} icon="archive" />
        <Stat label="no histórico" value={String(history)} icon="trending-up" />
      </View>
      <Txt v="small" style={{ marginTop: spacing.xs }}>
        O histórico guarda tudo o que você conquistou. Usar ou guardar pontos não muda o histórico.
      </Txt>

      <Section title="Cofrinhos" action="Novo" onAction={newPiggy}>
        {piggies.length ? (
          <View style={{ gap: spacing.xs }}>
            {piggies.map((p) => (
              <Card key={p.id} tone={p.status === 'COMPLETED' ? 'sage' : 'surface'} style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Txt v="bodyStrong" style={{ flex: 1 }}>
                    {p.title}
                  </Txt>
                  {p.status === 'COMPLETED' ? <Pill label="Completo" tone="success" icon="check" /> : null}
                </View>
                <ProgressBar percent={(p.saved / p.target) * 100} color={colors.sage} label={`Cofrinho ${p.title}`} />
                <Txt v="small">
                  {p.saved} de {pts(p.target)}
                </Txt>
                <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
                  {p.status === 'ACTIVE' ? <Button label="Guardar" icon="plus" small variant="secondary" onPress={() => move(p.id, 'in')} /> : null}
                  {p.saved > 0 ? <Button label="Retirar" icon="minus" small variant="secondary" onPress={() => move(p.id, 'out')} /> : null}
                  <Button
                    label="Arquivar"
                    small
                    variant="ghost"
                    onPress={async () => {
                      const ok = await fb.confirm({ title: 'Arquivar cofrinho?', message: 'O que estiver guardado volta para a carteira.', confirmLabel: 'Arquivar' });
                      if (ok) run(() => actions.archivePiggy(p.id), 'Cofrinho arquivado');
                    }}
                  />
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Empty icon="archive" title="Guardar para algo maior" text="Separe pontos para uma recompensa especial, sem pressa." action="Criar cofrinho" onAction={newPiggy} />
        )}
      </Section>

      <Section title="Meus pedidos">
        {orders.length ? (
          <ListCard>
            {orders.map((r) => {
              const rw = s.rewards.find((x) => x.id === r.rewardId);
              return (
                <Row
                  key={r.id}
                  title={rw?.title ?? 'Recompensa'}
                  subtitle={`${pts(r.points)} · ${redemptionText[r.status]}${r.note ? ` · ${r.note}` : ''}`}
                  right={
                    r.status === 'RESERVED' ? (
                      <Button
                        label="Cancelar"
                        variant="ghost"
                        small
                        onPress={async () => {
                          const ok = await fb.confirm({ title: 'Cancelar o pedido?', message: 'Os pontos voltam para a sua carteira.', confirmLabel: 'Cancelar pedido' });
                          if (ok) run(() => actions.cancelRedemption(r.id), 'Pedido cancelado');
                        }}
                      />
                    ) : undefined
                  }
                />
              );
            })}
          </ListCard>
        ) : (
          <Txt v="small">Você ainda não escolheu nenhuma recompensa.</Txt>
        )}
      </Section>

      {cfg || periods.length ? (
        <Section title="Minha mesada">
          <ListCard>
            {periods.map((p) => {
              const preview = p.status === 'OPEN' || p.status === 'REOPENED' ? (cfg ? calculateAllowance(cfg, allowanceProgress(s, me.id, p.start, p.end), p.adjustments.reduce((x, a) => x + a.amount, 0)) : null) : p.snapshot;
              return (
                <Row
                  key={p.id}
                  title={`${formatShortDate(p.start)} a ${formatShortDate(p.end)}`}
                  subtitle={`${allowanceStatusText[p.status]}${preview ? ` · ${p.status === 'OPEN' ? 'até agora ' : ''}${money(preview.finalAmount)}` : ''}`}
                  right={p.status === 'PAID' ? <Pill label="Paga" tone="success" /> : undefined}
                />
              );
            })}
          </ListCard>
          <Txt v="small" style={{ marginTop: spacing.xs }}>
            O valor considera as tarefas combinadas no período. O pagamento é feito pela família, fora do app.
          </Txt>
        </Section>
      ) : null}

      <Section title="Movimentações">
        {moves.length ? (
          <ListCard>
            {moves.map((m) => (
              <Row key={m.id} title={`${m.amount > 0 ? '+' : ''}${m.amount} · ${movementText[m.type] ?? m.type}`} subtitle={formatDateTime(m.createdAt)} />
            ))}
          </ListCard>
        ) : (
          <Txt v="small">Nenhuma movimentação ainda.</Txt>
        )}
      </Section>
    </Screen>
  );
}
