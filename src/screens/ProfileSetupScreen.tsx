import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton, Screen } from '../components';
import { colors, radius, spacing } from '../constants';
import { saveProfile } from '../services';

type ProfileSetupScreenProps = {
  onComplete: () => Promise<void>;
  phone?: string | null;
  userId?: string;
};

export function ProfileSetupScreen({ onComplete, phone, userId }: ProfileSetupScreenProps) {
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitProfile = async () => {
    if (!userId) {
      setErrorMessage('Sign in again to continue');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Enter your name');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await saveProfile({ name, phone, userId });
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
          <TextInput
            autoCapitalize="words"
            editable={!isSubmitting}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={colors.muted}
            style={styles.input}
            textContentType="name"
            value={name}
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
});
