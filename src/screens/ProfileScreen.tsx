import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton, Screen } from '../components';
import { colors, radius, spacing } from '../constants';
import { Profile, saveProfile } from '../services';

type ProfileScreenProps = {
  onBack: () => void;
  onOpenSettings: () => void;
  onSaved: () => Promise<void>;
  phone?: string | null;
  profile: Profile;
};

export function ProfileScreen({ onBack, onOpenSettings, onSaved, phone, profile }: ProfileScreenProps) {
  const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState(profile.username || profile.name);

  useEffect(() => {
    setAvatar(null);
    setBio(profile.bio ?? '');
    setUsername(profile.username || profile.name);
  }, [profile]);

  const pickAvatar = async () => {
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
      setAvatar(result.assets[0]);
    }
  };

  const saveChanges = async () => {
    if (!username.trim()) {
      setErrorMessage('Enter your username');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      await saveProfile({
        bio,
        currentAvatarUrl: profile.avatar_url,
        image: avatar,
        phone,
        username,
        userId: profile.id,
      });
      await onSaved();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const avatarUri = avatar?.uri ?? profile.avatar_url;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onOpenSettings} style={styles.settingsButton}>
            <Text style={styles.settingsButtonText}>Settings</Text>
          </Pressable>
        </View>

        <View style={styles.identity}>
          <Pressable accessibilityRole="button" onPress={pickAvatar} style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{username.trim().charAt(0).toUpperCase() || 'S'}</Text>
            )}
          </Pressable>
          <Text style={styles.title}>{profile.name}</Text>
          <Text style={styles.phone}>{phone ?? profile.phone ?? 'No phone number'}</Text>
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>

        <View style={styles.card}>
          <TextInput
            autoCapitalize="none"
            editable={!isSaving}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={colors.muted}
            style={styles.input}
            textContentType="username"
            value={username}
          />
          <TextInput
            editable={!isSaving}
            multiline
            onChangeText={setBio}
            placeholder="Bio (optional)"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.bioInput]}
            value={bio}
          />
          <AppButton disabled={isSaving} label={avatar ? 'Change selected' : 'Edit profile photo'} onPress={pickAvatar} variant="secondary" />
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>

      <AppButton disabled={isSaving} label={isSaving ? 'Saving' : 'Save changes'} onPress={saveChanges} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 52,
    borderWidth: 1,
    height: 104,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 104,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarInitial: {
    color: colors.accent,
    fontSize: 34,
    fontWeight: '800',
  },
  backButton: {
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
  bio: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  bioInput: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  errorText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  identity: {
    alignItems: 'center',
    gap: spacing.sm,
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
  phone: {
    color: colors.muted,
    fontSize: 15,
  },
  settingsButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  settingsButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
});
