import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Tokens de sessão ficam no armazenamento seguro do aparelho (Keychain / Keystore).
const ACCESS = 'ff.accessToken';
const REFRESH = 'ff.refreshToken';

async function get(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}
async function set(key: string, value: string | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (value === null) globalThis.localStorage?.removeItem(key);
      else globalThis.localStorage?.setItem(key, value);
      return;
    }
    if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // sem armazenamento seguro disponível: a sessão vale só enquanto o app estiver aberto
  }
}

let cache: { access: string | null; refresh: string | null } | null = null;

export async function loadTokens() {
  if (!cache) cache = { access: await get(ACCESS), refresh: await get(REFRESH) };
  return cache;
}
export async function saveTokens(access: string, refresh: string) {
  cache = { access, refresh };
  await Promise.all([set(ACCESS, access), set(REFRESH, refresh)]);
}
export async function clearTokens() {
  cache = { access: null, refresh: null };
  await Promise.all([set(ACCESS, null), set(REFRESH, null)]);
}
