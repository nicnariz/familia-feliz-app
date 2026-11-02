// Conta, famílias, membros, convites e sincronização do dia a dia com o servidor.
// - Conta do servidor (padrão): o servidor é a fonte da verdade. Cada operação vale na hora no
//   aparelho e é confirmada pelo servidor, que devolve o estado oficial da família; os outros
//   aparelhos recebem as mudanças ao abrir o app e a cada poucos segundos.
// - Família de exemplo (demo): continua 100% local, usando as ações de store.ts.
import { api, ApiError } from '../api/client';
import { ROUTES } from '../api/routes';
import { clearTokens, loadTokens, saveTokens } from '../api/tokens';
import { actions, AppError, getState, notifySync, patchState, setRemoteSink, type OpName } from './store';
import type { AppState, Invitation, Member, Role } from './types';
import { nowISO } from './util';

// ---------------------------------------------------------------- Formatos da API

interface ApiUser { id: string; name: string; email: string; createdAt: string }
interface AuthResponse { user: ApiUser; accessToken: string; refreshToken: string }
interface ApiFamilySummary { id: string; name: string; role: Role; memberCount: number }
interface ApiInvitation {
  id: string;
  familyId: string;
  code: string;
  role: Role;
  expiresAt: string;
  maximumUses: number;
  currentUses: number;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'FULLY_USED';
  createdById: string;
  createdAt: string;
}

const isDemo = () => !!getState().session?.demo;

function fail(code: string, message: string): never {
  throw new AppError(code, message);
}

/** Converte erros da API no mesmo tipo de erro amigável das telas. */
async function call<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.code === 'SESSION_EXPIRED') patchState((d) => void (d.session = null));
      throw new AppError(e.code, e.message);
    }
    throw e;
  }
}

// ---------------------------------------------------------------- Espelho local

function upsertUser(d: AppState, u: { id: string; name: string; email?: string; createdAt?: string }) {
  const existing = d.users.find((x) => x.id === u.id);
  if (existing) {
    existing.name = u.name;
    if (u.email) existing.email = u.email;
  } else {
    d.users.push({ id: u.id, name: u.name, email: u.email ?? '', passwordHash: '', createdAt: u.createdAt ?? nowISO() });
  }
}

function applyInvitations(d: AppState, familyId: string, items: ApiInvitation[]) {
  const byUser = new Map(d.members.filter((m) => m.familyId === familyId).map((m) => [m.userId, m.id]));
  const kept = d.invitations.filter((i) => i.familyId !== familyId);
  const mapped: Invitation[] = items.map((i) => ({
    id: i.id,
    familyId,
    code: i.code,
    role: i.role === 'ADMIN' ? 'GUARDIAN' : i.role,
    maxUses: i.maximumUses,
    uses: i.currentUses,
    expiresAt: i.expiresAt,
    revokedAt: i.status === 'REVOKED' ? nowISO() : undefined,
    createdBy: byUser.get(i.createdById) ?? i.createdById,
    createdAt: i.createdAt,
  }));
  d.invitations = [...kept, ...mapped];
}

/** Estado oficial da família, como o servidor entrega para quem está logado. */
export interface FamilyView {
  familyId: string;
  family: { id: string; name: string; timezone: string; createdAt: string };
  users: AppState['users'];
  members: Member[];
  me: string;
  tasks: AppState['tasks'];
  assignments: AppState['assignments'];
  score: AppState['score'];
  wallet: AppState['wallet'];
  rewards: AppState['rewards'];
  redemptions: AppState['redemptions'];
  piggyBanks: AppState['piggyBanks'];
  allowanceConfigs: AppState['allowanceConfigs'];
  allowancePeriods: AppState['allowancePeriods'];
  values: AppState['values'];
  goals: AppState['goals'];
  notifications: AppState['notifications'];
  notificationPrefs: AppState['notificationPrefs'];
  timeline: AppState['timeline'];
  achievements: AppState['achievements'];
  serverTime?: string;
}

const FAMILY_KINDS = [
  'tasks', 'assignments', 'score', 'wallet', 'rewards', 'redemptions', 'piggyBanks', 'allowanceConfigs',
  'allowancePeriods', 'values', 'goals', 'notifications', 'timeline', 'achievements',
] as const;

