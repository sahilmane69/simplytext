import { useCallback, useEffect, useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
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
import { AppButton, Screen } from '../components';
import { colors, radius, spacing } from '../constants';
import {
  ChatTarget,
  createGroupConversation,
  getContactsWithRegistrationStatus,
  MatchedContact,
  requestContactsPermission,
} from '../services';
import { Profile } from '../services/profiles';

type GroupSetupScreenProps = {
  currentUserId: string;
  onBack: () => void;
  onCreated: (target: ChatTarget) => void;
};

export function GroupSetupScreen({ currentUserId, onBack, onCreated }: GroupSetupScreenProps) {
  const [contacts, setContacts] = useState<MatchedContact[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const hasPermission = await requestContactsPermission();

      if (!hasPermission) {
        setContacts([]);
        setErrorMessage('Contacts permission is required to create a group');
        return;
      }

      const nextContacts = await getContactsWithRegistrationStatus();
      setContacts(nextContacts.filter((contact) => Boolean(contact.profile)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const selectedMembers = useMemo(
    () =>
      contacts
        .map((contact) => contact.profile)
        .filter((profile): profile is Profile => Boolean(profile && selectedIds.has(profile.id))),
    [contacts, selectedIds],
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

  const pickImage = async () => {
    setErrorMessage('');

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage('Photo library permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const createGroup = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const conversation = await createGroupConversation({
        currentUserId,
        image,
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
          <View style={styles.photoRow}>
            <View style={styles.photo}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.photoImage} />
              ) : (
                <Text style={styles.photoInitial}>{name.trim().charAt(0).toUpperCase() || 'G'}</Text>
              )}
            </View>
            <View style={styles.photoCopy}>
              <Text style={styles.cardTitle}>Group photo</Text>
              <AppButton
                disabled={isSubmitting}
                label={image ? 'Change photo' : 'Choose photo'}
                onPress={pickImage}
                variant="secondary"
              />
            </View>
          </View>
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
            {!isLoading && contacts.length === 0 ? (
              <Text style={styles.emptyText}>No registered contacts available.</Text>
            ) : null}
            {contacts.map((contact, index) => {
              const profile = contact.profile;

              if (!profile) {
                return null;
              }

              const isSelected = selectedIds.has(profile.id);

              return (
                <Pressable
                  key={profile.id}
                  onPress={() => toggleContact(profile)}
                  style={[styles.contactRow, index < contacts.length - 1 && styles.contactRowBorder]}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected ? <Text style={styles.checkboxText}>x</Text> : null}
                  </View>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.contactCopy}>
                    <Text numberOfLines={1} style={styles.contactName}>
                      {profile.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.contactPhone}>
                      {contact.phoneNumbers[0]}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>

      <AppButton
        disabled={isSubmitting}
        label={isSubmitting ? 'Creating' : `Create group (${selectedMembers.length})`}
        onPress={createGroup}
      />
    </Screen>
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
  backButton: {
    alignSelf: 'flex-start',
    borderColor: '#303030',
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
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
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
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
    paddingBottom: spacing.xl,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: spacing.sm,
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
  photo: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 36,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 72,
  },
  photoCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  photoImage: {
    height: '100%',
    width: '100%',
  },
  photoInitial: {
    color: colors.accent,
    fontSize: 26,
    fontWeight: '800',
  },
  photoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
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
