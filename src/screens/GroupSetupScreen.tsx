import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton, ContactRow, Screen } from '../components';
import { colors, radius, spacing } from '../constants';
import { useContacts } from '../hooks';
import { ChatTarget, createGroupConversation, Profile } from '../services';

type GroupSetupScreenProps = {
  currentUserId: string;
  onBack: () => void;
  onCreated: (target: ChatTarget) => void;
};

export function GroupSetupScreen({ currentUserId, onBack, onCreated }: GroupSetupScreenProps) {
  const { contacts, errorMessage: contactsError, hasPermission, isLoading } = useContacts();
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const registeredContacts = useMemo(
    () => contacts.filter((contact) => Boolean(contact.profile)),
    [contacts],
  );
  const selectedMembers = useMemo(
    () =>
      registeredContacts
        .map((contact) => contact.profile)
        .filter((profile): profile is Profile => Boolean(profile && selectedIds.has(profile.id))),
    [registeredContacts, selectedIds],
  );

  const toggleContact = (profile: Profile) => {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(profile.id)) {
        nextIds.delete(profile.id);
      } else {
        nextIds.add(profile.id);
      }

      return nextIds;
    });
  };

  const createGroup = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const conversation = await createGroupConversation({
        currentUserId,
        members: selectedMembers,
        name,
      });

      onCreated({
        conversation,
        memberCount: selectedMembers.length + 1,
        type: 'group',
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleError =
    errorMessage || contactsError || (!isLoading && !hasPermission ? 'Contacts permission is required to create a group' : '');

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.eyebrow}>Groups</Text>
          <Text style={styles.title}>New group</Text>
        </View>

        <View style={styles.card}>
          <TextInput
            editable={!isSubmitting}
            onChangeText={setName}
            placeholder="Group name"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={name}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select contacts</Text>
          <View style={styles.list}>
            {isLoading ? (
              <View style={styles.stateRow}>
                <ActivityIndicator color={colors.accent} />
                <Text style={styles.stateText}>Loading contacts</Text>
              </View>
            ) : null}
            {!isLoading && registeredContacts.length === 0 ? (
              <Text style={styles.emptyText}>No registered contacts available.</Text>
            ) : null}
            {registeredContacts.map((contact, index) => {
              const profile = contact.profile;

              if (!profile) {
                return null;
              }

              const isSelected = selectedIds.has(profile.id);

              return (
                <ContactRow
                  accessory={<SelectionIndicator selected={isSelected} />}
                  isLast={index === registeredContacts.length - 1}
                  key={profile.id}
                  name={profile.name}
                  onPress={() => toggleContact(profile)}
                  phone={contact.phoneNumbers[0]}
                />
              );
            })}
          </View>
        </View>

        {visibleError ? <Text style={styles.errorText}>{visibleError}</Text> : null}
      </ScrollView>

      <AppButton
        disabled={isSubmitting}
        label={isSubmitting ? 'Creating' : `Create group (${selectedMembers.length})`}
        onPress={createGroup}
      />
    </Screen>
  );
}

function SelectionIndicator({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
      {selected ? <Text style={styles.checkboxText}>x</Text> : null}
    </View>
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
  card: {
    backgroundColor: '#141414',
    borderColor: '#252525',
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.md,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#3A3A3A',
    borderRadius: 10,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  checkboxSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  checkboxText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '900',
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: spacing.md,
  },
  errorText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
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
  input: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  list: {
    backgroundColor: '#141414',
    borderColor: '#252525',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
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
  stateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 68,
  },
  stateText: {
    color: colors.muted,
    fontSize: 15,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
  },
});
