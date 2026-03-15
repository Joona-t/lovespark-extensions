import React from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { formatDate } from '../../lib/formatters';
import { lightTap } from '../../utils/haptics';
import type { NoteVersion } from '../../lib/constants';

interface Props {
  versions: NoteVersion[];
  onRestore: (version: NoteVersion) => void;
}

export function VersionHistory({ versions, onRestore }: Props) {
  const { theme } = useTheme();

  if (versions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          No versions yet. Versions are saved as you edit.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={[...versions].reverse()}
      keyExtractor={(_, i) => String(i)}
      renderItem={({ item }) => (
        <View style={[styles.item, { borderBottomColor: theme.glassBorder }]}>
          <View style={styles.info}>
            <Text style={[styles.time, { color: theme.textDark }]}>
              {formatDate(item.ts)}
            </Text>
            <Text style={[styles.preview, { color: theme.textMuted }]} numberOfLines={1}>
              {item.content.replace(/\n/g, ' ').slice(0, 60)}
            </Text>
          </View>
          <Pressable
            onPress={() => { lightTap(); onRestore(item); }}
            accessibilityLabel={`Restore version from ${formatDate(item.ts)}`}
            style={[styles.restoreBtn, { borderColor: theme.pinkAccent, borderRadius: theme.radiusSm }]}
          >
            <Text style={[styles.restoreText, { color: theme.pinkAccent }]}>Restore</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: 24,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  time: {
    fontSize: 13,
    fontWeight: '500',
  },
  preview: {
    fontSize: 12,
  },
  restoreBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: 'center',
  },
  restoreText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
