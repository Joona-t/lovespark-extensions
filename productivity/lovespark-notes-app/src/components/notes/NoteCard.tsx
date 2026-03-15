import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useTagStore } from '../../stores/tagStore';
import { formatDate, getDefaultTagColour } from '../../lib/formatters';
import { lightTap } from '../../utils/haptics';
import type { NoteEntry } from '../../lib/constants';

interface Props {
  note: NoteEntry;
  onPress: () => void;
  onLongPress?: () => void;
}

export function NoteCard({ note, onPress, onLongPress }: Props) {
  const { theme } = useTheme();
  const tags = useTagStore(s => s.tags);

  // Colour accent from first tag
  const firstTag = note.tags[0];
  const accentColour = firstTag
    ? (tags.find(t => t.name === firstTag)?.colour || getDefaultTagColour(firstTag).color)
    : theme.pinkAccent;

  return (
    <Pressable
      onPress={() => { lightTap(); onPress(); }}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Note: ${note.title || 'Untitled'}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.glass,
          borderColor: theme.glassBorder,
          borderRadius: theme.radius,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Colour accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColour }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          {note.pinned && <Text style={styles.pin}>PIN</Text>}
          <Text style={[styles.time, { color: theme.textMuted }]}>
            {formatDate(note.updatedAt)}
          </Text>
        </View>

        <Text style={[styles.title, { color: theme.textDark }]} numberOfLines={1}>
          {note.title || 'Untitled'}
        </Text>

        {note.snippet ? (
          <Text style={[styles.snippet, { color: theme.textMuted }]} numberOfLines={2}>
            {note.snippet}
          </Text>
        ) : null}

        {note.tags.length > 0 && (
          <View style={styles.tags}>
            {note.tags.slice(0, 3).map(tag => {
              const tc = tags.find(t => t.name === tag)?.colour || getDefaultTagColour(tag).color;
              return (
                <View key={tag} style={[styles.tag, { backgroundColor: tc + '22' }]}>
                  <Text style={[styles.tagText, { color: tc }]}>#{tag}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pin: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E8457C',
    letterSpacing: 1,
  },
  time: {
    fontSize: 11,
    marginLeft: 'auto',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  snippet: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
