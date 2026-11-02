// Onde cada operação do dia a dia vive no servidor (rotas REST por módulo).
import type { OpName } from '../data/engine';
import type { Method } from './client';

type Route = { method: Method; path: string; body?: unknown };
const e = encodeURIComponent;
type Args = any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

export const ROUTES: Partial<Record<OpName, (a: Args) => Route>> = {
  // Valores
  saveValue: ([input, id]) => (id ? { method: 'PATCH', path: `/values/${e(id)}`, body: input } : { method: 'POST', path: '/values', body: input }),
  removeValue: ([id]) => ({ method: 'DELETE', path: `/values/${e(id)}` }),

  // Tarefas
  saveTask: ([input, id]) => (id ? { method: 'PATCH', path: `/tasks/${e(id)}`, body: input } : { method: 'POST', path: '/tasks', body: input }),
  cancelTask: ([id]) => ({ method: 'DELETE', path: `/tasks/${e(id)}` }),
  startAssignment: ([id]) => ({ method: 'POST', path: `/assignments/${e(id)}/start` }),
  completeAssignment: ([id, evidenceNote]) => ({ method: 'POST', path: `/assignments/${e(id)}/complete`, body: { evidenceNote } }),
  approveAssignment: ([id, comment]) => ({ method: 'POST', path: `/assignments/${e(id)}/approve`, body: { comment } }),
  rejectAssignment: ([id, reason]) => ({ method: 'POST', path: `/assignments/${e(id)}/reject`, body: { reason } }),

  // Pontos
  manualBonus: ([memberId, amount, reason]) => ({ method: 'POST', path: '/score/bonus', body: { memberId, amount, reason } }),
  reverseScore: ([id, reason]) => ({ method: 'POST', path: `/score/${e(id)}/reverse`, body: { reason } }),

  // Recompensas e pedidos
  saveReward: ([input, id]) => (id ? { method: 'PATCH', path: `/rewards/${e(id)}`, body: input } : { method: 'POST', path: '/rewards', body: input }),
  archiveReward: ([id]) => ({ method: 'DELETE', path: `/rewards/${e(id)}` }),
  redeem: ([id]) => ({ method: 'POST', path: `/rewards/${e(id)}/redeem` }),
  cancelRedemption: ([id]) => ({ method: 'POST', path: `/redemptions/${e(id)}/cancel` }),
  approveRedemption: ([id]) => ({ method: 'POST', path: `/redemptions/${e(id)}/approve` }),
  rejectRedemption: ([id, reason]) => ({ method: 'POST', path: `/redemptions/${e(id)}/reject`, body: { reason } }),
  fulfillRedemption: ([id]) => ({ method: 'POST', path: `/redemptions/${e(id)}/fulfill` }),

  // Cofrinhos
  createPiggy: ([title, target]) => ({ method: 'POST', path: '/piggy-banks', body: { title, target } }),
  contributePiggy: ([id, amount]) => ({ method: 'POST', path: `/piggy-banks/${e(id)}/contribute`, body: { amount } }),
  withdrawPiggy: ([id, amount]) => ({ method: 'POST', path: `/piggy-banks/${e(id)}/withdraw`, body: { amount } }),
  archivePiggy: ([id]) => ({ method: 'DELETE', path: `/piggy-banks/${e(id)}` }),

  // Mesada
  saveAllowanceConfig: ([memberId, input]) => ({ method: 'PUT', path: `/allowance/configs/${e(memberId)}`, body: input }),
  openPeriod: ([memberId]) => ({ method: 'POST', path: '/allowance/periods', body: { memberId } }),
  calculatePeriod: ([id]) => ({ method: 'POST', path: `/allowance/periods/${e(id)}/calculate` }),
  closePeriod: ([id]) => ({ method: 'POST', path: `/allowance/periods/${e(id)}/close` }),
  addAllowanceAdjustment: ([id, amount, reason]) => ({ method: 'POST', path: `/allowance/periods/${e(id)}/adjustments`, body: { amount, reason } }),
  approvePeriod: ([id]) => ({ method: 'POST', path: `/allowance/periods/${e(id)}/approve` }),
  requestPayment: ([id]) => ({ method: 'POST', path: `/allowance/periods/${e(id)}/request-payment` }),
  registerPayment: ([id, note]) => ({ method: 'POST', path: `/allowance/periods/${e(id)}/pay`, body: { note } }),
  reopenPeriod: ([id, note]) => ({ method: 'POST', path: `/allowance/periods/${e(id)}/reopen`, body: { note } }),
  cancelPeriod: ([id]) => ({ method: 'POST', path: `/allowance/periods/${e(id)}/cancel` }),

  // Metas
  saveGoal: ([input]) => ({ method: 'POST', path: '/goals', body: input }),
  archiveGoal: ([id]) => ({ method: 'DELETE', path: `/goals/${e(id)}` }),

  // Notificações
  markRead: ([id]) => ({ method: 'POST', path: `/notifications/${e(id)}/read` }),
  markAllRead: () => ({ method: 'POST', path: '/notifications/read-all' }),
  dismissNotification: ([id]) => ({ method: 'DELETE', path: `/notifications/${e(id)}` }),
  savePrefs: ([prefs]) => ({ method: 'PUT', path: '/notification-preferences', body: prefs }),
};
