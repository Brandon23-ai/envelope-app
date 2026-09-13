import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '../api/types';

const ACCESS_TOKEN_KEY = 'envelope_access_token';
const REFRESH_TOKEN_KEY = 'envelope_refresh_token';
const USER_KEY = 'envelope_user';

// expo-secure-store wraps Keychain/Keystore, neither of which exist on web —
// there is no persisted-session story on that platform, so we no-op instead
// of crashing the app at startup. Native (iOS/Android/Expo Go) is unaffected.
const isSecureStoreAvailable = Platform.OS !== 'web';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  if (!isSecureStoreAvailable) {
    return;
  }
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function saveUser(user: AuthUser): Promise<void> {
  if (!isSecureStoreAvailable) {
    return;
  }
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export function getAccessToken(): Promise<string | null> {
  return isSecureStoreAvailable ? SecureStore.getItemAsync(ACCESS_TOKEN_KEY) : Promise.resolve(null);
}

export function getRefreshToken(): Promise<string | null> {
  return isSecureStoreAvailable ? SecureStore.getItemAsync(REFRESH_TOKEN_KEY) : Promise.resolve(null);
}

export async function loadSession(): Promise<StoredSession | null> {
  if (!isSecureStoreAvailable) {
    return null;
  }

  const [accessToken, refreshToken, userJson] = await Promise.all([
    getAccessToken(),
    getRefreshToken(),
    SecureStore.getItemAsync(USER_KEY),
  ]);

  if (!accessToken || !refreshToken || !userJson) {
    return null;
  }

  return { accessToken, refreshToken, user: JSON.parse(userJson) as AuthUser };
}

export async function clearSession(): Promise<void> {
  if (!isSecureStoreAvailable) {
    return;
  }
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}
