import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { Button, PasswordField, ScreenContainer, TextField } from '../../src/components';
import { colors, spacing, typography } from '../../src/theme';
import { isNotEmpty, isValidEmail, isValidPassword } from '../../src/utils/validation';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!isNotEmpty(name) || !isValidEmail(email) || !isValidPassword(password)) {
      setError('Revisá los datos: nombre, email válido y contraseña de al menos 8 caracteres.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await register(name, email, password);
    } catch {
      setError('No pudimos crear tu cuenta. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Creá tu cuenta</Text>
      <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" />
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
      <Button label="Crear cuenta" onPress={handleSubmit} loading={isSubmitting} />
      <Link href="/login" style={styles.link}>
        <Text style={styles.linkText}>¿Ya tenés cuenta? Iniciá sesión</Text>
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
  link: {
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  linkText: {
    ...typography.body,
    color: colors.secondary,
  },
});
