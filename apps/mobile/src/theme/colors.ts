export const colors = {
  primary: '#1E293B',
  secondary: '#632900',
  tertiary: '#0F172A',
  neutral: '#F8FAFC',

  white: '#FFFFFF',
  border: '#CBD5E1',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textOnPrimary: '#F8FAFC',
  error: '#DC2626',
} as const;

export type ColorToken = keyof typeof colors;
