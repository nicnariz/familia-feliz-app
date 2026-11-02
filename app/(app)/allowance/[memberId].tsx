import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { allowanceProgress, allowanceStatusText, calculateAllowance, canTransition } from '../../../src/data/rules';
import { actions, errorMessage, memberName } from '../../../src/data/store';
import type { AllowanceFrequency, AllowancePeriod, AllowancePolicy } from '../../../src/data/types';
import { formatDateTime, formatShortDate, money, parseMoney } from '../../../src/data/util';
import { useRun, useSession } from '../../../src/hooks';
import { colors, spacing } from '../../../src/theme';
import { useFeedback } from '../../../src/ui/Feedback';
import { Banner, Button, Card, Empty, Field, Pill, ProgressBar, Section, Segmented, ToggleRow, Txt } from '../../../src/ui/primitives';
import { Screen } from '../../../src/ui/Screen';

export default function AllowanceMember() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { s, me, family, canManage } = useSession();
  const fb = useFeedback();
  const run = useRun();
  const cfg = s.allowanceConfigs.find((c) => c.memberId === memberId);
  const [editing, setEditing] = useState(!cfg);
  const [base, setBase] = useState(cfg ? String(cfg.baseAmount).replace('.', ',') : '20');
  const [frequency, setFrequency] = useState<AllowanceFrequency>(cfg?.frequency ?? 'WEEKLY');
  const [policy, setPolicy] = useState<AllowancePolicy>(cfg?.policy ?? 'PROPORTIONAL');
  const [minimum, setMinimum] = useState(String(cfg?.minimumPercent ?? 80));
  const [bonusOn, setBonusOn] = useState(!!cfg?.bonusAmount);
  const [bonusAt, setBonusAt] = useState(String(cfg?.bonusThresholdPercent ?? 100));
  const [bonus, setBonus] = useState(cfg?.bonusAmount ? String(cfg.bonusAmount).replace('.', ',') : '5');
  const [capOn, setCapOn] = useState(!!cfg?.capAmount);
  const [cap, setCap] = useState(cfg?.capAmount ? String(cfg.capAmount).replace('.', ',') : '');
  const [active, setActive] = useState(cfg?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const member = s.members.find((m) => m.id === memberId && m.familyId === family?.id);
  if (!canManage || !member) return <Screen title="Mesada"><Empty icon="lock" title="Indisponível" /></Screen>;
  const periods = s.allowancePeriods.filter((p) => p.memberId === member.id).sort((a, b) => b.start.localeCompare(a.start));
  const name = memberName(s, member.id);

  const saveCfg = () => {
    setError(null);
    try {
      const baseAmount = parseMoney(base);
      if (baseAmount === null) throw new Error('Confira o valor base.');
      actions.saveAllowanceConfig(member.id, {
        baseAmount,
        frequency,
        policy,
        minimumPercent: Number(minimum) || 0,
        bonusThresholdPercent: bonusOn ? Number(bonusAt) || 100 : undefined,
        bonusAmount: bonusOn ? parseMoney(bonus) ?? 0 : undefined,
        capAmount: capOn ? parseMoney(cap) ?? undefined : undefined,
        active,
      });
      setEditing(false);
      fb.toast('Configuração salva');
    } catch (e) {
      setError(e instanceof Error && !('code' in e) ? e.message : errorMessage(e));
    }
  };

  const step = async (p: AllowancePeriod, kind: 'calc' | 'close' | 'approve' | 'pay-request' | 'pay' | 'reopen' | 'cancel' | 'adjust') => {
    if (kind === 'calc') run(() => actions.calculatePeriod(p.id), 'Valor calculado');
    if (kind === 'close') run(() => actions.closePeriod(p.id), 'Período fechado');
    if (kind === 'approve') run(() => actions.approvePeriod(p.id), 'Mesada aprovada');
    if (kind === 'pay-request') run(() => actions.requestPayment(p.id), 'Aguardando pagamento');
    if (kind === 'pay') {
      const note = await fb.prompt({ title: 'Registrar pagamento', message: 'Como foi pago? (dinheiro, PIX feito por você…). O app não faz transferências.', placeholder: 'Ex.: entregue em dinheiro', confirmLabel: 'Registrar', minLength: 0 });
      if (note !== null) run(() => actions.registerPayment(p.id, note), 'Pagamento registrado');
    }
    if (kind === 'reopen') {
      const note = await fb.prompt({ title: 'Reabrir período', message: 'Conte o motivo. O cálculo anterior fica no histórico.', placeholder: 'Motivo', minLength: 3, confirmLabel: 'Reabrir' });
      if (note) run(() => actions.reopenPeriod(p.id, note), 'Período reaberto');
    }
    if (kind === 'cancel') {
      const ok = await fb.confirm({ title: 'Cancelar este período?', message: 'Ele deixa de valer e não pode ser retomado.', confirmLabel: 'Cancelar período', destructive: true });
      if (ok) run(() => actions.cancelPeriod(p.id), 'Período cancelado');
    }
    if (kind === 'adjust') {
      const reason = await fb.prompt({ title: 'Acréscimo', message: 'Por que acrescentar algo neste período?', placeholder: 'Ex.: ajudou na mudança', minLength: 3, confirmLabel: 'Continuar' });
      if (!reason) return;
      const v = await fb.prompt({ title: 'Valor do acréscimo (R$)', placeholder: 'Ex.: 5,00', confirmLabel: 'Adicionar' });
      const amount = v ? parseMoney(v) : null;
      if (amount) run(() => actions.addAllowanceAdjustment(p.id, amount, reason), 'Acréscimo adicionado');
    }
  };

  return (
    <Screen title={`Mesada de ${name}`}>
      {cfg && !editing ? (
        <Card style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Txt v="heading" style={{ flex: 1 }}>
              {money(cfg.baseAmount)} por {cfg.frequency === 'WEEKLY' ? 'semana' : 'mês'}
            </Txt>
            {!cfg.active ? <Pill label="Pausada" tone="attention" /> : null}
          </View>
          <Txt v="small">
            {cfg.policy === 'PROPORTIONAL'
              ? 'Proporcional aos pontos dos combinados do período.'
              : `Valor integral a partir de ${cfg.minimumPercent}% dos combinados; abaixo disso, proporcional.`}
            {cfg.bonusAmount ? ` Bônus de ${money(cfg.bonusAmount)} ao chegar em ${cfg.bonusThresholdPercent}%.` : ''}
            {cfg.capAmount ? ` Teto de ${money(cfg.capAmount)}.` : ''}
          </Txt>
          <Button label="Editar configuração" variant="ghost" small style={{ alignSelf: 'flex-start' }} onPress={() => setEditing(true)} />
        </Card>
      ) : (
        <Card style={{ gap: 0 }}>
          <Txt v="heading" style={{ marginBottom: spacing.md }}>
            Configuração
          </Txt>
          <Field testID="allowance-base" label="Valor base (R$)" value={base} onChangeText={setBase} keyboardType="decimal-pad" maxLength={9} />
          <Segmented label="Frequência" value={frequency} onChange={setFrequency} options={[{ value: 'WEEKLY', label: 'Semanal' }, { value: 'MONTHLY', label: 'Mensal' }]} />
          <Segmented
            label="Como calcular"
            value={policy}
            onChange={setPolicy}
            options={[
              { value: 'PROPORTIONAL', label: 'Proporcional' },
              { value: 'FULL_IF_MINIMUM', label: 'Integral com mínimo' },
            ]}
          />
          {policy === 'FULL_IF_MINIMUM' ? (
            <Field label="Mínimo de combinados para o valor integral (%)" value={minimum} onChangeText={(v) => setMinimum(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={3} />
          ) : null}
          <ToggleRow label="Bônus" hint="Um extra quando o período vai muito bem." value={bonusOn} onChange={setBonusOn} />
          {bonusOn ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Field label="A partir de (%)" value={bonusAt} onChangeText={(v) => setBonusAt(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={3} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Valor (R$)" value={bonus} onChangeText={setBonus} keyboardType="decimal-pad" maxLength={8} />
              </View>
            </View>
          ) : null}
          <ToggleRow label="Teto" hint="Valor máximo por período, com bônus e acréscimos." value={capOn} onChange={setCapOn} />
          {capOn ? <Field label="Teto (R$)" value={cap} onChangeText={setCap} keyboardType="decimal-pad" maxLength={9} /> : null}
          <ToggleRow label="Mesada ativa" value={active} onChange={setActive} />
          {error ? <Banner tone="attention" text={error} /> : null}
          <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm }}>
            {cfg ? <Button label="Cancelar" variant="quiet" small style={{ flex: 1 }} onPress={() => setEditing(false)} /> : null}
            <Button testID="allowance-save" label="Salvar" small style={{ flex: 1 }} onPress={saveCfg} />
          </View>
        </Card>
      )}

      <Section title="Períodos" action={cfg?.active ? 'Abrir período atual' : undefined} onAction={() => run(() => actions.openPeriod(member.id), 'Período aberto')}>
        {periods.length ? (
          <View style={{ gap: spacing.sm }}>
            {periods.map((p) => {
              const live = p.status === 'OPEN' || p.status === 'REOPENED';
              const prog = allowanceProgress(s, member.id, p.start, p.end);
              const adj = p.adjustments.reduce((x, a) => x + a.amount, 0);
              const snap = live && cfg ? calculateAllowance(cfg, prog, adj) : p.snapshot;
              const pct = live ? prog.percent : p.snapshot?.percent ?? 0;
              const terminal = p.status === 'PAID' || p.status === 'CANCELLED';
              return (
                <Card key={p.id} tone={terminal ? 'linen' : 'surface'} style={{ gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Txt v="bodyStrong" style={{ flex: 1 }}>
                      {formatShortDate(p.start)} a {formatShortDate(p.end)}
                    </Txt>
                    <Pill label={allowanceStatusText[p.status]} tone={p.status === 'PAID' ? 'success' : p.status === 'CANCELLED' ? 'neutral' : 'teal'} />
                  </View>
                  {snap ? (
                    <>
                      <ProgressBar percent={pct} label="Combinados do período" />
                      <Txt v="small">
                        {snap.earnedPoints} de {snap.expectedPoints} pontos combinados ({pct}%)
                      </Txt>
                      <Txt v="title">
                        {money(snap.finalAmount)}
                        {live ? <Txt v="small"> até agora</Txt> : null}
                      </Txt>
                      <Txt v="small" color={colors.inkSoft}>
                        Base {money(snap.calculatedAmount)}
                        {snap.bonusAmount ? ` + bônus ${money(snap.bonusAmount)}` : ''}
                        {snap.adjustments ? ` + acréscimos ${money(snap.adjustments)}` : ''}
                        {snap.capApplied ? ' · teto aplicado' : ''}
                      </Txt>
                    </>
                  ) : null}
                  {p.adjustments.map((a) => (
                    <Txt key={a.id} v="small">
                      + {money(a.amount)} · {a.reason}
                    </Txt>
                  ))}
                  {p.paidNote ? <Txt v="small">Pagamento: {p.paidNote}</Txt> : null}
                  {!terminal ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
                      {canTransition(p, 'CALCULATED') ? <Button testID={`period-calc-${p.id}`} label="Calcular" small onPress={() => step(p, 'calc')} /> : null}
                      {canTransition(p, 'CLOSED') ? <Button label="Fechar período" small onPress={() => step(p, 'close')} /> : null}
                      {canTransition(p, 'APPROVED') ? <Button label="Aprovar" small onPress={() => step(p, 'approve')} /> : null}
                      {canTransition(p, 'PAYMENT_PENDING') ? <Button label="Separar para pagamento" small onPress={() => step(p, 'pay-request')} /> : null}
                      {canTransition(p, 'PAID') ? <Button label="Registrar pagamento" small onPress={() => step(p, 'pay')} /> : null}
                      {['OPEN', 'CALCULATED', 'REOPENED'].includes(p.status) ? <Button label="Acréscimo" variant="secondary" small onPress={() => step(p, 'adjust')} /> : null}
                      {canTransition(p, 'REOPENED') ? <Button label="Reabrir" variant="secondary" small onPress={() => step(p, 'reopen')} /> : null}
                      {canTransition(p, 'CANCELLED') ? <Button label="Cancelar" variant="ghost" small onPress={() => step(p, 'cancel')} /> : null}
                    </View>
                  ) : null}
                  <Txt v="small" color={colors.inkMuted}>
                    {p.history.map((h) => `${allowanceStatusText[h.status]} ${formatDateTime(h.at)}${h.by ? ` por ${memberName(s, h.by)}` : ''}${h.note ? ` (${h.note})` : ''}`).slice(-2).join(' · ')}
                  </Txt>
                </Card>
              );
            })}
          </View>
        ) : (
          <Empty icon="calendar" title="Nenhum período ainda" text={cfg?.active ? 'Abra o período atual para acompanhar.' : 'Salve a configuração para começar.'} />
        )}
      </Section>
      {member.id === me?.id ? <Banner tone="info" text="Esta é a sua mesada: outra pessoa da administração precisa aprovar." /> : null}
    </Screen>
  );
}
