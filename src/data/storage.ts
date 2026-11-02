import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'familia-feliz:state:v1';

export async function loadState<T>(): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function saveState<T>(state: T): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Persistência é best-effort; o estado em memória continua válido.
  }
}

export async function clearState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
