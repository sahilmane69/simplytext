import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, Screen } from '../components';
import { colors, radius, spacing } from '../constants';
import {
  getContactsWithRegistrationStatus,
  MatchedContact,
  requestContactsPermission,
} from '../services';

export function HomeScreen() {
  const [contacts, setContacts] = useState<MatchedContact[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const permissionGranted = await requestContactsPermission();
      setHasPermission(permissionGranted);

      if (!permissionGranted) {
        setContacts([]);
        return;
      }

      const nextContacts = await getContactsWithRegistrationStatus();
      setContacts(nextContacts);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const onSimplyText = useMemo(
    () => contacts.filter((contact) => Boolean(contact.profile)),
    [contacts],
  );
  const inviteContacts = useMemo(
    () => contacts.filter((contact) => !contact.profile),
    [contacts],
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Contacts</Text>
          <Text style={styles.title}>SimplyText</Text>
          <Text style={styles.subtitle}>Find people you know. Chat stays off until messaging is ready.</Text>
        </View>

        {isLoading ? (
          <View style={styles.statePanel}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.panelText}>Checking your contacts</Text>
          </View>
        ) : null}

        {!isLoading && !hasPermission ? (
          <View style={styles.statePanel}>
            <Text style={styles.panelTitle}>Contacts permission needed</Text>
            <Text style={styles.panelText}>Allow contacts to see who is already on SimplyText.</Text>
            <AppButton label="Allow contacts" onPress={loadContacts} />
          </View>
        ) : null}

        {!isLoading && hasPermission && errorMessage ? (
          <View style={styles.statePanel}>
            <Text style={styles.panelTitle}>Unable to load contacts</Text>
            <Text style={styles.panelText}>{errorMessage}</Text>
            <AppButton label="Try again" onPress={loadContacts} />
          </View>
        ) : null}

        {!isLoading && hasPermission && !errorMessage ? (
          <>
            <ContactSection contacts={onSimplyText} emptyText="No contacts are on SimplyText yet." title="On SimplyText" />
            <ContactSection contacts={inviteContacts} emptyText="No contacts to invite." showInvite title="Invite" />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

type ContactSectionProps = {
  contacts: MatchedContact[];
  emptyText: string;
  showInvite?: boolean;
  title: string;
};

function ContactSection({ contacts, emptyText, showInvite = false, title }: ContactSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.list}>
        {contacts.length === 0 ? <Text style={styles.emptyText}>{emptyText}</Text> : null}
        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{contact.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.contactCopy}>
              <Text numberOfLines={1} style={styles.contactName}>
                {contact.profile?.name ?? contact.name}
              </Text>
              <Text numberOfLines={1} style={styles.contactPhone}>
                {contact.phoneNumbers[0]}
              </Text>
            </View>
            {showInvite ? (
              <Pressable accessibilityRole="button" style={styles.inviteButton}>
                <Text style={styles.inviteText}>Invite</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  contactCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  contactName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  contactPhone: {
    color: colors.muted,
    fontSize: 14,
  },
  contactRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
  },
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xl,
  },
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
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  inviteButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  inviteText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
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
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  statePanel: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
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
