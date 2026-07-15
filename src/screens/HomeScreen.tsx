import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppButton, ContactRow, Screen, StatePanel } from '../components';
import { colors, radius, spacing } from '../constants';
import { useContacts } from '../hooks';
import { MatchedContact, Profile } from '../services';

type HomeScreenProps = {
  avatarUrl?: string | null;
  onCreateGroup: () => void;
  onOpenChat: (profile: Profile) => void;
  onOpenProfile: () => void;
  profileName?: string;
};

export function HomeScreen({ avatarUrl, onCreateGroup, onOpenChat, onOpenProfile, profileName }: HomeScreenProps) {
  const { contacts, errorMessage, hasPermission, isLoading, loadContacts } = useContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const filteredContacts = useFilteredContacts(contacts, searchQuery);
  const registeredContacts = useMemo(
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
          <Pressable
            accessibilityLabel="Open profile"
            accessibilityRole="button"
            onPress={onOpenProfile}
            style={styles.profileButton}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
            ) : (
              <Text style={styles.profileButtonText}>{profileName?.charAt(0).toUpperCase() ?? 'P'}</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchLabel}>Search</Text>
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
          <StatePanel>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.stateText}>Checking your contacts</Text>
          </StatePanel>
        ) : null}

        {!isLoading && !hasPermission ? (
          <StatePanel
            action={<AppButton label="Allow contacts" onPress={loadContacts} />}
            title="Contacts permission needed"
          >
            Allow contacts to see who is already on SimplyText.
          </StatePanel>
        ) : null}

        {!isLoading && hasPermission && errorMessage ? (
          <StatePanel action={<AppButton label="Try again" onPress={loadContacts} />} title="Unable to load contacts">
            {errorMessage}
          </StatePanel>
        ) : null}

        {!isLoading && hasPermission && !errorMessage ? (
          <>
            <ContactSection
              contacts={registeredContacts}
              emptyText={
                searchQuery ? 'No registered contacts match your search.' : 'No contacts are on SimplyText yet.'
              }
              onOpenChat={onOpenChat}
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

      <Pressable
        accessibilityLabel="Create group"
        accessibilityRole="button"
        onPress={onCreateGroup}
        style={styles.groupButton}
      >
        <Text style={styles.groupButtonText}>+</Text>
      </Pressable>
    </Screen>
  );
}

type ContactSectionProps = {
  contacts: MatchedContact[];
  emptyText: string;
  onOpenChat?: (profile: Profile) => void;
  showInvite?: boolean;
  title: string;
};

function ContactSection({ contacts, emptyText, onOpenChat, showInvite = false, title }: ContactSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.list}>
        {contacts.length === 0 ? <Text style={styles.emptyText}>{emptyText}</Text> : null}
        {contacts.map((contact, index) => {
          const name = contact.profile?.name ?? contact.name;
          const profile = contact.profile;
          const openChat = profile && !showInvite ? () => onOpenChat?.(profile) : undefined;

          return (
            <ContactRow
              accessory={showInvite ? <InviteBadge /> : undefined}
              isLast={index === contacts.length - 1}
              key={contact.id}
              name={name}
              onPress={openChat}
              phone={contact.phoneNumbers[0]}
            />
          );
        })}
      </View>
    </View>
  );
}

function InviteBadge() {
  return (
    <View style={styles.inviteButton}>
      <Text style={styles.inviteText}>Invite</Text>
    </View>
  );
}

function useFilteredContacts(contacts: MatchedContact[], searchQuery: string) {
  return useMemo(() => {
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
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 112,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: spacing.md,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
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
  inviteButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: '#3A3A3A',
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
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
  profileButton: {
    alignItems: 'center',
    backgroundColor: '#141414',
    borderColor: '#303030',
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48,
  },
  profileButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  profileImage: {
    height: '100%',
    width: '100%',
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
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minHeight: 48,
  },
  searchLabel: {
    color: colors.muted,
    fontSize: 13,
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
  stateText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
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
});
