import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { Sparky } from '../../src/components/ui/Sparky';
import { ThemeDropdown } from '../../src/components/ui/ThemeDropdown';
import { ColourChip } from '../../src/components/ui/ColourChip';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { SparkyBubble } from '../../src/components/ui/SparkyBubble';
import { NoteCard } from '../../src/components/notes/NoteCard';
import { useNotesStore } from '../../src/stores/notesStore';
import { useTagStore } from '../../src/stores/tagStore';
import { usePrefsStore } from '../../src/stores/prefsStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useSparkyMood } from '../../src/hooks/useSparkyMood';
import { lightTap } from '../../src/utils/haptics';

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const notes = useNotesStore(s => s.notes);
  const filterNotes = useNotesStore(s => s.filterNotes);
  const togglePin = useNotesStore(s => s.togglePin);
  const deleteNote = useNotesStore(s => s.deleteNote);
  const tags = useTagStore(s => s.tags);
  const sortOrder = usePrefsStore(s => s.sortOrder);
  const setLastEditedId = usePrefsStore(s => s.setLastEditedId);
  const sparky = useSparkyMood();

  const [activeTags, setActiveTags] = useState<string[]>([]);

  const filteredNotes = useMemo(
    () => filterNotes({ tags: activeTags, sortOrder }),
    [filterNotes, activeTags, sortOrder, notes], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Collect unique tags from active (non-deleted) notes
  const usedTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.filter(n => !n.deletedAt).forEach(n => n.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  }, [notes]);

  const toggleTagFilter = (tag: string) => {
    lightTap();
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleNotePress = (id: string) => {
    setLastEditedId(id);
    router.push(`/note/${id}`);
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparky size={36} />
          <Text style={[styles.title, { color: theme.titleColor || theme.textDark }]}>
            Notes
          </Text>
        </View>
        <ThemeDropdown />
      </View>

      {/* Tag filter chips */}
      {usedTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipBar}
        >
          {activeTags.length > 0 && (
            <ColourChip
              label="All"
              colour={theme.pinkAccent}
              active={false}
              onPress={() => setActiveTags([])}
            />
          )}
          {usedTags.map(tag => {
            const td = tags.find(t => t.name === tag);
            return (
              <ColourChip
                key={tag}
                label={tag}
                colour={td?.colour || theme.pinkAccent}
                active={activeTags.includes(tag)}
                onPress={() => toggleTagFilter(tag)}
              />
            );
          })}
        </ScrollView>
      )}

      {/* Note list */}
      {filteredNotes.length === 0 ? (
        notes.filter(n => !n.deletedAt).length === 0 ? (
          <EmptyState message="No notes yet. Tap + to start writing!" />
        ) : (
          <EmptyState message="No notes match your filters." />
        )
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => handleNotePress(item.id)}
              onLongPress={() => {
                lightTap();
                if (item.pinned) {
                  togglePin(item.id);
                } else {
                  togglePin(item.id);
                }
              }}
            />
          )}
        />
      )}

      {/* Sparky idle bubble */}
      {sparky.mood === 'idle' && filteredNotes.length > 0 && (
        <View style={styles.sparkyIdle} pointerEvents="none">
          <SparkyBubble message={sparky.message} size={36} />
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  chipBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sparkyIdle: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.6,
  },
});
