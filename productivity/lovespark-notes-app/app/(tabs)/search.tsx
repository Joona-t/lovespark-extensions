import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { SearchBar } from '../../src/components/search/SearchBar';
import { NoteCard } from '../../src/components/notes/NoteCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useNotesStore } from '../../src/stores/notesStore';
import { usePrefsStore } from '../../src/stores/prefsStore';
import { storage } from '../../src/stores/mmkv';
import type { NoteEntry } from '../../src/lib/constants';

export default function SearchScreen() {
  const router = useRouter();
  const notes = useNotesStore(s => s.notes);
  const filterNotes = useNotesStore(s => s.filterNotes);
  const setLastEditedId = usePrefsStore(s => s.setLastEditedId);
  const [query, setQuery] = useState('');

  // Quick search: index-based (title, tags, snippet)
  const indexResults = useMemo(
    () => query ? filterNotes({ search: query }) : [],
    [query, filterNotes, notes], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Full-text content search for results not caught by index
  const results = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    const indexIds = new Set(indexResults.map(n => n.id));

    // Search content of notes not already matched
    const activeNotes = notes.filter(n => !n.deletedAt && !indexIds.has(n.id));
    const contentMatches: NoteEntry[] = [];
    for (const note of activeNotes) {
      const content = storage.getString('note_' + note.id);
      if (content && content.toLowerCase().includes(q)) {
        contentMatches.push(note);
      }
    }

    return [...indexResults, ...contentMatches];
  }, [query, indexResults, notes]);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
  }, []);

  const handleNotePress = (id: string) => {
    setLastEditedId(id);
    router.push(`/note/${id}`);
  };

  return (
    <ScreenWrapper>
      <SearchBar onSearch={handleSearch} />
      {query && results.length === 0 ? (
        <EmptyState message="No notes found. Try a different search." />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => handleNotePress(item.id)}
            />
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 100,
  },
});
