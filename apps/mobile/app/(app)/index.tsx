import { StyleSheet, Text } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { Button, ScreenContainer } from '../../src/components';
import { colors, spacing, typography } from '../../src/theme';

export default function DashboardPlaceholderScreen() {
  const { user, logout } = useAuth();

  return (
    <ScreenContainer>
      <Text style={styles.title}>¡Hola{user ? `, ${user.name}` : ''}!</Text>
      <Text style={styles.subtitle}>
        Acá va a vivir el dashboard. Todavía no es parte de este módulo.
      </Text>
      <Button label="Cerrar sesión" variant="secondary" onPress={() => void logout()} />
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
    marginBottom: spacing.xl,
  },
});
