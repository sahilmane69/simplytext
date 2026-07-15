import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants';

type StatePanelProps = {
  action?: ReactNode;
  children?: ReactNode;
  title?: string;
};

export function StatePanel({ action, children, title }: StatePanelProps) {
  return (
    <View style={styles.panel}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {typeof children === 'string' ? <Text style={styles.text}>{children}</Text> : children}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  text: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
