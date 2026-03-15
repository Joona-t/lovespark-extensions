import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { mediumTap } from '../../utils/haptics';

interface Props {
  onPress: () => void;
  onLongPress?: () => void;
}

export function FAB({ onPress, onLongPress }: Props) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={() => { mediumTap(); onPress(); }}
      onLongPress={() => { mediumTap(); onLongPress?.(); }}
      accessibilityRole="button"
      accessibilityLabel="Create new note"
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: theme.pinkAccent,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Text style={styles.icon}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 100,
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
});
