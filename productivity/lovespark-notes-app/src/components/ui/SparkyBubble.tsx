import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Sparky } from './Sparky';

interface Props {
  message: string;
  size?: number;
}

export function SparkyBubble({ message, size = 48 }: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { backgroundColor: theme.glass, borderColor: theme.glassBorder, borderRadius: theme.radius }]}>
        <Text style={[styles.text, { color: theme.textDark }]}>{message}</Text>
      </View>
      <Sparky size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    maxWidth: 240,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
