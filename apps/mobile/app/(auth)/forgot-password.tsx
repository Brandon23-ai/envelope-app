import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { Button, ScreenContainer, TextField } from '../../src/components';
import { colors, spacing, typography } from '../../src/theme';
import { isValidEmail } from '../../src/utils/validation';

export default function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!isValidEmail(email)) {
      setError('Ingresá un email válido.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      router.push('/check-email');
    } catch {
      setError('No pudimos procesar la solicitud. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Recuperar contraseña</Text>
      <Text style={styles.subtitle}>
        Ingresá tu email y te mandamos instrucciones para restablecer tu contraseña.
      </Text>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="vos@ejemplo.com"
      />
      {!!error && <Text style={styles.formError}>{error}</Text>}
      <Button label="Enviar instrucciones" onPress={handleSubmit} loading={isSubmitting} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  formError: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.md,
  },
});
