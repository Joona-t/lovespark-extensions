import React from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { lightTap } from '../../utils/haptics';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
  style?: ViewStyle;
}

export function PinkButton({ title, onPress, variant = 'primary', disabled, style }: Props) {
  const { theme } = useTheme();

  const handlePress = () => {
    lightTap();
    onPress();
  };

  const isPrimary = variant === 'primary';
  const isDestructive = variant === 'destructive';

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.button,
        {
          borderRadius: theme.radiusSm,
          backgroundColor: isPrimary ? theme.pinkAccent : 'transparent',
          borderColor: isDestructive ? '#ef4444' : theme.glassBorder,
          borderWidth: isPrimary ? 0 : 1,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: isPrimary
              ? theme.textWhite
              : isDestructive
                ? '#ef4444'
                : theme.textDark,
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
