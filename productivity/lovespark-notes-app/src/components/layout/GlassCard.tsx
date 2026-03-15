import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  strong?: boolean;
}

export function GlassCard({ children, style, strong }: Props) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: theme.radius,
          borderColor: theme.glassBorder,
          backgroundColor: strong ? theme.glassStrong : theme.glass,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
  },
});
