import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { fontsToLoad } from '../src/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontsToLoad);

  return (
    <AuthProvider>
      <RootNavigator fontsReady={fontsLoaded || !!fontError} />
    </AuthProvider>
  );
}

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { user, isLoading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const appReady = fontsReady && !authLoading;

  useEffect(() => {
    if (appReady) {
      SplashScreen.hide();
    }
  }, [appReady]);

  useEffect(() => {
    if (!appReady) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [appReady, user, segments, router]);

  // Keep the splash screen up (render nothing) until fonts are loaded AND we
  // know whether a persisted session exists — otherwise we'd flash the login
  // screen at an already-authenticated user for a frame.
  if (!appReady) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
