import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { GoogleSignInButton } from '../../src/auth/googleAuth';
import { useAuth } from '../../src/auth/AuthContext';
import { Button, PasswordField, ScreenContainer, TextField } from '../../src/components';
import { colors, spacing, typography } from '../../src/theme';
import { isNotEmpty, isValidEmail } from '../../src/utils/validation';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!isValidEmail(email) || !isNotEmpty(password)) {
      setError('Completá tu email y contraseña.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError('No pudimos iniciar tu sesión. Verificá tus datos.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Bienvenido de nuevo</Text>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="vos@ejemplo.com"
      />
      <PasswordField label="Contraseña" value={password} onChangeText={setPassword} placeholder="••••••••" />
      {!!error && <Text style={styles.formError}>{error}</Text>}
      <Button label="Iniciar sesión" onPress={handleSubmit} loading={isSubmitting} />
      <View style={styles.spacer} />
      <GoogleSignInButton />
      <Link href="/forgot-password" style={styles.link}>
        <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
      </Link>
      <Link href="/register" style={styles.link}>
        <Text style={styles.linkText}>¿No tenés cuenta? Registrate</Text>
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  formError: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.md,
  },
  spacer: {
    height: spacing.md,
  },
  link: {
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  linkText: {
    ...typography.body,
    color: colors.secondary,
  },
});
