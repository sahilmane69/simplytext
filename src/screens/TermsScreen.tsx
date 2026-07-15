import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, Screen } from '../components';
import { colors, radius, spacing } from '../constants';

type TermsScreenProps = {
  onAccept: () => void;
  onExit: () => void;
};

const agreementSections = [
  {
    body: 'SimplyText is a plain text messaging app designed for private, direct and group conversations. By using the app, you agree to use it lawfully, respectfully and only for text-based communication.',
    title: '1. Service',
  },
  {
    body: 'You are responsible for your account, profile information and all activity from your signed-in device. Keep your phone number and authentication codes secure.',
    title: '2. Account Responsibility',
  },
  {
    body: 'Only plain text messages are supported. Message images, videos, files, voice notes, GIFs, stickers, calls, status updates and stories are not part of SimplyText.',
    title: '3. Text-Only Messaging',
  },
  {
    body: 'Disappearing chats are deleted when a participant leaves the chat screen or the app backgrounds. Do not rely on the app as permanent storage for important information.',
    title: '4. Disappearing Messages',
  },
  {
    body: 'We use your contacts permission only to identify registered SimplyText users and show invite options. You can control contacts permission in your device settings.',
    title: '5. Contacts',
  },
  {
    body: 'Your profile may include a username, optional bio and avatar. Do not upload offensive, misleading or unlawful profile information.',
    title: '6. Profile',
  },
  {
    body: 'We may update these terms as the product evolves. Continuing to use SimplyText after updates means you accept the revised terms.',
    title: '7. Updates',
  },
  {
    body: 'If you do not agree with these terms or the Privacy Policy, exit the app and do not continue account setup.',
    title: '8. Acceptance',
  },
];

export function TermsScreen({ onAccept, onExit }: TermsScreenProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Agreement</Text>
          <Text style={styles.title}>Terms & Conditions</Text>
          <Text style={styles.subtitle}>Review the agreement before continuing.</Text>
        </View>

        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.agreement} showsVerticalScrollIndicator={false}>
            {agreementSections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.body}>{section.body}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          onPress={() => setAccepted((currentValue) => !currentValue)}
          style={styles.checkboxRow}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxSelected]}>
            {accepted ? <Text style={styles.checkboxText}>x</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and agree to the Terms & Conditions and Privacy Policy.
          </Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <AppButton disabled={!accepted} label="Continue" onPress={onAccept} />
        <AppButton label="Exit App" onPress={onExit} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  agreement: {
    gap: spacing.lg,
    padding: spacing.lg,
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
    maxHeight: 360,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#3A3A3A',
    borderRadius: 8,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  checkboxLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  checkboxSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  checkboxText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '900',
  },
  content: {
    gap: spacing.lg,
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
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
  },
});
