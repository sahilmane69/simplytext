import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton, Screen } from '../components';
import { colors, radius, spacing } from '../constants';
import { saveProfile } from '../services';

type ProfileSetupScreenProps = {
  onComplete: () => Promise<void>;
  phone?: string | null;
  userId?: string;
};

export function ProfileSetupScreen({ onComplete, phone, userId }: ProfileSetupScreenProps) {
  const [bio, setBio] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState('');

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

  const submitProfile = async () => {
    if (!userId) {
      setErrorMessage('Sign in again to continue');
      return;
    }

    if (!username.trim()) {
      setErrorMessage('Enter your username');
      return;
    }

    if (!image) {
      setErrorMessage('Choose a profile photo');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await saveProfile({ bio, image, phone, username, userId });
      await onComplete();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.kicker}>Profile</Text>
        <Text style={styles.title}>Set up your identity</Text>
        <View style={styles.card}>
          <View style={styles.photoRow}>
            <View style={styles.photo}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.photoImage} />
              ) : (
                <Text style={styles.photoInitial}>{username.trim().charAt(0).toUpperCase() || 'S'}</Text>
              )}
            </View>
            <View style={styles.photoCopy}>
              <Text style={styles.body}>Profile photo</Text>
              <AppButton
                disabled={isSubmitting}
                label={image ? 'Change photo' : 'Choose photo'}
                onPress={pickImage}
                variant="secondary"
              />
            </View>
          </View>
          <TextInput
            autoCapitalize="none"
            editable={!isSubmitting}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={colors.muted}
            style={styles.input}
            textContentType="username"
            value={username}
          />
          <TextInput
            editable={!isSubmitting}
            multiline
            onChangeText={setBio}
            placeholder="Bio (optional)"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.bioInput]}
            value={bio}
          />
        </View>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>

      <AppButton
        disabled={isSubmitting}
        label={isSubmitting ? 'Saving' : 'Finish setup'}
        onPress={submitProfile}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bioInput: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
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
    paddingTop: spacing.xl,
  },
  errorText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
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
  kicker: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
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
});
