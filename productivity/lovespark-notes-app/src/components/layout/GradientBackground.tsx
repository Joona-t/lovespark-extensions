import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  style?: object;
}

export function GradientBackground({ children, style }: Props) {
  const { theme } = useTheme();

  return (
    <LinearGradient
      colors={theme.bgGradient}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
