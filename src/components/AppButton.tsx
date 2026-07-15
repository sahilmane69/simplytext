import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../constants';

type AppButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export function AppButton({ disabled = false, label, onPress, variant = 'primary' }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  disabled: {
    opacity: 0.56,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.84,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  secondaryLabel: {
    color: colors.text,
  },
});
