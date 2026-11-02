// Estado do app no aparelho: guarda, avisa as telas e executa as operações do motor de regras.
// Família de exemplo: tudo local. Conta do servidor: a operação vale na hora no aparelho e é enviada
// ao servidor, que confirma (ou desfaz) e devolve o estado oficial da família.
import { useSyncExternalStore } from 'react';
import { AppError, ensureHorizon, emptyState, fail, ops, type OpName } from './engine';
import { clearState, loadState, saveState } from './storage';
import type { AllowanceConfig, AppState, Goal, Member, NotificationPrefs, Role, Task } from './types';
import { recordIds } from './util';
import { buildDemoState } from './seed';

export * from './engine';

let state: AppState = emptyState();
let hydrated = false;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function schedulePersist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveState(state), 150);
}

function mutate<T>(fn: (draft: AppState) => T): T {
  const draft = JSON.parse(JSON.stringify(state)) as AppState;
  const result = fn(draft);
  state = draft;
  emit();
  schedulePersist();
  return result;
}

/** Aplica uma alteração vinda do servidor (usado pela camada src/data/account.ts). */
export function patchState<T>(fn: (draft: AppState) => T): T {
  return mutate(fn);
}

export function getState() {
  return state;
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

export function isHydrated() {
  return hydrated;
}

export async function hydrate(): Promise<void> {
  const saved = await loadState<AppState>();
  if (saved && saved.version === 1) state = { ...emptyState(), ...saved };
  hydrated = true;
  refreshHorizon();
  emit();
}

/** Completa as ocorrências futuras das tarefas recorrentes (só no modo local; no servidor, ele mesmo faz). */
export function refreshHorizon() {
  if (state.session?.remote) return;
  const draft = JSON.parse(JSON.stringify(state)) as AppState;
  if (ensureHorizon(draft)) {
    state = draft;
    schedulePersist();
  }
}

// ---------------------------------------------------------------- Envio ao servidor

/** Avisos da sincronização (ex.: o servidor recusou uma alteração), mostrados pela camada de feedback. */
const syncListeners = new Set<(message: string) => void>();
export function onSyncNotice(fn: (message: string) => void) {
  syncListeners.add(fn);
  return () => void syncListeners.delete(fn);
}
export function notifySync(message: string) {
  syncListeners.forEach((l) => l(message));
}

/** Quem envia as operações ao servidor (registrado por src/data/account.ts). */
type RemoteSink = (op: OpName, args: unknown[], ids: string[]) => void;
let remoteSink: RemoteSink | null = null;
export function setRemoteSink(fn: RemoteSink | null) {
  remoteSink = fn;
}

/** Operações que, na conta do servidor, são confirmadas por ele. */
export const SERVER_OPS = new Set<OpName>([
  'saveValue', 'removeValue',
  'saveTask', 'cancelTask', 'startAssignment', 'completeAssignment', 'approveAssignment', 'rejectAssignment',
  'manualBonus', 'reverseScore',
  'saveReward', 'archiveReward', 'redeem', 'cancelRedemption', 'approveRedemption', 'rejectRedemption', 'fulfillRedemption',
  'createPiggy', 'contributePiggy', 'withdrawPiggy', 'archivePiggy',
  'saveAllowanceConfig', 'openPeriod', 'calculatePeriod', 'closePeriod', 'addAllowanceAdjustment', 'approvePeriod',
  'requestPayment', 'registerPayment', 'reopenPeriod', 'cancelPeriod',
  'saveGoal', 'archiveGoal',
  'markRead', 'markAllRead', 'dismissNotification', 'savePrefs',
]);

/**
 * Executa a operação no aparelho na hora (as telas respondem sem esperar a internet).
 * Na conta do servidor, a mesma operação segue para ele com os ids criados aqui,
 * para que o registro tenha o mesmo id nos dois lados.
 */
function exec<T>(op: OpName, args: unknown[], fn: (d: AppState) => T): T {
  const remote = !!state.session?.remote && SERVER_OPS.has(op);
  if (remote && !remoteSink) fail('OFFLINE', 'Sem conexão com o servidor agora. Tente de novo em instantes.');
  const { result, ids } = recordIds(() => mutate(fn));
  if (remote) remoteSink!(op, args, ids);
  return result;
}

// ---------------------------------------------------------------- Ações usadas pelas telas

export const actions = {
  // ----- Entrada
  register(name: string, email: string, password: string) {
    return exec('register', [name, email, password], (d) => ops.register(d, name, email, password));
  },

  login(email: string, password: string) {
    return exec('login', [email, password], (d) => ops.login(d, email, password));
  },

  logout() {
    return exec('logout', [], (d) => ops.logout(d));
  },

  /** Retorna o código apenas porque no modo local não há entrega externa (pendência DEC-0022). */
  requestRecovery(email: string): string | null {
    return exec('requestRecovery', [email], (d) => ops.requestRecovery(d, email));
  },

  resetPassword(email: string, code: string, newPassword: string) {
    return exec('resetPassword', [email, code, newPassword], (d) => ops.resetPassword(d, email, code, newPassword));
  },

  startDemo() {
    const demo = buildDemoState();
    state = demo;
    hydrated = true;
    emit();
    schedulePersist();
  },

  switchDemoMember(memberId: string) {
    return exec('switchDemoMember', [memberId], (d) => ops.switchDemoMember(d, memberId));
  },

  async resetEverything() {
    state = emptyState();
    emit();
    await clearState();
  },

  setActiveFamily(familyId: string) {
    return exec('setActiveFamily', [familyId], (d) => ops.setActiveFamily(d, familyId));
  },

  setPendingInvite(code?: string) {
    return exec('setPendingInvite', [code], (d) => ops.setPendingInvite(d, code));
  },

  // ----- Família
  createFamily(name: string, displayName?: string) {
    return exec('createFamily', [name, displayName], (d) => ops.createFamily(d, name, displayName));
  },

  updateFamily(name: string) {
    return exec('updateFamily', [name], (d) => ops.updateFamily(d, name));
  },

  /** Regra da API: somente ADMIN atualiza membros; não altera as próprias permissões; protege o último ADMIN. */
  updateMember(
    memberId: string,
    patch: Partial<Pick<Member, 'role' | 'canApprove' | 'canManage' | 'nickname' | 'status'>>,
  ) {
    return exec('updateMember', [memberId, patch], (d) => ops.updateMember(d, memberId, patch));
  },

  createInvitation(role: Exclude<Role, 'ADMIN'>, maxUses: number, days: number) {
    return exec('createInvitation', [role, maxUses, days], (d) => ops.createInvitation(d, role, maxUses, days));
  },

  revokeInvitation(id: string) {
    return exec('revokeInvitation', [id], (d) => ops.revokeInvitation(d, id));
  },

  previewInvitation(code: string) {
    const c = code.trim().toUpperCase();
    const inv = state.invitations.find((i) => i.code === c);
    if (!inv) fail('INVITATION_NOT_FOUND', 'Não encontramos esse convite. Confira o código com quem enviou.');
    if (inv!.revokedAt) fail('INVITATION_REVOKED', 'Esse convite foi encerrado. Peça um novo para a família.');
    if (new Date(inv!.expiresAt).getTime() < Date.now()) fail('INVITATION_EXPIRED', 'Esse convite expirou. Peça um novo para a família.');
    if (inv!.uses >= inv!.maxUses) fail('INVITATION_USAGE_LIMIT_REACHED', 'Esse convite já foi usado. Peça um novo para a família.');
    const family = state.families.find((f) => f.id === inv!.familyId)!;
    return { familyName: family.name, role: inv!.role, code: c };
  },

  acceptInvitation(code: string, displayName?: string) {
    return exec('acceptInvitation', [code, displayName], (d) => ops.acceptInvitation(d, code, displayName));
  },

  /** DEC-0021 (pendente): a API só permite que ADMIN edite membros, inclusive apelido. */
  updateNickname(memberId: string, nickname: string): void {
    actions.updateMember(memberId, { nickname });
  },

  // ----- Valores
  saveValue(input: { title: string; description?: string }, id?: string) {
    return exec('saveValue', [input, id], (d) => ops.saveValue(d, input, id));
  },

  removeValue(id: string) {
    return exec('removeValue', [id], (d) => ops.removeValue(d, id));
  },

  // ----- Tarefas
  saveTask(
    input: Omit<Task, 'id' | 'familyId' | 'status' | 'createdBy' | 'createdAt'>,
    id?: string,
  ) {
    return exec('saveTask', [input, id], (d) => ops.saveTask(d, input, id));
  },

  cancelTask(id: string) {
    return exec('cancelTask', [id], (d) => ops.cancelTask(d, id));
  },

  startAssignment(id: string) {
    return exec('startAssignment', [id], (d) => ops.startAssignment(d, id));
  },

  completeAssignment(id: string, evidenceNote?: string) {
    return exec('completeAssignment', [id, evidenceNote], (d) => ops.completeAssignment(d, id, evidenceNote));
  },

  approveAssignment(id: string, comment?: string) {
    return exec('approveAssignment', [id, comment], (d) => ops.approveAssignment(d, id, comment));
  },

  rejectAssignment(id: string, reason: string) {
    return exec('rejectAssignment', [id, reason], (d) => ops.rejectAssignment(d, id, reason));
  },

  // ----- Pontos
  manualBonus(memberId: string, amount: number, reason: string) {
    return exec('manualBonus', [memberId, amount, reason], (d) => ops.manualBonus(d, memberId, amount, reason));
  },

  /** Reversão compensatória: o histórico nunca é apagado. */
  reverseScore(txId: string, reason: string) {
    return exec('reverseScore', [txId, reason], (d) => ops.reverseScore(d, txId, reason));
  },

  // ----- Recompensas
  saveReward(input: { title: string; description?: string; cost: number; stock: number | null }, id?: string) {
    return exec('saveReward', [input, id], (d) => ops.saveReward(d, input, id));
  },

  archiveReward(id: string) {
    return exec('archiveReward', [id], (d) => ops.archiveReward(d, id));
  },

  redeem(rewardId: string) {
    return exec('redeem', [rewardId], (d) => ops.redeem(d, rewardId));
  },


  cancelRedemption(id: string) {
    return exec('cancelRedemption', [id], (d) => ops.cancelRedemption(d, id));
  },

  approveRedemption(id: string) {
    return exec('approveRedemption', [id], (d) => ops.approveRedemption(d, id));
  },

  rejectRedemption(id: string, reason: string) {
    return exec('rejectRedemption', [id, reason], (d) => ops.rejectRedemption(d, id, reason));
  },

  fulfillRedemption(id: string) {
    return exec('fulfillRedemption', [id], (d) => ops.fulfillRedemption(d, id));
  },

  // ----- Cofrinhos
  createPiggy(title: string, target: number) {
    return exec('createPiggy', [title, target], (d) => ops.createPiggy(d, title, target));
  },

  contributePiggy(id: string, amount: number) {
    return exec('contributePiggy', [id, amount], (d) => ops.contributePiggy(d, id, amount));
  },

  withdrawPiggy(id: string, amount: number) {
    return exec('withdrawPiggy', [id, amount], (d) => ops.withdrawPiggy(d, id, amount));
  },

  archivePiggy(id: string) {
    return exec('archivePiggy', [id], (d) => ops.archivePiggy(d, id));
  },

  // ----- Mesada
  saveAllowanceConfig(memberId: string, input: Omit<AllowanceConfig, 'memberId' | 'familyId'>) {
    return exec('saveAllowanceConfig', [memberId, input], (d) => ops.saveAllowanceConfig(d, memberId, input));
  },

  openPeriod(memberId: string) {
    return exec('openPeriod', [memberId], (d) => ops.openPeriod(d, memberId));
  },



  calculatePeriod(id: string) {
    return exec('calculatePeriod', [id], (d) => ops.calculatePeriod(d, id));
  },

  closePeriod(id: string) {
    return exec('closePeriod', [id], (d) => ops.closePeriod(d, id));
  },

  addAllowanceAdjustment(id: string, amount: number, reason: string) {
    return exec('addAllowanceAdjustment', [id, amount, reason], (d) => ops.addAllowanceAdjustment(d, id, amount, reason));
  },

  approvePeriod(id: string) {
    return exec('approvePeriod', [id], (d) => ops.approvePeriod(d, id));
  },

  requestPayment(id: string) {
    return exec('requestPayment', [id], (d) => ops.requestPayment(d, id));
  },

  /** Registro manual: não é PIX nem transferência bancária. */
  registerPayment(id: string, note: string) {
    return exec('registerPayment', [id, note], (d) => ops.registerPayment(d, id, note));
  },

  reopenPeriod(id: string, note: string) {
    return exec('reopenPeriod', [id, note], (d) => ops.reopenPeriod(d, id, note));
  },

  cancelPeriod(id: string) {
    return exec('cancelPeriod', [id], (d) => ops.cancelPeriod(d, id));
  },

  // ----- Metas
  saveGoal(input: Omit<Goal, 'id' | 'familyId' | 'status' | 'createdAt' | 'completedAt'>) {
    return exec('saveGoal', [input], (d) => ops.saveGoal(d, input));
  },

  archiveGoal(id: string) {
    return exec('archiveGoal', [id], (d) => ops.archiveGoal(d, id));
  },

  // ----- Notificações
  markRead(id: string) {
    return exec('markRead', [id], (d) => ops.markRead(d, id));
  },

  markAllRead() {
    return exec('markAllRead', [], (d) => ops.markAllRead(d));
  },

  dismissNotification(id: string) {
    return exec('dismissNotification', [id], (d) => ops.dismissNotification(d, id));
  },

  savePrefs(prefs: Omit<NotificationPrefs, 'memberId'>) {
    return exec('savePrefs', [prefs], (d) => ops.savePrefs(d, prefs));
  },
};
