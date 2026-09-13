import { useEffect } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import {
  ResponseType,
  exchangeCodeAsync,
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import { colors, radius, spacing, typography } from '../theme';
import { useAuth } from './AuthContext';

// Everything related to Google Sign-In lives in this one file. It uses
// expo-auth-session's generic OIDC helpers (not expo-auth-session/providers/google,
// which is deprecated in this SDK and now points at a native-SDK-only guide —
// not an option since this project doesn't use Google's native SDK).

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  }) ?? '';

export function isGoogleAuthConfigured(): boolean {
  return GOOGLE_CLIENT_ID.length > 0;
}

function useGoogleSignIn() {
  const { loginWithGoogle } = useAuth();
  const discovery = useAutoDiscovery('https://accounts.google.com');
  const configuredScheme = Constants.expoConfig?.scheme;
  const redirectUri = makeRedirectUri({
    scheme: Array.isArray(configuredScheme) ? configuredScheme[0] : configuredScheme,
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: ResponseType.Code,
    },
    discovery,
  );

  useEffect(() => {
    if (response?.type !== 'success' || !discovery) {
      return;
    }

    exchangeCodeAsync(
      {
        clientId: GOOGLE_CLIENT_ID,
        code: response.params.code,
        redirectUri,
        extraParams: { code_verifier: request?.codeVerifier ?? '' },
      },
      discovery,
    ).then((tokenResult) => {
      if (tokenResult.idToken) {
        return loginWithGoogle(tokenResult.idToken);
      }
    });
  }, [response, discovery, redirectUri, request, loginWithGoogle]);

  function signIn(): void {
    if (!isGoogleAuthConfigured()) {
      Alert.alert(
        'Google Sign-In no disponible',
        'Esta función todavía no está configurada. Probá con email y contraseña por ahora.',
      );
      return;
    }
    if (!request) {
      return;
    }
    void promptAsync();
  }

  return { signIn, isReady: !!request };
}

export function GoogleSignInButton() {
  const { signIn, isReady } = useGoogleSignIn();

  return (
    <Pressable onPress={signIn} disabled={!isReady} style={styles.button}>
      <Ionicons name="logo-google" size={20} color={colors.textPrimary} />
      <Text style={styles.label}>Continuar con Google</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.button,
    color: colors.textPrimary,
  },
});
