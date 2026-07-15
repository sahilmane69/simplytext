import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components';
import { colors, radius, spacing } from '../constants';

type LegalDocument = 'privacy' | 'terms';

type LegalScreenProps = {
  document: LegalDocument;
  onBack: () => void;
};

const legalCopy = {
  privacy: {
    kicker: 'Privacy',
    title: 'Privacy Policy',
    sections: [
      ['Profile Data', 'Your username, optional bio, avatar and phone number are used to identify your account and help contacts recognize you.'],
      ['Contacts', 'Contacts permission is used to compare phone numbers with registered SimplyText users and show invite options.'],
      ['Messages', 'SimplyText supports plain text messages only. Disappearing chat messages are cleared when chat sessions end.'],
      ['Control', 'You can manage device permissions through system settings and sign out from the Settings page.'],
    ],
  },
  terms: {
    kicker: 'Terms',
    title: 'Terms & Conditions',
    sections: [
      ['Use of Service', 'SimplyText is a plain text messaging app for direct and group conversations. Use it lawfully and respectfully.'],
      ['Text Only', 'Message images, videos, files, voice notes, GIFs, stickers, calls, status updates and stories are not supported.'],
      ['Disappearing Chats', 'Messages are not permanent storage and are cleared when chat sessions end or the app backgrounds.'],
      ['Account', 'You are responsible for keeping your phone number and authentication codes secure.'],
    ],
  },
} as const;

export function LegalScreen({ document, onBack }: LegalScreenProps) {
  const copy = legalCopy[document];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.kicker}>{copy.kicker}</Text>
          <Text style={styles.title}>{copy.title}</Text>
        </View>

        <View style={styles.card}>
          {copy.sections.map(([sectionTitle, body]) => (
            <View key={sectionTitle} style={styles.section}>
              <Text style={styles.sectionTitle}>{sectionTitle}</Text>
              <Text style={styles.body}>{body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    borderColor: '#303030',
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  kicker: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
  },
});
