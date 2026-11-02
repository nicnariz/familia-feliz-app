import Constants from 'expo-constants';

/**
 * Endereço base da API, já com o prefixo /api/v1 (configurado em app.json → expo.extra.apiUrl).
 * As rotas são sempre caminhos que começam com "/" e são somadas a esta base — nunca ao domínio puro.
 * (Foi a mistura de base e prefixo que causou o 404 no cadastro do APK #3.)
 */
const DEFAULT_API_URL = 'https://luminous-flexibility-production-056c.up.railway.app/api/v1';

export const API_URL: string = String(
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ?? DEFAULT_API_URL,
).replace(/\/+$/, '');

export function apiUrl(path: string): string {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
