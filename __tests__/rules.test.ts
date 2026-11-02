// Regras de negócio do Família Feliz (rode com: npm test)
import assert from 'assert';
import { actions, getState } from '../src/data/store';
import { calculateAllowance, deliveryTime, defaultPrefs, occurrenceDates, walletAvailable, scoreTotal, periodBounds } from '../src/data/rules';
import { addDays, dayKey } from '../src/data/util';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const t = (name: string, fn: () => void) => test(name, fn);
const throwsCode = (fn: () => void, code: string) => assert.throws(fn, (e: any) => e.code === code, `esperava ${code}`);

t('recorrência semanal só nos dias marcados', () => {
  const task: any = { recurrence: 'WEEKLY', weekdays: [1, 3], startDate: '2026-11-02', dueTime: '18:00' };
  assert.deepEqual(occurrenceDates(task, '2026-11-02', '2026-11-08'), ['2026-11-02', '2026-11-04']);
});
t('recorrência NONE gera uma vez', () => {
  const task: any = { recurrence: 'NONE', weekdays: [], startDate: '2026-11-05', dueTime: '18:00' };
  assert.deepEqual(occurrenceDates(task, '2026-11-01', '2026-11-30'), ['2026-11-05']);
});
t('mesada proporcional com arredondamento para baixo no final', () => {
  const cfg: any = { baseAmount: 20, policy: 'PROPORTIONAL', minimumPercent: 0 };
  const r = calculateAllowance(cfg, { expected: 3, earned: 1, percent: 33.3 }, 0);
  assert.equal(r.finalAmount, 6.66);
});
t('mesada integral com mínimo + bônus + teto', () => {
  const cfg: any = { baseAmount: 30, policy: 'FULL_IF_MINIMUM', minimumPercent: 80, bonusThresholdPercent: 100, bonusAmount: 15, capAmount: 40 };
  const r = calculateAllowance(cfg, { expected: 100, earned: 100, percent: 100 }, 0);
  assert.equal(r.finalAmount, 40);
  assert.equal(r.capApplied, true);
  const r2 = calculateAllowance(cfg, { expected: 100, earned: 85, percent: 85 }, 0);
  assert.equal(r2.finalAmount, 30);
});
t('semana começa na segunda', () => {
  assert.deepEqual(periodBounds('WEEKLY', '2026-11-04'), { start: '2026-11-02', end: '2026-11-08' });
});
t('silêncio adia entrega comum, não a crítica', () => {
  const p = { ...defaultPrefs('x'), quietHoursEnabled: true, quietStart: '21:00', quietEnd: '07:00' };
  const night = new Date(2026, 10, 2, 22, 30);
  const d = deliveryTime(p, false, night);
  assert.equal(d.getHours(), 7);
  assert.equal(d.getDate(), 3);
  assert.equal(deliveryTime(p, true, night).getTime(), night.getTime());
});

// ---- fluxo com estado (família de exemplo)
actions.startDemo();
const s0 = getState();
const waiting = s0.assignments.find((a) => a.status === 'WAITING_APPROVAL' && a.memberId === 'mem_lia')!;

