import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants';
import { Avatar } from './Avatar';

type ContactRowProps = {
  accessory?: ReactNode;
  disabled?: boolean;
  isLast?: boolean;
  name: string;
  onPress?: () => void;
  phone?: string;
};

export function ContactRow({
  accessory,
  disabled = false,
  isLast = false,
  name,
  onPress,
  phone,
}: ContactRowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={[styles.row, !isLast && styles.border]}
    >
      <Avatar label={name} />
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        {phone ? (
          <Text numberOfLines={1} style={styles.phone}>
            {phone}
          </Text>
        ) : null}
      </View>
      {accessory}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  border: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  phone: {
    color: colors.muted,
    fontSize: 14,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 68,
    paddingVertical: spacing.sm,
  },
});
