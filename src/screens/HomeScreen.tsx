import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const name = (contact.profile?.name ?? contact.name).toLowerCase();
      const phone = contact.phoneNumbers.join(' ').toLowerCase();

      return name.includes(query) || phone.includes(query);
    });
  }, [contacts, searchQuery]);

  const onSimplyText = useMemo(
    () => filteredContacts.filter((contact) => Boolean(contact.profile)),
    [filteredContacts],
  );
  const inviteContacts = useMemo(
    () => filteredContacts.filter((contact) => !contact.profile),
    [filteredContacts],
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>Contacts</Text>
            <Text style={styles.title}>SimplyText</Text>
          </View>
          <Pressable accessibilityLabel="Open profile" accessibilityRole="button" style={styles.profileButton}>
            <Text style={styles.profileButtonText}>P</Text>
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>Search</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearchQuery}
            placeholder="Name or phone"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            value={searchQuery}
          />
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
            <ContactSection
              contacts={onSimplyText}
              emptyText={
                searchQuery ? 'No registered contacts match your search.' : 'No contacts are on SimplyText yet.'
              }
              title="On SimplyText"
            />
            <ContactSection
              contacts={inviteContacts}
              emptyText={searchQuery ? 'No invite contacts match your search.' : 'No contacts to invite.'}
              showInvite
              title="Invite"
            />
          </>
        ) : null}
      </ScrollView>

      <Pressable accessibilityLabel="Create group" accessibilityRole="button" style={styles.groupButton}>
        <Text style={styles.groupButtonText}>+</Text>
      </Pressable>
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
        {contacts.map((contact, index) => (
          <View
            key={contact.id}
            style={[styles.contactRow, index < contacts.length - 1 && styles.contactRowBorder]}
          >
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
    backgroundColor: '#111111',
    borderColor: '#303030',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: colors.text,
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
    fontWeight: '600',
  },
  contactPhone: {
    color: colors.muted,
    fontSize: 14,
  },
  contactRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 68,
    paddingVertical: spacing.sm,
  },
  contactRowBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: 112,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  inviteButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: '#3A3A3A',
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
    backgroundColor: '#141414',
    borderColor: '#252525',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  groupButton: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 30,
    bottom: spacing.lg,
    height: 60,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    width: 60,
  },
  groupButtonText: {
    color: colors.background,
    fontSize: 30,
    fontWeight: '500',
    lineHeight: 34,
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
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: '#141414',
    borderColor: '#252525',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minHeight: 48,
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
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xl,
  },
  profileButton: {
    alignItems: 'center',
    backgroundColor: '#141414',
    borderColor: '#303030',
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  profileButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
