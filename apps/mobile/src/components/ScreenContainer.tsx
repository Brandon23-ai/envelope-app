import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface ScreenContainerProps extends ViewProps {
  showBrand?: boolean;
}

export function ScreenContainer({ children, style, showBrand = true, ...rest }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.content, style]} {...rest}>
        {showBrand && <Text style={styles.brand}>Envelope</Text>}
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  brand: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xl,
  },
});
