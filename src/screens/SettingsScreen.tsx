import { ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, Screen } from '../components';
import { colors, radius, spacing } from '../constants';

type SettingsScreenProps = {
  onBack: () => void;
  onLogout: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenTerms: () => void;
};

type SettingsValue = Record<string, boolean>;

const initialSettings: SettingsValue = {
  contactsPermission: true,
  darkMode: true,
  groupNotifications: true,
  messageNotifications: true,
  profileVisibility: true,
  pushNotifications: true,
  sound: true,
  vibration: true,
};

export function SettingsScreen({ onBack, onLogout, onOpenPrivacyPolicy, onOpenTerms }: SettingsScreenProps) {
  const [settings, setSettings] = useState(initialSettings);

  const toggle = (key: string) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: !currentSettings[key],
    }));
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.kicker}>Settings</Text>
          <Text style={styles.title}>Preferences</Text>
        </View>

        <SettingsSection title="Notifications">
          <SettingsToggle label="Push Notifications" onPress={() => toggle('pushNotifications')} value={settings.pushNotifications} />
          <SettingsToggle label="Message Notifications" onPress={() => toggle('messageNotifications')} value={settings.messageNotifications} />
          <SettingsToggle label="Group Notifications" onPress={() => toggle('groupNotifications')} value={settings.groupNotifications} />
          <SettingsToggle label="Sound" onPress={() => toggle('sound')} value={settings.sound} />
          <SettingsToggle label="Vibration" onPress={() => toggle('vibration')} value={settings.vibration} />
        </SettingsSection>

        <SettingsSection title="Privacy">
          <SettingsToggle label="Contacts Permission" onPress={() => toggle('contactsPermission')} value={settings.contactsPermission} />
          <SettingsToggle label="Profile Visibility" onPress={() => toggle('profileVisibility')} value={settings.profileVisibility} />
          <SettingsRow label="Blocked Users" value="Coming soon" />
        </SettingsSection>

        <SettingsSection title="Appearance">
          <SettingsToggle disabled label="Dark Mode" onPress={() => toggle('darkMode')} value={settings.darkMode} />
          <SettingsRow label="App Theme Accent" value="Purple" />
        </SettingsSection>

        <SettingsSection title="Storage">
          <SettingsAction label="Clear Local Cache" onPress={() => undefined} />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow label="App Version" value="1.0.0" />
          <SettingsAction label="Terms & Conditions" onPress={onOpenTerms} />
          <SettingsAction label="Privacy Policy" onPress={onOpenPrivacyPolicy} />
          <SettingsAction label="Contact Support" onPress={() => undefined} />
        </SettingsSection>

        <SettingsSection title="Account">
          <AppButton label="Logout" onPress={onLogout} variant="secondary" />
        </SettingsSection>
      </ScrollView>
    </Screen>
  );
}

type SettingsSectionProps = {
  children: ReactNode;
  title: string;
};

function SettingsSection({ children, title }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

type SettingsRowProps = {
  label: string;
  value: string;
};

function SettingsRow({ label, value }: SettingsRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

type SettingsActionProps = {
  label: string;
  onPress: () => void;
};

function SettingsAction({ label, onPress }: SettingsActionProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>Open</Text>
    </Pressable>
  );
}

type SettingsToggleProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  value: boolean;
};

function SettingsToggle({ disabled = false, label, onPress, value }: SettingsToggleProps) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value, disabled }} disabled={disabled} onPress={onPress} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.switchTrack, value && styles.switchTrackEnabled]}>
        <View style={[styles.switchThumb, value && styles.switchThumbEnabled]} />
      </View>
    </Pressable>
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
    paddingHorizontal: spacing.md,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
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
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  rowValue: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  switchThumb: {
    backgroundColor: colors.muted,
    borderRadius: 10,
    height: 20,
    width: 20,
  },
  switchThumbEnabled: {
    backgroundColor: colors.text,
    transform: [{ translateX: 20 }],
  },
  switchTrack: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 3,
    width: 46,
  },
  switchTrackEnabled: {
    backgroundColor: colors.accent,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
  },
});
