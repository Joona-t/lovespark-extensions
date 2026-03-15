import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { selectionTap } from '../../utils/haptics';

interface Props {
  label: string;
  colour: string;
  active?: boolean;
  onPress: () => void;
}

export function ColourChip({ label, colour, active, onPress }: Props) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={() => { selectionTap(); onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={`Filter by tag: ${label}`}
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colour + '33' : theme.glass,
          borderColor: active ? colour : theme.glassBorder,
          borderRadius: theme.radiusSm,
        },
      ]}
    >
      <Text style={[styles.text, { color: active ? colour : theme.textMuted }]}>
        #{label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
