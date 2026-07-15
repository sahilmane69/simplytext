import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TextInput } from 'react-native';
import { AppButton, Screen } from '../components';
import { colors, radius, spacing } from '../constants';

type LoginScreenProps = {
  onContinue: () => void;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<unknown>;
};

export function LoginScreen({ onContinue, sendOtp, verifyOtp }: LoginScreenProps) {
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPhone = async () => {
    const formattedPhone = phone.trim();

    if (!formattedPhone) {
      setErrorMessage('Enter your mobile number');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await sendOtp(formattedPhone);
      setOtpSent(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOtp = async () => {
    const formattedPhone = phone.trim();
    const formattedToken = token.trim();

    if (!formattedToken) {
      setErrorMessage('Enter the OTP');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await verifyOtp(formattedPhone, formattedToken);
      onContinue();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to verify OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.kicker}>Login</Text>
        <Text style={styles.title}>Welcome back</Text>
        <View style={styles.inputPlaceholder}>
          <TextInput
            autoComplete="tel"
            editable={!isSubmitting && !otpSent}
            inputMode="tel"
            keyboardType="phone-pad"
            onChangeText={setPhone}
            placeholder="Mobile number"
            placeholderTextColor={colors.muted}
            style={styles.input}
            textContentType="telephoneNumber"
            value={phone}
          />
          {otpSent && (
            <TextInput
              autoComplete="sms-otp"
              editable={!isSubmitting}
              inputMode="numeric"
              keyboardType="number-pad"
              maxLength={8}
              onChangeText={setToken}
              placeholder="OTP"
              placeholderTextColor={colors.muted}
              style={styles.input}
              textContentType="oneTimeCode"
              value={token}
            />
          )}
        </View>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>

      <AppButton
        label={isSubmitting ? 'Please wait' : otpSent ? 'Verify OTP' : 'Send OTP'}
        onPress={otpSent ? submitOtp : submitPhone}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    color: colors.text,
    fontSize: 16,
    minHeight: 32,
  },
  inputPlaceholder: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  kicker: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  placeholderText: {
    color: colors.muted,
    fontSize: 16,
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
  },
});
