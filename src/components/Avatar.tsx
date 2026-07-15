import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants';

type AvatarProps = {
  label: string;
  size?: number;
};

export function Avatar({ label, size = 44 }: AvatarProps) {
  const initial = label.trim().charAt(0).toUpperCase() || 'S';

  return (
    <View style={[styles.avatar, { borderRadius: size / 2, height: size, width: size }]}>
      <Text style={styles.text}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderColor: '#303030',
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
