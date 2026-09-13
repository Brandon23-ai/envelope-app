import { apiClient } from './client';
import type { AuthUser, TokenPair } from './types';

// login, register, loginWithGoogle and requestPasswordReset call endpoints
// that don't exist on the backend yet (see docs/specs/auth-api-contract.md)
// — the NestJS auth module currently only implements refresh/logout/me.
// Shapes below are the most reasonable inference, not a verified contract.

export async function login(email: string, password: string): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('/auth/login', { email, password });
  return data;
}

export async function register(name: string, email: string, password: string): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('/auth/register', { name, email, password });
  return data;
}

export async function loginWithGoogle(idToken: string): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('/auth/google', { idToken });
  return data;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

// logout and getMe are real, verified endpoints.

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/auth/me');
  return data;
}
