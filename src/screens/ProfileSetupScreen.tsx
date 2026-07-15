import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Screen } from '../components';
import { colors, radius, spacing } from '../constants';

type ProfileSetupScreenProps = {
  onComplete: () => void;
};

export function ProfileSetupScreen({ onComplete }: ProfileSetupScreenProps) {
  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.kicker}>Profile</Text>
        <Text style={styles.title}>Set up your identity</Text>
        <View style={styles.card}>
          <Text style={styles.body}>Profile details will be collected here after auth is added.</Text>
        </View>
      </View>

      <AppButton label="Finish setup" onPress={onComplete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.xl,
  },
  kicker: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
  },
});
