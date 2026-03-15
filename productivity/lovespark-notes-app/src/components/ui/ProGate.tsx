import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useProStore } from '../../stores/proStore';
import { ProBadge } from './ProBadge';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

export function ProGate({ children, fallbackMessage = 'Available with Pro' }: Props) {
  const isPro = useProStore(s => s.isPro);
  const { theme } = useTheme();

  if (isPro) return <>{children}</>;

  return (
    <View style={[styles.container, { borderColor: theme.glassBorder, borderRadius: theme.radiusSm }]}>
      <View style={styles.row}>
        <ProBadge />
        <Text style={[styles.text, { color: theme.textMuted }]}>{fallbackMessage}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 12,
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 13,
  },
});
