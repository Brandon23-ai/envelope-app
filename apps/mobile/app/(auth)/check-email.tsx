import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ScreenContainer } from '../../src/components';
import { colors, spacing, typography } from '../../src/theme';

export default function CheckEmailScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <Text style={styles.title}>Revisá tu correo</Text>
      <Text style={styles.subtitle}>
        Si el email existe en Envelope, te van a llegar instrucciones para restablecer tu
        contraseña.
      </Text>
      <Button label="Volver a iniciar sesión" onPress={() => router.replace('/login')} />
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
});
