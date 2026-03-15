import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Modal, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../../src/components/layout/GradientBackground';
import { NoteEditor } from '../../src/components/notes/NoteEditor';
import { TagBar } from '../../src/components/notes/TagBar';
import { VersionHistory } from '../../src/components/notes/VersionHistory';
import { ProGate } from '../../src/components/ui/ProGate';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useNotesStore } from '../../src/stores/notesStore';
import { usePrefsStore } from '../../src/stores/prefsStore';
import { useProStore } from '../../src/stores/proStore';
import { lightTap, mediumTap, warningNotification } from '../../src/utils/haptics';
import { formatDate, wordCount } from '../../src/lib/formatters';
import type { NoteVersion } from '../../src/lib/constants';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const isPro = useProStore(s => s.isPro);

  const notes = useNotesStore(s => s.notes);
  const updateNote = useNotesStore(s => s.updateNote);
  const deleteNote = useNotesStore(s => s.deleteNote);
  const togglePin = useNotesStore(s => s.togglePin);
  const loadContent = useNotesStore(s => s.loadContent);
  const pushVersion = useNotesStore(s => s.pushVersion);
  const loadVersions = useNotesStore(s => s.loadVersions);
  const restoreVersion = useNotesStore(s => s.restoreVersion);
  const setLastEditedId = usePrefsStore(s => s.setLastEditedId);

  const note = useMemo(() => notes.find(n => n.id === id), [notes, id]);
  const initialContent = useMemo(() => id ? loadContent(id) : '', [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [menuVisible, setMenuVisible] = useState(false);
  const [versionsVisible, setVersionsVisible] = useState(false);

  const handleChangeTitle = useCallback((title: string) => {
    if (!id) return;
    updateNote(id, { title });
  }, [id, updateNote]);

  const handleChangeContent = useCallback((content: string) => {
    if (!id) return;
    pushVersion(id);
    updateNote(id, { content });
  }, [id, updateNote, pushVersion]);

  const handleAddTag = useCallback((tag: string) => {
    if (!note) return;
    updateNote(note.id, { tags: [...note.tags, tag] });
  }, [note, updateNote]);

  const handleRemoveTag = useCallback((tag: string) => {
    if (!note) return;
    updateNote(note.id, { tags: note.tags.filter(t => t !== tag) });
  }, [note, updateNote]);

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Move this note to trash?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (id) deleteNote(id);
          router.back();
        },
      },
    ]);
  };

  const handlePin = () => {
    if (!id) return;
    const result = togglePin(id);
    if (result === false && !note?.pinned) {
      warningNotification();
      Alert.alert('Pin Limit', 'You can pin up to 10 notes.');
    }
    setMenuVisible(false);
  };

  const handleRestoreVersion = (version: NoteVersion) => {
    if (!id) return;
    mediumTap();
    restoreVersion(id, version);
    setVersionsVisible(false);
  };

  if (!note) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <Text style={[styles.errorText, { color: theme.textMuted }]}>Note not found</Text>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Nav bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => { lightTap(); setLastEditedId(id!); router.back(); }}
            accessibilityLabel="Go back"
            style={styles.backBtn}
          >
            <Text style={[styles.backText, { color: theme.pinkAccent }]}>← Back</Text>
          </Pressable>

          <View style={styles.navRight}>
            <Text style={[styles.wordCount, { color: theme.textMuted }]}>
              {note.wordCount}w
            </Text>
            <Pressable
              onPress={() => { lightTap(); setMenuVisible(true); }}
              accessibilityLabel="Note options"
              style={styles.menuBtn}
            >
              <Text style={[styles.menuDots, { color: theme.textDark }]}>⋯</Text>
            </Pressable>
          </View>
        </View>

        {/* Editor */}
        <NoteEditor
          initialTitle={note.title}
          initialContent={initialContent}
          onChangeTitle={handleChangeTitle}
          onChangeContent={handleChangeContent}
          autoFocus={!note.title && !initialContent}
        >
          <TagBar
            tags={note.tags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        </NoteEditor>

        {/* Options menu */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
            <View style={[styles.menu, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder, borderRadius: theme.radius }]}>
              <MenuItem
                label={note.pinned ? 'Unpin' : 'Pin'}
                onPress={handlePin}
                theme={theme}
              />
              <MenuItem
                label="Version History"
                onPress={() => {
                  setMenuVisible(false);
                  setVersionsVisible(true);
                }}
                theme={theme}
                pro={!isPro}
              />
              <MenuItem
                label="Delete"
                onPress={() => { setMenuVisible(false); handleDelete(); }}
                theme={theme}
                destructive
              />
            </View>
          </Pressable>
        </Modal>

        {/* Version history modal */}
        <Modal
          visible={versionsVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setVersionsVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setVersionsVisible(false)}>
            <View style={[styles.versionSheet, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder, borderTopLeftRadius: theme.radius, borderTopRightRadius: theme.radius }]}>
              <Text style={[styles.versionTitle, { color: theme.textDark }]}>Version History</Text>
              <ProGate fallbackMessage="Version history is a Pro feature">
                <VersionHistory
                  versions={id ? loadVersions(id) : []}
                  onRestore={handleRestoreVersion}
                />
              </ProGate>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}

function MenuItem({ label, onPress, theme, destructive, pro }: {
  label: string;
  onPress: () => void;
  theme: { textDark: string; radiusSm: number };
  destructive?: boolean;
  pro?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.menuItem, { borderRadius: theme.radiusSm }]}
      disabled={pro}
    >
      <Text style={[
        styles.menuLabel,
        { color: destructive ? '#ef4444' : theme.textDark, opacity: pro ? 0.5 : 1 },
      ]}>
        {label}
      </Text>
      {pro && (
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    padding: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wordCount: {
    fontSize: 12,
  },
  menuBtn: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDots: {
    fontSize: 20,
    fontWeight: '700',
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    gap: 8,
  },
  menuLabel: {
    fontSize: 14,
    flex: 1,
  },
  proBadge: {
    backgroundColor: '#E8457C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  versionSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '60%',
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
  },
  versionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 100,
  },
});
