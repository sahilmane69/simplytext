import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Screen } from '../components';
import { colors, radius, spacing } from '../constants';

type SplashScreenProps = {
  onContinue: () => void;
};

export function SplashScreen({ onContinue }: SplashScreenProps) {
  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.mark}>
          <Text style={styles.markText}>S</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>SimplyText</Text>
          <Text style={styles.subtitle}>Quiet, focused messaging built around your contacts.</Text>
        </View>
      </View>

      <AppButton label="Get started" onPress={onContinue} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: {
    gap: spacing.md,
  },
  hero: {
    flex: 1,
    gap: spacing.xxl,
    justifyContent: 'center',
  },
  mark: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  markText: {
    color: colors.accent,
    fontSize: 36,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 27,
  },
  title: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '800',
  },
});
