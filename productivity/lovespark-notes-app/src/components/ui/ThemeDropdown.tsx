import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { THEME_LIST, THEMES } from '../../theme/tokens';
import { selectionTap } from '../../utils/haptics';

export function ThemeDropdown() {
  const { theme, themeId, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => { setOpen(true); selectionTap(); }}
        accessibilityRole="button"
        accessibilityLabel="Change Theme"
        style={[
          styles.trigger,
          {
            backgroundColor: theme.glass,
            borderColor: theme.glassBorder,
            borderRadius: theme.radiusSm,
          },
        ]}
      >
        <Text style={[styles.triggerText, { color: theme.textDark }]}>
          {theme.label}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.menu,
              {
                backgroundColor: theme.glassStrong,
                borderColor: theme.glassBorder,
                borderRadius: theme.radius,
              },
            ]}
          >
            <Text style={[styles.header, { color: theme.textMuted }]}>
              Change Theme
            </Text>
            {THEME_LIST.map((id) => (
              <Pressable
                key={id}
                onPress={() => {
                  setTheme(id);
                  selectionTap();
                  setOpen(false);
                }}
                style={[
                  styles.option,
                  { borderRadius: theme.radiusSm },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: id === themeId ? theme.pinkAccent : theme.textDark,
                      fontWeight: id === themeId ? '600' : '400',
                    },
                  ]}
                >
                  {THEMES[id].label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  triggerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    width: 200,
    borderWidth: 1,
    padding: 8,
  },
  header: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 14,
  },
});
