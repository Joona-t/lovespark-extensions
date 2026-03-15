import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { Sparky } from '../../src/components/ui/Sparky';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ColourPicker } from '../../src/components/notes/ColourPicker';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useTagStore } from '../../src/stores/tagStore';
import { useNotesStore } from '../../src/stores/notesStore';
import { lightTap } from '../../src/utils/haptics';

export default function TagsScreen() {
  const { theme } = useTheme();
  const tags = useTagStore(s => s.tags);
  const deleteTag = useTagStore(s => s.deleteTag);
  const renameTag = useTagStore(s => s.renameTag);
  const setColour = useTagStore(s => s.setColour);
  const notes = useNotesStore(s => s.notes);
  const updateNote = useNotesStore(s => s.updateNote);

  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColour, setEditColour] = useState('');

  // Count notes per tag
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.filter(n => !n.deletedAt).forEach(n => {
      n.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
    });
    return counts;
  }, [notes]);

  const handleDelete = (tagName: string) => {
    Alert.alert(
      'Delete Tag',
      `Remove "${tagName}" from all notes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Remove tag from all notes
            notes.forEach(n => {
              if (n.tags.includes(tagName)) {
                updateNote(n.id, { tags: n.tags.filter(t => t !== tagName) });
              }
            });
            deleteTag(tagName);
          },
        },
      ],
    );
  };

  const handleEditSave = () => {
    if (!editingTag) return;
    if (editName !== editingTag) {
      const newName = renameTag(editingTag, editName);
      if (newName) {
        // Rename in all notes
        notes.forEach(n => {
          if (n.tags.includes(editingTag)) {
            updateNote(n.id, { tags: n.tags.map(t => t === editingTag ? newName : t) });
          }
        });
      }
    }
    if (editColour) {
      setColour(editName || editingTag, editColour);
    }
    setEditingTag(null);
  };

  const openEdit = (tagName: string) => {
    const tag = tags.find(t => t.name === tagName);
    setEditName(tagName);
    setEditColour(tag?.colour || '');
    setEditingTag(tagName);
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparky size={36} />
          <Text style={[styles.title, { color: theme.titleColor || theme.textDark }]}>
            Tags
          </Text>
        </View>
      </View>

      {tags.length === 0 ? (
        <EmptyState message="No tags yet. Add tags to your notes to organise them!" />
      ) : (
        <FlatList
          data={tags}
          keyExtractor={(t) => t.name}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => { lightTap(); openEdit(item.name); }}
              style={[styles.tagRow, { borderBottomColor: theme.glassBorder }]}
            >
              <View style={[styles.colorDot, { backgroundColor: item.colour }]} />
              <Text style={[styles.tagName, { color: theme.textDark }]}>
                #{item.name}
              </Text>
              <Text style={[styles.count, { color: theme.textMuted }]}>
                {tagCounts[item.name] || 0}
              </Text>
              <Pressable
                onPress={() => handleDelete(item.name)}
                accessibilityLabel={`Delete tag ${item.name}`}
                hitSlop={8}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteText}>×</Text>
              </Pressable>
            </Pressable>
          )}
        />
      )}

      {/* Edit tag modal */}
      <Modal
        visible={editingTag !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingTag(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setEditingTag(null)}>
          <View style={[styles.editSheet, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder, borderRadius: theme.radius }]}>
            <Text style={[styles.editTitle, { color: theme.textDark }]}>Edit Tag</Text>
            <TextInput
              style={[styles.editInput, { color: theme.textDark, borderColor: theme.glassBorder, borderRadius: theme.radiusSm }]}
              value={editName}
              onChangeText={setEditName}
              maxLength={20}
              autoCapitalize="none"
            />
            <ColourPicker selected={editColour} onSelect={setEditColour} />
            <Pressable
              onPress={handleEditSave}
              style={[styles.saveBtn, { backgroundColor: theme.pinkAccent, borderRadius: theme.radiusSm }]}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
    minHeight: 44,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  tagName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  count: {
    fontSize: 13,
  },
  deleteBtn: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: 20,
    color: '#ef4444',
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editSheet: {
    width: 280,
    padding: 20,
    borderWidth: 1,
  },
  editTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  editInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    marginBottom: 12,
  },
  saveBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    minHeight: 44,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