/** Troca, no aparelho, tudo o que é desta família pelo que o servidor mandou. */
function applyFamilyView(d: AppState, v: FamilyView) {
  const fid = v.familyId;
  for (const u of v.users) upsertUser(d, u);
  const fam = d.families.find((f) => f.id === fid);
  if (fam) fam.name = v.family.name;
  else d.families.push(v.family);
  const oldIds = new Set(d.members.filter((m) => m.familyId === fid).map((m) => m.id));
  const newIds = new Set(v.members.map((m) => m.id));
  d.members = [...d.members.filter((m) => m.familyId !== fid), ...v.members];
  const bag = d as unknown as Record<string, { familyId: string }[]>;
  const incoming = v as unknown as Record<string, { familyId: string }[]>;
  for (const k of FAMILY_KINDS) bag[k] = [...bag[k].filter((x) => x.familyId !== fid), ...incoming[k]];
  d.notificationPrefs = [
    ...d.notificationPrefs.filter((p) => !oldIds.has(p.memberId) && !newIds.has(p.memberId)),
    ...v.notificationPrefs,
  ];
}

function fetchFamilyView(familyId: string) {
  return api<FamilyView>('GET', `/families/${encodeURIComponent(familyId)}/state`);
}

type Snapshot = { families: ApiFamilySummary[]; active?: ApiFamilySummary; view?: FamilyView };

/** Busca as famílias e o estado completo da família ativa (não altera o estado). */
async function fetchSnapshot(preferFamilyId?: string): Promise<Snapshot> {
  const families = await api<ApiFamilySummary[]>('GET', '/families');
  const active = families.find((f) => f.id === preferFamilyId) ?? families[0];
  const view = active ? await fetchFamilyView(active.id) : undefined;
  return { families, active, view };
}

/** Aplica famílias e o estado da família ativa no aparelho, de uma vez. */
function applySnapshot(d: AppState, { families, active, view }: Snapshot) {
  const userId = d.session?.userId;
  for (const f of families) {
    const fam = d.families.find((x) => x.id === f.id);
    if (fam) fam.name = f.name;
    else d.families.push({ id: f.id, name: f.name, timezone: 'America/Sao_Paulo', createdAt: nowISO() });
  }
  // Participações que o servidor não lista mais ficam inativas.
  const listed = new Set(families.map((f) => f.id));
  d.members.forEach((m) => {
    if (m.userId === userId && !listed.has(m.familyId)) m.status = 'INACTIVE';
  });
  if (view) applyFamilyView(d, view);
  // Para as demais famílias, garante ao menos a própria participação (detalhes chegam ao abri-las).
  for (const f of families) {
    if (f.id === active?.id || !userId) continue;
    if (!d.members.some((m) => m.familyId === f.id && m.userId === userId)) {
      d.members.push({
        id: `pending_${f.id}`,
        familyId: f.id,
        userId,
        displayName: d.users.find((u) => u.id === userId)?.name ?? '',
        role: f.role,
        status: 'ACTIVE',
        canManage: f.role === 'ADMIN',
        canApprove: f.role === 'ADMIN',
        tone: 0,
        joinedAt: nowISO(),
      });
    }
  }
  if (d.session) d.session.activeFamilyId = active?.id;
}

async function syncFamilies(preferFamilyId?: string) {
  const snap = await fetchSnapshot(preferFamilyId ?? getState().session?.activeFamilyId);
  patchState((d) => applySnapshot(d, snap));
}

// ---------------------------------------------------------------- Fila de envio ao servidor

type Pending = { op: OpName; args: unknown[]; ids: string[]; familyId: string };
const queue: Pending[] = [];
let draining = false;

/** Há alterações deste aparelho ainda a caminho do servidor? */
export const hasPendingChanges = () => queue.length > 0 || draining;

async function drain() {
  if (draining) return;
  draining = true;
  try {
    while (queue.length) {
      const item = queue[0];
      const route = ROUTES[item.op]!(item.args);
      try {
        const res = await api<{ result: unknown; state: FamilyView }>(
          route.method,
          `/families/${encodeURIComponent(item.familyId)}${route.path}`,
          route.body,
          { headers: item.ids.length ? { 'X-Client-Ids': item.ids.join(',') } : {} },
        );
        queue.shift();
        // Só aplica quando não há mais nada na fila: o estado do aparelho já inclui as próximas.
        if (!queue.length && getState().session?.activeFamilyId === item.familyId) patchState((d) => applyFamilyView(d, res.state));
      } catch (e) {
        // O servidor recusou (ou não respondeu): desfaz tudo o que estava a caminho e volta ao estado oficial.
        queue.length = 0;
        if (e instanceof ApiError && (e.code === 'SESSION_EXPIRED' || e.status === 401)) {
          patchState((d) => void (d.session = null));
          notifySync('Sua sessão terminou. Entre de novo para continuar.');
          return;
        }
        const msg =
          e instanceof ApiError && e.status === 0
            ? 'Sem conexão: a última alteração não foi salva. Tente de novo quando a internet voltar.'
            : e instanceof ApiError
              ? `Não foi possível salvar: ${e.message}`
              : 'Não foi possível salvar a última alteração.';
        notifySync(msg);
        try {
          const view = await fetchFamilyView(item.familyId);
          if (getState().session?.activeFamilyId === item.familyId) patchState((d) => applyFamilyView(d, view));
        } catch {
          // Sem internet: o aparelho mostra o que tem até a próxima atualização.
        }
      }
    }
  } finally {
    draining = false;
  }
}

