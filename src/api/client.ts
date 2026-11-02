// Cliente HTTP da API do Família Feliz: JSON, token de acesso, renovação automática e erros amigáveis.
import { apiUrl } from './config';
import { clearTokens, loadTokens, saveTokens } from './tokens';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

const FRIENDLY: Record<string, string> = {
  INVITATION_NOT_FOUND: 'Não encontramos esse convite. Confira o código com quem enviou.',
  INVITATION_REVOKED: 'Esse convite foi encerrado. Peça um novo para a família.',
  INVITATION_EXPIRED: 'Esse convite expirou. Peça um novo para a família.',
  INVITATION_USAGE_LIMIT_REACHED: 'Esse convite já foi usado. Peça um novo para a família.',
  FAMILY_MEMBER_ALREADY_EXISTS: 'Você já faz parte desta família.',
  FAMILY_ACCESS_DENIED: 'Somente a administração da família pode fazer isso.',
  FAMILY_NOT_FOUND: 'Família não encontrada.',
  FAMILY_MEMBER_NOT_FOUND: 'Pessoa não encontrada nesta família.',
  CANNOT_EDIT_OWN_PERMISSIONS: 'Você não pode alterar as próprias permissões.',
  INVALID_FAMILY_ROLE: 'Esse papel não pode ser usado em convites.',
  INVITATION_CODE_UNAVAILABLE: 'Não conseguimos gerar o código agora. Tente de novo.',
  LAST_ADMIN_CANNOT_BE_REMOVED: 'A família precisa de pelo menos uma pessoa na administração.',
  EMAIL_IN_USE: 'Já existe uma conta com este e-mail. Que tal entrar?',
  INVALID_CREDENTIALS: 'E-mail ou senha não conferem. Tente de novo com calma.',
  SESSION_EXPIRED: 'Sua sessão terminou. Entre de novo, por favor.',
  NETWORK: 'Sem conexão com o servidor agora. Confira a internet e tente de novo.',
  TIMEOUT: 'O servidor demorou para responder. Tente de novo em instantes.',
  SERVER: 'O servidor teve um problema. Tente de novo em instantes.',
};

function toError(status: number, body: unknown): ApiError {
  const b = (body ?? {}) as { code?: string; message?: string | string[] };
  let code = b.code ?? '';
  if (!code && status === 409) code = 'EMAIL_IN_USE';
  if (!code && status === 401) code = 'INVALID_CREDENTIALS';
  if (!code && status >= 500) code = 'SERVER';
  if (FRIENDLY[code]) return new ApiError(status, code, FRIENDLY[code]);
  // Regras do dia a dia: o servidor já devolve a mensagem amigável (a mesma do app).
  if (code && typeof b.message === 'string' && b.message && status >= 400 && status < 500) return new ApiError(status, code, b.message);
  if (status === 400) {
    const raw = Array.isArray(b.message) ? b.message.join(' ') : b.message ?? '';
    const msg = /password/i.test(raw)
      ? 'A senha precisa ter pelo menos 8 caracteres.'
      : /email/i.test(raw)
        ? 'Confira o e-mail: parece faltar alguma parte.'
        : /name/i.test(raw)
          ? 'Confira o nome (mínimo de 2 letras).'
          : 'Algum dado não está no formato esperado. Confira e tente de novo.';
    return new ApiError(status, 'VALIDATION', msg);
  }
  return new ApiError(status, code || 'UNKNOWN', 'Algo não saiu como esperado. Tente de novo em instantes.');
}

async function raw(method: string, path: string, body: unknown, token: string | null, extra: Record<string, string> = {}): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    return await fetch(apiUrl(path), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch (e) {
    const aborted = (e as { name?: string })?.name === 'AbortError';
    throw new ApiError(0, aborted ? 'TIMEOUT' : 'NETWORK', FRIENDLY[aborted ? 'TIMEOUT' : 'NETWORK']);
  } finally {
    clearTimeout(timer);
  }
}

async function parse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

let refreshing: Promise<boolean> | null = null;

/** Troca o refresh token por um novo par. Uma única renovação por vez. */
async function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      const { refresh } = await loadTokens();
      if (!refresh) return false;
      const res = await raw('POST', '/auth/refresh', { refreshToken: refresh }, null);
      if (!res.ok) {
        await clearTokens();
        return false;
      }
      const data = (await parse(res)) as { accessToken: string; refreshToken: string };
      await saveTokens(data.accessToken, data.refreshToken);
      return true;
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

export type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export async function api<T>(method: Method, path: string, body?: unknown, opts: { auth?: boolean; headers?: Record<string, string> } = {}): Promise<T> {
  const auth = opts.auth !== false;
  let token = auth ? (await loadTokens()).access : null;
  let res = await raw(method, path, body, token, opts.headers);
  if (res.status === 401 && auth) {
    if (await refreshSession()) {
      token = (await loadTokens()).access;
      res = await raw(method, path, body, token, opts.headers);
    } else {
      throw new ApiError(401, 'SESSION_EXPIRED', FRIENDLY.SESSION_EXPIRED);
    }
  }
  const data = await parse(res);
  if (!res.ok) throw toError(res.status, data);
  return data as T;
}
