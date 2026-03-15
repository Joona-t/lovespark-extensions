import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Sparky } from './Sparky';

interface Props {
  message: string;
}

export function EmptyState({ message }: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Sparky size={64} />
      <Text style={[styles.message, { color: theme.textMuted }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
});