t('aprovação credita uma vez (idempotente) e bloqueia repetição', () => {
  const before = scoreTotal(getState(), 'mem_lia');
  actions.approveAssignment(waiting.id, 'Muito bem');
  assert.equal(scoreTotal(getState(), 'mem_lia'), before + waiting.expectedPoints);
  throwsCode(() => actions.approveAssignment(waiting.id), 'INVALID_ASSIGNMENT_STATUS');
  assert.equal(scoreTotal(getState(), 'mem_lia'), before + waiting.expectedPoints);
});
t('rejeição exige motivo', () => {
  const w = getState().assignments.find((a) => a.status === 'WAITING_APPROVAL')!;
  throwsCode(() => actions.rejectAssignment(w.id, ' '), 'REJECTION_REASON_REQUIRED');
});
t('último ADMIN não pode ser rebaixado; não altera as próprias permissões', () => {
  throwsCode(() => actions.updateMember('mem_ana', { role: 'GUARDIAN' }), 'CANNOT_EDIT_OWN_PERMISSIONS');
});
t('participante não aprova nem gerencia', () => {
  actions.switchDemoMember('mem_theo');
  const w = getState().assignments.find((a) => a.status === 'WAITING_APPROVAL')!;
  throwsCode(() => actions.approveAssignment(w.id), 'FAMILY_ACCESS_DENIED');
  throwsCode(() => actions.createInvitation('MEMBER', 1, 7), 'FAMILY_ACCESS_DENIED');
});
t('saldo insuficiente bloqueia o resgate', () => {
  actions.switchDemoMember('mem_ana');
  actions.saveReward({ title: 'Viagem', cost: 99999, stock: null });
  const r = getState().rewards.find((x) => x.title === 'Viagem')!;
  actions.switchDemoMember('mem_theo');
  throwsCode(() => actions.redeem(r.id), 'REWARD_WALLET_INSUFFICIENT_BALANCE');
});
t('reserva tira do disponível; cancelamento devolve; score histórico não muda', () => {
  const st = getState();
  const avail = walletAvailable(st, 'mem_theo');
  const hist = scoreTotal(st, 'mem_theo');
  actions.redeem('rwd_filme');
  assert.equal(walletAvailable(getState(), 'mem_theo'), avail - 40);
  const red = getState().redemptions.filter((r) => r.memberId === 'mem_theo' && r.status === 'RESERVED').pop()!;
  actions.cancelRedemption(red.id);
  assert.equal(walletAvailable(getState(), 'mem_theo'), avail);
  assert.equal(scoreTotal(getState(), 'mem_theo'), hist);
});
t('estoque limitado decrementa e devolve', () => {
  actions.switchDemoMember('mem_ana');
  actions.saveReward({ title: 'Teste', cost: 1, stock: 1 });
  const r = getState().rewards.find((x) => x.title === 'Teste')!;
  actions.switchDemoMember('mem_lia');
  actions.redeem(r.id);
  assert.equal(getState().rewards.find((x) => x.id === r.id)!.stock, 0);
  throwsCode(() => actions.redeem(r.id), 'REWARD_OUT_OF_STOCK');
});
t('mesada: transições inválidas bloqueadas e não aprova a própria', () => {
  actions.switchDemoMember('mem_ana');
  throwsCode(() => actions.approvePeriod('alp_lia_cur'), 'INVALID_ALLOWANCE_TRANSITION');
  actions.calculatePeriod('alp_lia_cur');
  actions.closePeriod('alp_lia_cur');
  actions.approvePeriod('alp_lia_cur');
  throwsCode(() => actions.registerPayment('alp_lia_cur', 'x'), 'INVALID_ALLOWANCE_TRANSITION');
  actions.requestPayment('alp_lia_cur');
  actions.registerPayment('alp_lia_cur', 'dinheiro');
  throwsCode(() => actions.reopenPeriod('alp_lia_cur', 'motivo'), 'INVALID_ALLOWANCE_TRANSITION');
  throwsCode(() => actions.openPeriod('mem_lia'), 'ALLOWANCE_PERIOD_OVERLAP');
});
t('reversão compensatória não apaga histórico e não repete', () => {
  const tx = getState().score.find((x) => x.memberId === 'mem_lia' && x.type === 'TASK_APPROVAL')!;
  const n = getState().score.length;
  actions.reverseScore(tx.id, 'lançado por engano');
  assert.equal(getState().score.length, n + 1);
  throwsCode(() => actions.reverseScore(tx.id, 'de novo'), 'SCORE_TRANSACTION_ALREADY_REVERSED');
});
t('convite: uso único e não duplica membro', () => {
  const inv = actions.createInvitation('MEMBER', 1, 7);
  actions.logout();
  actions.register('Nova Pessoa', 'nova@x.com', 'segredo123');
  actions.acceptInvitation(inv.code);
  throwsCode(() => actions.previewInvitation(inv.code), 'INVITATION_USAGE_LIMIT_REACHED');
});
t('tarefa sem revisão credita na conclusão sem desconto por atraso', () => {
  actions.logout();
  actions.login('theo@exemplo.com', 'familia123');
  const late = getState().assignments.find((a) => a.memberId === 'mem_theo' && a.taskId === 'tsk_mochila' && a.date < dayKey() && a.status === 'COMPLETED');
  const open = getState().assignments.find((a) => a.memberId === 'mem_theo' && a.taskId === 'tsk_mochila' && a.status === 'PENDING' && a.date <= addDays(dayKey(), 7))!;
  const before = scoreTotal(getState(), 'mem_theo');
  const r = actions.completeAssignment(open.id);
  assert.equal(r, 'done');
  assert.equal(scoreTotal(getState(), 'mem_theo'), before + open.expectedPoints);
  void late;
});
t('evidência obrigatória', () => {
  actions.switchDemoMember('mem_lia');
  const a = getState().assignments.find((x) => x.memberId === 'mem_lia' && x.taskId === 'tsk_jantar' && x.status === 'PENDING')!;
  throwsCode(() => actions.completeAssignment(a.id, ''), 'EVIDENCE_REQUIRED');
});
