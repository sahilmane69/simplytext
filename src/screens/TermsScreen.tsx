import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Screen } from '../components';
import { colors, radius, spacing } from '../constants';

type TermsScreenProps = {
  onAccept: () => void;
};

export function TermsScreen({ onAccept }: TermsScreenProps) {
  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.kicker}>Terms</Text>
        <Text style={styles.title}>Before we begin</Text>
        <View style={styles.card}>
          <Text style={styles.body}>
            By continuing, you agree to use SimplyText responsibly and understand that account
            features will be connected in a later step.
          </Text>
        </View>
      </View>

      <AppButton label="Accept and continue" onPress={onAccept} />
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
