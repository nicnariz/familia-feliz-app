// Família de exemplo para conhecer o app sem cadastrar nada.
import { ACHIEVEMENTS, HORIZON_DAYS, buildAssignment, defaultPrefs, memberStats, occurrenceDates, periodBounds } from './rules';
import type { AppState, Member, Task } from './types';
import { addDays, atTime, dayKey, localHash, nowISO } from './util';

export const DEMO_PASSWORD = 'familia123';

export function buildDemoState(): AppState {
  const today = dayKey();
  const iso = (day: string, hhmm: string) => atTime(day, hhmm).toISOString();
  const famId = 'fam_demo';
  const s: AppState = {
    version: 1,
    users: [],
    families: [{ id: famId, name: 'Família Oliveira', timezone: 'America/Sao_Paulo', createdAt: iso(addDays(today, -21), '19:00') }],
    members: [],
    invitations: [],
    tasks: [],
    assignments: [],
    score: [],
    wallet: [],
    rewards: [],
    redemptions: [],
    piggyBanks: [],
    allowanceConfigs: [],
    allowancePeriods: [],
    values: [],
    goals: [],
    notifications: [],
    notificationPrefs: [],
    timeline: [],
    achievements: [],
    recovery: [],
    session: null,
  };

  const people: { key: string; name: string; email: string; role: Member['role']; tone: number; birthYear?: number }[] = [
    { key: 'ana', name: 'Ana Oliveira', email: 'ana@exemplo.com', role: 'ADMIN', tone: 0 },
    { key: 'carlos', name: 'Carlos Oliveira', email: 'carlos@exemplo.com', role: 'GUARDIAN', tone: 1 },
    { key: 'lia', name: 'Lia Oliveira', email: 'lia@exemplo.com', role: 'MEMBER', tone: 2, birthYear: 2015 },
    { key: 'theo', name: 'Theo Oliveira', email: 'theo@exemplo.com', role: 'MEMBER', tone: 3, birthYear: 2018 },
  ];
  for (const p of people) {
    s.users.push({ id: `usr_${p.key}`, name: p.name, email: p.email, passwordHash: localHash(DEMO_PASSWORD), createdAt: iso(addDays(today, -21), '19:00') });
    s.members.push({
      id: `mem_${p.key}`,
      familyId: famId,
      userId: `usr_${p.key}`,
      displayName: p.name,
      nickname: p.key === 'theo' ? 'Theozinho' : undefined,
      role: p.role,
      status: 'ACTIVE',
      canManage: p.role === 'ADMIN',
      canApprove: p.role !== 'MEMBER',
      tone: p.tone,
      birthYear: p.birthYear,
      joinedAt: iso(addDays(today, -21), '19:10'),
    });
    s.notificationPrefs.push(defaultPrefs(`mem_${p.key}`));
  }

  s.values.push(
    { id: 'val_cuidado', familyId: famId, title: 'Cuidado', description: 'Cuidar da casa, de quem a gente ama e de si.', createdAt: nowISO() },
    { id: 'val_aprender', familyId: famId, title: 'Aprender sempre', description: 'Curiosidade e paciência com o próprio ritmo.', createdAt: nowISO() },
    { id: 'val_coop', familyId: famId, title: 'Cooperação', description: 'Em família, um ajuda o outro.', createdAt: nowISO() },
  );

  const start = addDays(today, -12);
  const base = { familyId: famId, status: 'ACTIVE' as const, createdBy: 'mem_ana', createdAt: iso(start, '08:00'), startDate: start };
  const tasks: Task[] = [
    { ...base, id: 'tsk_cama', title: 'Arrumar a cama', description: 'Lençol esticado e travesseiro no lugar.', points: 5, recurrence: 'DAILY', weekdays: [], dueTime: '09:00', assigneeIds: ['mem_lia', 'mem_theo'], requiresApproval: false, requiresEvidence: false, essential: true, valueId: 'val_cuidado' },
    { ...base, id: 'tsk_licao', title: 'Lição de casa', description: 'Fazer a lição e guardar o material.', points: 15, recurrence: 'WEEKLY', weekdays: [1, 2, 3, 4, 5], dueTime: '18:00', assigneeIds: ['mem_lia', 'mem_theo'], requiresApproval: true, requiresEvidence: false, essential: true, valueId: 'val_aprender' },
    { ...base, id: 'tsk_biscoito', title: 'Dar comida ao Biscoito', description: 'Ração e água fresca para o cachorro.', points: 10, recurrence: 'DAILY', weekdays: [], dueTime: '19:00', assigneeIds: ['mem_theo'], requiresApproval: true, requiresEvidence: false, essential: false, valueId: 'val_cuidado' },
    { ...base, id: 'tsk_jantar', title: 'Ajudar com o jantar', description: 'Pôr a mesa e ajudar a lavar a louça.', points: 20, recurrence: 'WEEKLY', weekdays: [2, 4, 6], dueTime: '20:30', assigneeIds: ['mem_lia'], requiresApproval: true, requiresEvidence: true, essential: false, valueId: 'val_coop' },
    { ...base, id: 'tsk_mochila', title: 'Organizar a mochila', points: 5, recurrence: 'WEEKLY', weekdays: [0, 1, 2, 3, 4], dueTime: '21:00', assigneeIds: ['mem_theo'], requiresApproval: false, requiresEvidence: false, essential: true },
    { ...base, id: 'tsk_plantas', title: 'Regar as plantas', points: 10, recurrence: 'WEEKLY', weekdays: [3, 6], dueTime: '10:00', assigneeIds: ['mem_carlos'], requiresApproval: false, requiresEvidence: false, essential: false, valueId: 'val_cuidado' },
  ];
  s.tasks = tasks;

  let n = 0;
  const horizon = addDays(today, HORIZON_DAYS);
  for (const t of tasks) {
    for (const date of occurrenceDates(t, t.startDate, horizon)) {
      for (const memberId of t.assigneeIds) {
        const a = buildAssignment(t, memberId, date, `asg_${++n}`);
        if (date < today) {
          // Histórico: quase tudo concluído; poucas ficaram para trás (sem punição).
          const missed = (n % 23 === 0 || n % 31 === 0) && date >= addDays(today, -2);
          if (missed) {
            s.assignments.push(a);
            continue;
          }
          const late = n % 9 === 0;
          const doneAt = new Date(new Date(a.dueAt).getTime() + (late ? 40 : -50) * 60_000);
          a.completedAt = doneAt.toISOString();
          a.completedLate = late;
          if (t.requiresApproval) {
            a.status = 'APPROVED';
            a.reviewedBy = 'mem_ana';
            a.reviewedAt = new Date(doneAt.getTime() + 30 * 60_000).toISOString();
          } else a.status = 'COMPLETED';
          if (t.requiresEvidence) a.evidenceNote = 'Mesa posta e louça lavada.';
          const scoreId = `scr_${n}`;
          const at = a.reviewedAt ?? a.completedAt;
          s.score.push({ id: scoreId, familyId: famId, memberId, amount: a.expectedPoints, type: t.requiresApproval ? 'TASK_APPROVAL' : 'TASK_AUTO_COMPLETION', eventId: `asg:${a.id}`, reason: t.title, createdAt: at });
          s.wallet.push({ id: `wal_${n}`, familyId: famId, memberId, amount: a.expectedPoints, type: 'ELIGIBLE_CREDIT', sourceId: scoreId, createdAt: at });
        }
        s.assignments.push(a);
      }
    }
  }

  // Hoje: algumas coisas já em movimento.
  const todayOf = (taskId: string, memberId: string) =>
    s.assignments.find((a) => a.taskId === taskId && a.memberId === memberId && a.date === today);
  const done = (taskId: string, memberId: string, at: string) => {
    const a = todayOf(taskId, memberId);
    if (!a) return;
    a.status = 'COMPLETED';
    a.completedAt = at;
    s.score.push({ id: `scr_t_${a.id}`, familyId: famId, memberId, amount: a.expectedPoints, type: 'TASK_AUTO_COMPLETION', eventId: `asg:${a.id}`, reason: 'Arrumar a cama', createdAt: at });
    s.wallet.push({ id: `wal_t_${a.id}`, familyId: famId, memberId, amount: a.expectedPoints, type: 'ELIGIBLE_CREDIT', sourceId: `scr_t_${a.id}`, createdAt: at });
  };
  done('tsk_cama', 'mem_lia', iso(today, '07:40'));
  done('tsk_cama', 'mem_theo', iso(today, '08:15'));
  const review = (taskId: string, memberId: string, note?: string) => {
    const a = todayOf(taskId, memberId) ?? s.assignments.find((x) => x.taskId === taskId && x.memberId === memberId && x.date === addDays(today, -1));
    if (!a) return;
    a.status = 'WAITING_APPROVAL';
    a.completedAt = new Date(Date.now() - 25 * 60_000).toISOString();
    a.completedLate = false;
    a.evidenceNote = note;
  };
  review('tsk_licao', 'mem_lia', 'Terminei matemática e português.');
  review('tsk_biscoito', 'mem_theo');

  // Recompensas
  s.rewards.push(
    { id: 'rwd_filme', familyId: famId, title: 'Escolher o filme de sexta', description: 'Você escolhe o filme da noite em família.', cost: 40, stock: null, status: 'ACTIVE', createdAt: nowISO() },
    { id: 'rwd_jogo', familyId: famId, title: '30 minutos extras de videogame', cost: 60, stock: null, status: 'ACTIVE', createdAt: nowISO() },
    { id: 'rwd_parque', familyId: famId, title: 'Passeio no parque com sorvete', description: 'Num fim de semana combinado.', cost: 150, stock: null, status: 'ACTIVE', createdAt: nowISO() },
    { id: 'rwd_livro', familyId: famId, title: 'Um livro novo', description: 'Escolhido juntos na livraria.', cost: 300, stock: 2, status: 'ACTIVE', createdAt: nowISO() },
  );
  s.redemptions.push({ id: 'red_1', familyId: famId, rewardId: 'rwd_filme', memberId: 'mem_theo', points: 40, status: 'RESERVED', createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(), updatedAt: nowISO() });
  s.wallet.push({ id: 'wal_red_1', familyId: famId, memberId: 'mem_theo', amount: -40, type: 'REWARD_POINTS_RESERVED', sourceId: 'red_1', createdAt: nowISO() });

  s.piggyBanks.push({ id: 'pig_1', familyId: famId, memberId: 'mem_lia', title: 'Um livro novo', target: 300, saved: 120, status: 'ACTIVE', createdAt: iso(addDays(today, -6), '18:00') });
  s.wallet.push({ id: 'wal_pig_1', familyId: famId, memberId: 'mem_lia', amount: -120, type: 'PIGGY_BANK_CONTRIBUTION', sourceId: 'pig_1', createdAt: iso(addDays(today, -6), '18:00') });

  // Mesada
  s.allowanceConfigs.push(
    { memberId: 'mem_lia', familyId: famId, baseAmount: 30, frequency: 'WEEKLY', policy: 'FULL_IF_MINIMUM', minimumPercent: 80, bonusThresholdPercent: 100, bonusAmount: 5, capAmount: 40, active: true },
    { memberId: 'mem_theo', familyId: famId, baseAmount: 20, frequency: 'WEEKLY', policy: 'PROPORTIONAL', minimumPercent: 0, active: true },
  );
  const cur = periodBounds('WEEKLY', today);
  const prevStart = addDays(cur.start, -7);
  s.allowancePeriods.push(
    {
      id: 'alp_lia_prev',
      familyId: famId,
      memberId: 'mem_lia',
      start: prevStart,
      end: addDays(prevStart, 6),
      status: 'PAID',
      adjustments: [],
      snapshot: { earnedPoints: 205, expectedPoints: 215, percent: 95.3, baseAmount: 30, policy: 'FULL_IF_MINIMUM', minimumPercent: 80, calculatedAmount: 30, bonusAmount: 0, adjustments: 0, capApplied: false, finalAmount: 30, calculatedAt: iso(addDays(cur.start, -1), '20:00') },
      history: [
        { status: 'OPEN', at: iso(prevStart, '08:00'), by: 'mem_ana' },
        { status: 'CALCULATED', at: iso(addDays(cur.start, -1), '20:00'), by: 'mem_ana' },
        { status: 'CLOSED', at: iso(addDays(cur.start, -1), '20:01'), by: 'mem_ana' },
        { status: 'APPROVED', at: iso(addDays(cur.start, -1), '20:02'), by: 'mem_ana' },
        { status: 'PAYMENT_PENDING', at: iso(addDays(cur.start, -1), '20:02'), by: 'mem_ana' },
        { status: 'PAID', at: iso(cur.start, '09:00'), by: 'mem_ana', note: 'Entregue em dinheiro' },
      ],
      paidNote: 'Entregue em dinheiro',
    },
    { id: 'alp_lia_cur', familyId: famId, memberId: 'mem_lia', ...cur, status: 'OPEN', adjustments: [], history: [{ status: 'OPEN', at: iso(cur.start, '08:00'), by: 'mem_ana' }] },
    { id: 'alp_theo_cur', familyId: famId, memberId: 'mem_theo', ...cur, status: 'OPEN', adjustments: [], history: [{ status: 'OPEN', at: iso(cur.start, '08:00'), by: 'mem_ana' }] },
  );

  s.goals.push({ id: 'gol_semana', familyId: famId, title: 'Semana em sintonia', scope: 'FAMILY', targetPoints: 400, startDate: cur.start, endDate: cur.end, bonusPoints: 10, status: 'ACTIVE', createdAt: iso(cur.start, '08:00') });

  // Linha do tempo e conquistas
  s.timeline.push(
    { id: 'tl_1', familyId: famId, kind: 'FAMILY_CREATED', memberId: 'mem_ana', text: 'Família Oliveira começou a se organizar aqui', createdAt: iso(addDays(today, -21), '19:00') },
    { id: 'tl_2', familyId: famId, kind: 'MEMBER_JOINED', memberId: 'mem_carlos', text: 'Carlos chegou à família', createdAt: iso(addDays(today, -21), '19:20') },
    { id: 'tl_3', familyId: famId, kind: 'MEMBER_JOINED', memberId: 'mem_lia', text: 'Lia chegou à família', createdAt: iso(addDays(today, -21), '19:25') },
    { id: 'tl_4', familyId: famId, kind: 'MEMBER_JOINED', memberId: 'mem_theo', text: 'Theozinho chegou à família', createdAt: iso(addDays(today, -21), '19:30') },
    { id: 'tl_5', familyId: famId, kind: 'TASK_DONE', memberId: 'mem_lia', text: 'Lia concluiu “Ajudar com o jantar”', createdAt: iso(addDays(today, -1), '21:00') },
    { id: 'tl_6', familyId: famId, kind: 'TASK_DONE', memberId: 'mem_theo', text: 'Theozinho concluiu “Dar comida ao Biscoito”', createdAt: iso(addDays(today, -1), '19:10') },
  );
  for (const m of s.members) {
    const stats = memberStats(s, m.id);
    for (const a of ACHIEVEMENTS) {
      if (a.test(stats)) {
        s.achievements.push({ id: `ach_${m.id}_${a.code}`, familyId: famId, memberId: m.id, code: a.code, unlockedAt: iso(addDays(today, -3), '19:00') });
      }
    }
  }

  const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
  s.notifications.push(
    { id: 'ntf_1', familyId: famId, memberId: 'mem_ana', eventId: 'seed:1', category: 'APPROVAL', priority: 'NORMAL', title: 'Uma tarefa para revisar', body: 'Lia concluiu “Lição de casa”.', link: '/approvals', createdAt: ago(25), deliverAt: ago(25) },
    { id: 'ntf_2', familyId: famId, memberId: 'mem_ana', eventId: 'seed:2', category: 'REWARDS', priority: 'NORMAL', title: 'Pedido de recompensa', body: 'Theozinho escolheu “Escolher o filme de sexta”.', link: '/redemptions', createdAt: ago(180), deliverAt: ago(180) },
    { id: 'ntf_3', familyId: famId, memberId: 'mem_lia', eventId: 'seed:3', category: 'TASKS', priority: 'NORMAL', title: 'Tarefa reconhecida', body: '“Ajudar com o jantar” foi aprovada · +20 pontos.', link: '/tasks', createdAt: ago(900), deliverAt: ago(900) },
    { id: 'ntf_4', familyId: famId, memberId: 'mem_theo', eventId: 'seed:4', category: 'ACHIEVEMENTS', priority: 'NORMAL', title: 'Nova conquista', body: 'Dez combinados: dez tarefas concluídas.', link: '/progress', createdAt: ago(2000), deliverAt: ago(2000) },
  );

  s.session = { userId: 'usr_ana', activeFamilyId: famId, demo: true };
  return s;
}
