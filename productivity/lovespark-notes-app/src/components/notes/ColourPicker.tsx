import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { COLOUR_SWATCHES } from '../../lib/constants';
import { selectionTap } from '../../utils/haptics';

interface Props {
  selected: string;
  onSelect: (colour: string) => void;
}

export function ColourPicker({ selected, onSelect }: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.grid}>
      {COLOUR_SWATCHES.map((colour) => (
        <Pressable
          key={colour}
          onPress={() => { selectionTap(); onSelect(colour); }}
          accessibilityRole="button"
          accessibilityLabel={`Select colour ${colour}`}
          accessibilityState={{ selected: colour === selected }}
          style={[
            styles.swatch,
            {
              backgroundColor: colour,
              borderColor: colour === selected ? theme.textDark : 'transparent',
              borderWidth: colour === selected ? 2 : 0,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 8,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