setRemoteSink((op, args, ids) => {
  const familyId = getState().session?.activeFamilyId;
  if (!familyId || !ROUTES[op]) return;
  queue.push({ op, args: JSON.parse(JSON.stringify(args ?? [])), ids, familyId });
  void drain();
});

/**
 * Abre a sessão só depois de saber as famílias da pessoa: assim o app já vai direto
 * para a família certa (ou para os primeiros passos), sem passar pela tela errada.
 */
async function startRemoteSession(res: AuthResponse) {
  await saveTokens(res.accessToken, res.refreshToken);
  const snap = await fetchSnapshot();
  patchState((d) => {
    upsertUser(d, res.user);
    d.session = { userId: res.user.id, remote: true };
    applySnapshot(d, snap);
  });
}

// ---------------------------------------------------------------- Ações usadas pelas telas

export const account = {
  isDemo,

  async register(name: string, email: string, password: string) {
    const n = name.trim();
    if (n.length < 2) fail('VALIDATION', 'Conte como você gostaria de ser chamado (mínimo de 2 letras).');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) fail('VALIDATION', 'Confira o e-mail: parece faltar alguma parte.');
    if (password.length < 8) fail('VALIDATION', 'A senha precisa ter pelo menos 8 caracteres.');
    const res = await call(() => api<AuthResponse>('POST', '/auth/register', { name: n, email: email.trim().toLowerCase(), password }, { auth: false }));
    await call(() => startRemoteSession(res));
  },

  async login(email: string, password: string) {
    if (!email.trim() || !password) fail('VALIDATION', 'Preencha o e-mail e a senha.');
    const res = await call(() => api<AuthResponse>('POST', '/auth/login', { email: email.trim().toLowerCase(), password }, { auth: false }));
    await call(() => startRemoteSession(res));
  },

  async logout() {
    queue.length = 0;
    await clearTokens();
    actions.logout();
  },

  /** Ao abrir o app: confere a sessão no servidor e atualiza famílias e membros. Sem internet, segue com o que está salvo. */
  async resume() {
    const s = getState().session;
    if (!s?.remote) return;
    const { access, refresh } = await loadTokens();
    if (!access && !refresh) {
      actions.logout();
      return;
    }
    try {
      const me = await api<ApiUser>('GET', '/auth/me');
      patchState((d) => upsertUser(d, me));
      await syncFamilies();
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'SESSION_EXPIRED' || e.status === 401)) {
        await clearTokens();
        actions.logout();
      }
      // Sem conexão: mantém o estado salvo no aparelho.
    }
  },

  /** Busca o estado oficial da família (ao abrir telas, ao voltar para o app e periodicamente). */
  async refresh() {
    if (isDemo() || !getState().session?.remote || hasPendingChanges()) return;
    await call(() => syncFamilies());
  },

  /** Atualização silenciosa em segundo plano: sem aviso de erro (sem internet, tenta de novo depois). */
  async poll() {
    if (isDemo() || !getState().session?.remote || hasPendingChanges()) return;
    const familyId = getState().session?.activeFamilyId;
    if (!familyId) return;
    try {
      const view = await fetchFamilyView(familyId);
      if (!hasPendingChanges() && getState().session?.activeFamilyId === familyId) patchState((d) => applyFamilyView(d, view));
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'SESSION_EXPIRED' || e.code === 'FAMILY_ACCESS_DENIED')) await account.refresh().catch(() => {});
    }
  },

  async setActiveFamily(familyId: string) {
    if (isDemo() || !getState().session?.remote) return actions.setActiveFamily(familyId);
    await call(() => syncFamilies(familyId));
  },

  async createFamily(name: string, displayName?: string) {
    if (isDemo()) return actions.createFamily(name, displayName);
    if (name.trim().length < 2) fail('VALIDATION', 'Dê um nome para a família (mínimo de 2 letras).');
    const fam = await call(() => api<{ id: string; name: string }>('POST', '/families', { name: name.trim() }));
    await call(() => syncFamilies(fam.id));
  },

  async updateFamily(name: string) {
    if (isDemo()) return actions.updateFamily(name);
    const familyId = getState().session?.activeFamilyId;
    if (!familyId) fail('FAMILY_ACCESS_DENIED', 'Entre em uma família para continuar.');
    if (name.trim().length < 2) fail('VALIDATION', 'O nome precisa ter pelo menos 2 letras.');
    await call(() => api('PATCH', `/families/${encodeURIComponent(familyId!)}`, { name: name.trim() }));
    await call(() => syncFamilies(familyId));
  },

  /** Regras do servidor: ninguém altera as próprias permissões e a família nunca fica sem administração. */
  async updateMember(memberId: string, patch: Partial<Pick<Member, 'role' | 'canApprove' | 'nickname' | 'status'>>) {
    if (isDemo()) return actions.updateMember(memberId, patch);
    const familyId = getState().session?.activeFamilyId;
    if (!familyId) fail('FAMILY_ACCESS_DENIED', 'Entre em uma família para continuar.');
    const body: Record<string, unknown> = {};
    if (patch.role) body.role = patch.role;
    if (patch.canApprove !== undefined) {
      body.canApproveTasks = patch.canApprove;
      body.canCreateTasks = patch.canApprove;
    }
    if (patch.nickname !== undefined) body.nickname = patch.nickname.trim();
    if (patch.status) body.status = patch.status === 'INACTIVE' ? 'REMOVED' : 'ACTIVE';
    await call(() => api('PATCH', `/families/${encodeURIComponent(familyId!)}/members/${encodeURIComponent(memberId)}`, body));
    await call(() => syncFamilies(familyId));
  },

  async updateNickname(memberId: string, nickname: string) {
    return account.updateMember(memberId, { nickname });
  },

  /** Devolve o convite com o código completo (o servidor só mostra o código inteiro nesta hora). */
  async createInvitation(role: Exclude<Role, 'ADMIN'>, maxUses: number, days: number): Promise<Invitation> {
    if (isDemo()) return actions.createInvitation(role, maxUses, days);
    const familyId = getState().session?.activeFamilyId;
    if (!familyId) fail('FAMILY_ACCESS_DENIED', 'Entre em uma família para continuar.');
    const inv = await call(() =>
      api<ApiInvitation>('POST', `/families/${encodeURIComponent(familyId!)}/invitations`, {
        role,
        maximumUses: maxUses,
        expiresInHours: Math.min(168, Math.max(1, Math.round(days * 24))),
      }),
    );
    await account.loadInvitations();
    const me = getState().members.find((m) => m.familyId === familyId && m.userId === getState().session?.userId);
    return {
      id: inv.id,
      familyId: familyId!,
      code: inv.code,
      role,
      maxUses: inv.maximumUses,
      uses: inv.currentUses,
      expiresAt: inv.expiresAt,
      createdBy: me?.id ?? inv.createdById,
      createdAt: inv.createdAt,
    };
  },

  async loadInvitations() {
    if (isDemo()) return;
    const familyId = getState().session?.activeFamilyId;
    if (!familyId) return;
    const items = await call(() => api<ApiInvitation[]>('GET', `/families/${encodeURIComponent(familyId)}/invitations`));
    patchState((d) => applyInvitations(d, familyId, items));
  },

  async revokeInvitation(id: string) {
    if (isDemo()) return actions.revokeInvitation(id);
    const familyId = getState().session?.activeFamilyId;
    if (!familyId) return;
    await call(() => api('DELETE', `/families/${encodeURIComponent(familyId)}/invitations/${encodeURIComponent(id)}`));
    await account.loadInvitations();
  },

  /** Prévia pública do convite (não exige login). */
  async previewInvitation(code: string): Promise<{ familyName: string; role: 'GUARDIAN' | 'MEMBER'; code: string }> {
    const c = code.trim();
    if (isDemo()) return actions.previewInvitation(c);
    if (c.replace(/[\s-]/g, '').length < 6) fail('VALIDATION', 'Digite o código do convite que você recebeu.');
    const p = await call(() =>
      api<{ familyName: string; role: Role; status: ApiInvitation['status'] }>('GET', `/invitations/${encodeURIComponent(c)}`, undefined, { auth: false }),
    );
    if (p.status === 'REVOKED') fail('INVITATION_REVOKED', 'Esse convite foi encerrado. Peça um novo para a família.');
    if (p.status === 'EXPIRED') fail('INVITATION_EXPIRED', 'Esse convite expirou. Peça um novo para a família.');
    if (p.status === 'FULLY_USED') fail('INVITATION_USAGE_LIMIT_REACHED', 'Esse convite já foi usado. Peça um novo para a família.');
    return { familyName: p.familyName, role: p.role === 'GUARDIAN' ? 'GUARDIAN' : 'MEMBER', code: c };
  },

  async acceptInvitation(code: string, displayName?: string) {
    if (isDemo()) return actions.acceptInvitation(code, displayName);
    const res = await call(() => api<{ familyId: string; memberId: string; role: Role }>('POST', `/invitations/${encodeURIComponent(code.trim())}/accept`));
    await call(() => syncFamilies(res.familyId));
    patchState((d) => void (d.pendingInviteCode = undefined));
  },

  async resetEverything() {
    await clearTokens();
    await actions.resetEverything();
  },
};
