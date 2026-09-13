import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as AuthApi from '../api/auth';
import type { AuthUser, TokenPair } from '../api/types';
import { clearSession, getRefreshToken, loadSession, saveTokens, saveUser } from './secureStorage';
import { setSessionExpiredListener } from './sessionEvents';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession()
      .then((session) => setUser(session?.user ?? null))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setSessionExpiredListener(async () => {
      setUser(null);
      await clearSession();
    });
    return () => setSessionExpiredListener(null);
  }, []);

  const completeSession = useCallback(async (tokens: TokenPair) => {
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    const me = await AuthApi.getMe();
    await saveUser(me);
    setUser(me);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await AuthApi.login(email, password);
      await completeSession(tokens);
    },
    [completeSession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const tokens = await AuthApi.register(name, email, password);
      await completeSession(tokens);
    },
    [completeSession],
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      const tokens = await AuthApi.loginWithGoogle(idToken);
      await completeSession(tokens);
    },
    [completeSession],
  );

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    setUser(null);
    await clearSession();
    if (refreshToken) {
      await AuthApi.logout(refreshToken).catch(() => {});
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await AuthApi.requestPasswordReset(email);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, register, loginWithGoogle, logout, requestPasswordReset }),
    [user, isLoading, login, register, loginWithGoogle, logout, requestPasswordReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
