import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components';
import { colors, radius, spacing } from '../constants';

export function HomeScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Home</Text>
        <Text style={styles.title}>SimplyText</Text>
        <Text style={styles.subtitle}>Your private messaging workspace is ready.</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>No conversations yet</Text>
        <Text style={styles.panelText}>New chats will appear here once messaging is connected.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  header: {
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  panelText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
  },
  title: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '800',
  },
});
