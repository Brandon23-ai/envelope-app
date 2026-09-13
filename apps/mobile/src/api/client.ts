import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { clearSession, getAccessToken, getRefreshToken, saveTokens } from '../auth/secureStorage';
import { notifySessionExpired } from '../auth/sessionEvents';
import type { TokenPair } from './types';

// Endpoints that must never carry an Authorization header — either because
// there's no session yet, or (for /auth/refresh) because it authenticates
// with the refresh token in the body instead.
const AUTH_FREE_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/forgot-password',
  '/auth/refresh',
];

function isAuthFreePath(url?: string): boolean {
  return url !== undefined && AUTH_FREE_PATHS.some((path) => url.startsWith(path));
}

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

apiClient.interceptors.request.use(async (config) => {
  if (!isAuthFreePath(config.url)) {
    const accessToken = await getAccessToken();
    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }
  return config;
});

// Refresh token rotates on every use and a reused (already-rotated) token
// revokes the whole session server-side — so at most one refresh can ever be
// in flight. Concurrent 401s all await this same promise instead of each
// firing their own refresh.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token stored');
  }
  const { data } = await apiClient.post<TokenPair>('/auth/refresh', { refreshToken });
  await saveTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthFreePath(originalRequest.url)) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const accessToken = await refreshPromise;
      originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      await clearSession();
      await notifySessionExpired();
      return Promise.reject(refreshError);
    }
  },
);
