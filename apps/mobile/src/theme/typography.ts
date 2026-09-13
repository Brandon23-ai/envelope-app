import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';

export const typography = {
  h1: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 32, lineHeight: 40 },
  h2: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 24, lineHeight: 32 },
  body: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, lineHeight: 18 },
  button: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, lineHeight: 20 },
  label: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
} as const;

export const fontsToLoad = {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} as const;
